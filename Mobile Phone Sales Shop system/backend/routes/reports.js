const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verifyStaff } = require('../middleware/auth');

// 1. GET DASHBOARD METRICS & CHARTS DATA
router.get('/dashboard', verifyStaff(['Admin', 'Sales person', 'Technician']), async (req, res) => {
  const { id: staffId, role: staffRole } = req.user;

  try {
    // KPI counts
    const [[{ brandcount }]] = await pool.query("SELECT COUNT(*) as brandcount FROM tblbrand WHERE Status = 1");
    const [[{ productcount }]] = await pool.query("SELECT COUNT(*) as productcount FROM tblproducts WHERE Status = 1");
    const [[{ totuser }]] = await pool.query("SELECT COUNT(*) as totuser FROM tbluser");
    const [[{ staffcount }]] = await pool.query("SELECT COUNT(*) as staffcount FROM staff_users WHERE status = 'Active'");
    const [[{ salescount }]] = await pool.query("SELECT SUM(TotalAmount) as salescount FROM tbl_order_master WHERE OrderStatus = 'Completed'");
    const [[{ ordercount }]] = await pool.query("SELECT COUNT(*) as ordercount FROM tbl_order_master");

    // Low & out of stock
    const [[{ low_stock_count }]] = await pool.query(
      "SELECT COUNT(*) as low_stock_count FROM tblproduct_variants v JOIN tblproducts p ON v.ProductId = p.ID WHERE v.Stock <= 5 AND v.Stock > 0 AND p.Status = 1"
    );
    const [[{ out_stock_count }]] = await pool.query(
      "SELECT COUNT(*) as out_stock_count FROM tblproduct_variants v JOIN tblproducts p ON v.ProductId = p.ID WHERE v.Stock = 0 AND p.Status = 1"
    );

    // Tech specific stats
    const [[{ tech_pending }]] = await pool.query("SELECT COUNT(*) as tech_pending FROM tbl_repairs WHERE TechnicianId = ? AND Status = 'Pending'", [staffId]);
    const [[{ tech_inprog }]] = await pool.query("SELECT COUNT(*) as tech_inprog FROM tbl_repairs WHERE TechnicianId = ? AND Status = 'In-progress'", [staffId]);
    const [[{ tech_completed }]] = await pool.query("SELECT COUNT(*) as tech_completed FROM tbl_repairs WHERE TechnicianId = ? AND Status = 'Completed'", [staffId]);
    const [[{ tech_total }]] = await pool.query("SELECT COUNT(*) as tech_total FROM tbl_repairs WHERE TechnicianId = ?", [staffId]);

    // Monthly sales trend (last 6 months)
    const [salesTrend] = await pool.query(
      `SELECT DATE_FORMAT(OrderDate, '%b %Y') as MonthLabel, SUM(TotalAmount) as MonthlyRevenue, MAX(OrderDate) as max_date
       FROM tbl_order_master 
       WHERE OrderStatus = 'Completed' 
       GROUP BY YEAR(OrderDate), MONTH(OrderDate)
       ORDER BY max_date ASC 
       LIMIT 6`
    );

    // Brand distribution (top 5)
    const [brandDistribution] = await pool.query(
      `SELECT BrandName, COUNT(*) as ProductCount 
       FROM tblproducts 
       WHERE Status = 1 
       GROUP BY BrandName 
       ORDER BY ProductCount DESC 
       LIMIT 5`
    );

    res.json({
      kpis: {
        brandcount,
        productcount,
        totuser,
        staffcount,
        salescount: parseFloat(salescount || 0),
        ordercount,
        low_stock_count,
        out_stock_count
      },
      techStats: {
        tech_pending,
        tech_inprog,
        tech_completed,
        tech_total
      },
      charts: {
        salesTrend,
        brandDistribution
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error loading dashboard reports' });
  }
});

// 2. GET DETAILED LOW STOCK LIST
router.get('/low-stock', verifyStaff(['Admin', 'Sales person']), async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.ProductName, p.BrandName, p.ModelNumber, v.ID as VariantId, v.Stock, v.Color, v.RAM, v.ROM 
       FROM tblproduct_variants v 
       JOIN tblproducts p ON v.ProductId = p.ID 
       WHERE v.Stock <= 5 AND p.Status = 1 
       ORDER BY v.Stock ASC`
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// 3. GET REPORTS SUMMARY — for AdminReports.jsx
router.get('/summary', verifyStaff(['Admin', 'Sales person']), async (req, res) => {
  try {
    const [[{ todaySales }]] = await pool.query(
      "SELECT COALESCE(SUM(TotalAmount), 0) as todaySales FROM tbl_order_master WHERE DATE(OrderDate) = CURDATE() AND OrderStatus = 'Completed'"
    );
    const [[{ totalStock }]] = await pool.query(
      "SELECT COALESCE(SUM(v.Stock), 0) as totalStock FROM tblproduct_variants v JOIN tblproducts p ON v.ProductId = p.ID WHERE p.Status = 1"
    );
    const [[{ totalCustomers }]] = await pool.query("SELECT COUNT(*) as totalCustomers FROM tbluser");
    const [[{ totalStaff }]] = await pool.query("SELECT COUNT(*) as totalStaff FROM staff_users WHERE status = 'Active'");
    const [[{ monthSales }]] = await pool.query(
      "SELECT COALESCE(SUM(TotalAmount), 0) as monthSales FROM tbl_order_master WHERE MONTH(OrderDate) = MONTH(CURDATE()) AND YEAR(OrderDate) = YEAR(CURDATE()) AND OrderStatus = 'Completed'"
    );
    const [[{ lowStockCount }]] = await pool.query(
      "SELECT COUNT(*) as lowStockCount FROM tblproduct_variants v JOIN tblproducts p ON v.ProductId = p.ID WHERE v.Stock <= 5 AND p.Status = 1"
    );

    // Best performing brand
    const [bestBrandRows] = await pool.query(
      `SELECT p.BrandName, SUM(oi.ProductQty * oi.ProductPrice) as revenue
       FROM tbl_order_items oi
       JOIN tblproduct_variants v ON oi.VariantId = v.ID
       JOIN tblproducts p ON v.ProductId = p.ID
       JOIN tbl_order_master m ON oi.OrderMasterId = m.ID
       WHERE m.OrderStatus = 'Completed'
       GROUP BY p.BrandName ORDER BY revenue DESC LIMIT 1`
    );
    const bestBrand = bestBrandRows.length > 0 ? bestBrandRows[0].BrandName : 'N/A';

    // Top location
    const [locRows] = await pool.query(
      "SELECT ShippingPostalCode, COUNT(*) as cnt FROM tbl_order_master GROUP BY ShippingPostalCode ORDER BY cnt DESC LIMIT 1"
    );
    let topLocation = 'N/A';
    if (locRows.length > 0) {
      const pc = locRows[0].ShippingPostalCode;
      if (pc === '00300') topLocation = 'Colombo 03';
      else if (pc === '20400') topLocation = 'Kandy';
      else if (pc === '60000') topLocation = 'Kurunegala';
      else topLocation = `Postal: ${pc}`;
    }

    // Monthly sales trend
    const [monthlySales] = await pool.query(
      `SELECT month_label, rev FROM (
        SELECT DATE_FORMAT(OrderDate, '%b %Y') as month_label, SUM(TotalAmount) as rev, MAX(OrderDate) as max_date
        FROM tbl_order_master WHERE OrderStatus = 'Completed'
        GROUP BY YEAR(OrderDate), MONTH(OrderDate) ORDER BY max_date DESC LIMIT 6
       ) sub ORDER BY max_date ASC`
    );

    res.json({
      todaySales: parseFloat(todaySales),
      totalStock: parseInt(totalStock),
      totalCustomers: parseInt(totalCustomers),
      totalStaff: parseInt(totalStaff),
      monthSales: parseFloat(monthSales),
      lowStockCount: parseInt(lowStockCount),
      bestBrand,
      topLocation,
      monthlySales
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error loading report summary' });
  }
});

module.exports = router;

