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

// Helper for sales person scope
const getStaffScope = (user) => {
  if (user.role === 'Sales person') {
    return { isSales: true, staffId: user.id };
  }
  return { isSales: false, staffId: null };
};

// 4. REPORT 1: DAILY SALES
router.get('/daily-sales', verifyStaff(['Admin', 'Sales person']), async (req, res) => {
  try {
    const { date_from, date_to, payment_method, page = 1, limit = 10 } = req.query;
    const scope = getStaffScope(req.user);

    let whereClauses = ["m.OrderStatus = 'Completed'"];
    let params = [];

    if (scope.isSales) {
      whereClauses.push("m.ProcessedById = ?");
      params.push(scope.staffId);
    }
    if (date_from) {
      whereClauses.push("m.OrderDate >= ?");
      params.push(`${date_from} 00:00:00`);
    }
    if (date_to) {
      whereClauses.push("m.OrderDate <= ?");
      params.push(`${date_to} 23:59:59`);
    }
    if (payment_method) {
      whereClauses.push("m.PaymentMethod = ?");
      params.push(payment_method);
    }

    const whereSql = whereClauses.join(' AND ');

    // Total count
    const [[{ total }]] = await pool.query(`SELECT COUNT(*) as total FROM tbl_order_master m WHERE ${whereSql}`, params);

    // Paginated orders
    const offset = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);
    const [orders] = await pool.query(
      `SELECT m.ID, m.OrderDate, m.PaymentMethod, m.TotalAmount, m.ShippingAddress, m.OrderStatus,
              u.FirstName, u.LastName, u.Email
       FROM tbl_order_master m
       LEFT JOIN tbluser u ON m.UserId = u.ID
       WHERE ${whereSql}
       ORDER BY m.OrderDate DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    // Calculate items, cost, profit per order
    const enrichedOrders = await Promise.all(orders.map(async (ord) => {
      const [items] = await pool.query(
        `SELECT oi.ProductQty, oi.ProductPrice, oi.VariantId
         FROM tbl_order_items oi
         WHERE oi.OrderMasterId = ?`,
        [ord.ID]
      );

      let orderCost = 0;
      let totalItemsCount = 0;
      for (const item of items) {
        totalItemsCount += item.ProductQty;
        const [[batchRow]] = await pool.query(
          `SELECT CostPrice FROM tbl_stock_batches WHERE VariantId = ? LIMIT 1`,
          [item.VariantId]
        );
        const unitCost = batchRow?.CostPrice ? parseFloat(batchRow.CostPrice) : parseFloat(item.ProductPrice) * 0.75;
        orderCost += unitCost * item.ProductQty;
      }

      const grossAmount = parseFloat(ord.TotalAmount || 0);
      const netProfit = grossAmount - orderCost;

      return {
        ...ord,
        totalItemsCount,
        orderCost,
        netProfit
      };
    }));

    // Overall Summary KPI totals
    const [[summaryRow]] = await pool.query(
      `SELECT COUNT(m.ID) as totalOrdersCount, COALESCE(SUM(m.TotalAmount), 0) as totalRevenue
       FROM tbl_order_master m WHERE ${whereSql}`,
      params
    );

    // Total cost & profit over all filtered orders
    const [allItems] = await pool.query(
      `SELECT oi.ProductQty, oi.ProductPrice, oi.VariantId
       FROM tbl_order_items oi
       JOIN tbl_order_master m ON oi.OrderMasterId = m.ID
       WHERE ${whereSql}`,
      params
    );
    let totalCostAll = 0;
    for (const item of allItems) {
      const [[bRow]] = await pool.query(
        `SELECT CostPrice FROM tbl_stock_batches WHERE VariantId = ? LIMIT 1`,
        [item.VariantId]
      );
      const unitCost = bRow?.CostPrice ? parseFloat(bRow.CostPrice) : parseFloat(item.ProductPrice) * 0.75;
      totalCostAll += unitCost * item.ProductQty;
    }
    const totalRevenueAll = parseFloat(summaryRow.totalRevenue || 0);
    const netProfitAll = totalRevenueAll - totalCostAll;

    // Repairs revenue (if no payment filter or Cash)
    let repairRevenue = 0;
    let repairCost = 0;
    if (!payment_method || payment_method === 'Cash') {
      let repairWhere = ["Status = 'Completed'"];
      let repairParams = [];
      if (date_from) {
        repairWhere.push("RepairDate >= ?");
        repairParams.push(date_from);
      }
      if (date_to) {
        repairWhere.push("RepairDate <= ?");
        repairParams.push(date_to);
      }
      const [[rRow]] = await pool.query(
        `SELECT COALESCE(SUM(Income), 0) as rRev, COALESCE(SUM(Cost), 0) as rCost FROM tbl_repairs WHERE ${repairWhere.join(' AND ')}`,
        repairParams
      );
      repairRevenue = parseFloat(rRow?.rRev || 0);
      repairCost = parseFloat(rRow?.rCost || 0);
    }

    // Payment Mode Distribution
    const [paymentModeDist] = await pool.query(
      `SELECT m.PaymentMethod, COUNT(m.ID) as OrderCount, SUM(m.TotalAmount) as ModeRevenue
       FROM tbl_order_master m
       WHERE ${whereSql}
       GROUP BY m.PaymentMethod`,
      params
    );

    // Hourly Sales Distribution
    const [hourlySales] = await pool.query(
      `SELECT HOUR(m.OrderDate) as HourLabel, COUNT(m.ID) as OrderCount, SUM(m.TotalAmount) as HourlyRevenue
       FROM tbl_order_master m
       WHERE ${whereSql}
       GROUP BY HOUR(m.OrderDate)
       ORDER BY HourLabel ASC`,
      params
    );

    res.json({
      orders: enrichedOrders,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      summary: {
        totalRevenue: totalRevenueAll,
        totalCost: totalCostAll,
        netProfit: netProfitAll,
        repairRevenue,
        repairCost,
        grandTotalRevenue: totalRevenueAll + repairRevenue,
        grandNetProfit: netProfitAll + (repairRevenue - repairCost)
      },
      paymentModeDist,
      hourlySales
    });
  } catch (error) {
    console.error('Daily sales report error:', error);
    res.status(500).json({ message: 'Server error loading daily sales report' });
  }
});

// 5. REPORT 2: INVENTORY AGING
router.get('/inventory-aging', verifyStaff(['Admin', 'Sales person']), async (req, res) => {
  try {
    const { aging_filter = '', page = 1, limit = 10 } = req.query;

    const [variants] = await pool.query(
      `SELECT v.ID as VariantId, v.Stock, v.Color, v.RAM, v.ROM, v.Price, v.CreationDate as VariantCreatedAt,
              p.ProductName, p.BrandName, p.ModelNumber, p.CreationDate as PostingDate
       FROM tblproduct_variants v
       JOIN tblproducts p ON v.ProductId = p.ID
       WHERE p.Status = 1 OR p.Status = '1'
       ORDER BY v.Stock DESC`
    );

    const now = new Date();
    let deadStockCount = 0;
    let slowMovingCount = 0;
    let healthyCount = 0;
    let totalValuation = 0;

    const allItems = await Promise.all(variants.map(async (v) => {
      // Cost price
      const [[bRow]] = await pool.query(
        `SELECT CostPrice, CreatedDate FROM tbl_stock_batches WHERE VariantId = ? LIMIT 1`,
        [v.VariantId]
      );
      const costPrice = bRow?.CostPrice ? parseFloat(bRow.CostPrice) : parseFloat(v.Price) * 0.75;
      const stockValuation = costPrice * v.Stock;

      // Last order date
      const [[lastSaleRow]] = await pool.query(
        `SELECT MAX(m.OrderDate) as LastSaleDate
         FROM tbl_order_items oi
         JOIN tbl_order_master m ON oi.OrderMasterId = m.ID
         WHERE oi.VariantId = ? AND m.OrderStatus = 'Completed'`,
        [v.VariantId]
      );

      const refDateStr = lastSaleRow?.LastSaleDate || bRow?.CreatedDate || v.VariantCreatedAt || v.PostingDate;
      const refDate = refDateStr ? new Date(refDateStr) : now;
      const diffMs = now - refDate;
      const daysUnsold = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

      let status = 'Healthy';
      if (daysUnsold > 180) {
        status = 'Dead Stock';
        deadStockCount++;
      } else if (daysUnsold >= 90) {
        status = 'Slow Moving';
        slowMovingCount++;
      } else {
        healthyCount++;
      }

      totalValuation += stockValuation;

      return {
        ...v,
        costPrice,
        stockValuation,
        lastSaleDate: lastSaleRow?.LastSaleDate || null,
        daysUnsold,
        status
      };
    }));

    // Sort by days unsold descending
    allItems.sort((a, b) => b.daysUnsold - a.daysUnsold);

    // Filter matching
    const filteredItems = allItems.filter(item => aging_filter === '' || item.status === aging_filter);

    const total = filteredItems.length;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;
    const paginatedItems = filteredItems.slice(offset, offset + limitNum);

    res.json({
      items: paginatedItems,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      summary: {
        deadStockCount,
        slowMovingCount,
        healthyCount,
        totalValuation,
        totalCatalog: allItems.length
      }
    });
  } catch (error) {
    console.error('Inventory aging error:', error);
    res.status(500).json({ message: 'Server error loading inventory aging report' });
  }
});

// 6. REPORT 3: PROFIT MARGINS
router.get('/profit-margins', verifyStaff(['Admin', 'Sales person']), async (req, res) => {
  try {
    const { margin_tier = '', min_margin = '', page = 1, limit = 10 } = req.query;

    const [variants] = await pool.query(
      `SELECT v.ID as VariantId, v.Color, v.RAM, v.ROM, v.Price,
              p.ProductName, p.BrandName, p.ModelNumber,
              (SELECT CostPrice FROM tbl_stock_batches WHERE VariantId = v.ID LIMIT 1) as BatchedCostPrice,
              (SELECT COUNT(*) FROM tbl_stock_batches WHERE VariantId = v.ID) as BatchCount
       FROM tblproduct_variants v
       JOIN tblproducts p ON v.ProductId = p.ID
       WHERE p.Status = 1`
    );

    let highMarginCount = 0;
    let lowProfitCount = 0;
    let standardCount = 0;

    const allItems = variants.map(v => {
      const retail = parseFloat(v.Price || 0);
      const cost = v.BatchedCostPrice ? parseFloat(v.BatchedCostPrice) : retail * 0.75;
      const costType = v.BatchCount > 0 ? 'Batched Cost' : 'Estimated';

      const unitProfit = retail - cost;
      const marginPct = retail > 0 ? (unitProfit / retail) * 100 : 0;

      let tier = 'Standard';
      if (marginPct >= 25) {
        tier = 'High Margin';
        highMarginCount++;
      } else if (marginPct < 15) {
        tier = 'Low Profit';
        lowProfitCount++;
      } else {
        standardCount++;
      }

      return {
        ...v,
        costPrice: cost,
        costType,
        unitProfit,
        marginPct,
        marginTier: tier
      };
    });

    allItems.sort((a, b) => b.marginPct - a.marginPct);

    // Apply filters
    const filteredItems = allItems.filter(item => {
      const matchesTier = margin_tier === '' || item.marginTier === margin_tier;
      const matchesMin = min_margin === '' || item.marginPct >= parseFloat(min_margin);
      return matchesTier && matchesMin;
    });

    const total = filteredItems.length;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;
    const paginatedItems = filteredItems.slice(offset, offset + limitNum);

    res.json({
      items: paginatedItems,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      summary: {
        highMarginCount,
        lowProfitCount,
        standardCount,
        totalInspected: allItems.length
      }
    });
  } catch (error) {
    console.error('Profit margins error:', error);
    res.status(500).json({ message: 'Server error loading profit margins report' });
  }
});

// 7. REPORT 4: CUSTOMER BEHAVIOR
router.get('/customer-behavior', verifyStaff(['Admin', 'Sales person']), async (req, res) => {
  try {
    const { search = '', min_spend = '', min_loyalty = '', page = 1, limit = 10 } = req.query;

    let whereClauses = ["m.OrderStatus = 'Completed'"];
    let params = [];

    if (search.trim()) {
      const cleanSearch = search.replace(/[^a-zA-Z\s]/g, '');
      if (cleanSearch) {
        whereClauses.push("(u.FirstName LIKE ? OR u.LastName LIKE ?)");
        params.push(`%${cleanSearch}%`, `%${cleanSearch}%`);
      }
    }
    if (min_loyalty !== '' && !isNaN(min_loyalty)) {
      whereClauses.push("u.LoyaltyPoints >= ?");
      params.push(parseInt(min_loyalty));
    }

    const whereSql = whereClauses.join(' AND ');
    let havingSql = '';
    let havingParams = [];
    if (min_spend !== '' && !isNaN(min_spend)) {
      havingSql = 'HAVING TotalSpend >= ?';
      havingParams.push(parseFloat(min_spend));
    }

    // Count customers
    const [countRows] = await pool.query(
      `SELECT COUNT(*) as total FROM (
        SELECT m.UserId, SUM(m.TotalAmount) as TotalSpend
        FROM tbl_order_master m
        JOIN tbluser u ON m.UserId = u.ID
        WHERE ${whereSql}
        GROUP BY m.UserId
        ${havingSql}
       ) as sub`,
      [...params, ...havingParams]
    );
    const total = countRows[0]?.total || 0;

    // Overall KPI spend sum & loyalty sum
    const [[kpiRow]] = await pool.query(
      `SELECT SUM(TotalSpend) as SpendSum, SUM(LoyaltyPoints) as LoyaltySum FROM (
        SELECT u.LoyaltyPoints, SUM(m.TotalAmount) as TotalSpend
        FROM tbl_order_master m
        JOIN tbluser u ON m.UserId = u.ID
        WHERE ${whereSql}
        GROUP BY m.UserId
        ${havingSql}
       ) sub`,
      [...params, ...havingParams]
    );

    const totalSpendAll = parseFloat(kpiRow?.SpendSum || 0);
    const totalLoyalty = parseInt(kpiRow?.LoyaltySum || 0);

    // Paginated customer records
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    const [customers] = await pool.query(
      `SELECT u.ID, u.FirstName, u.LastName, u.Email, u.RegDate, u.LoyaltyPoints,
              COUNT(m.ID) as TotalOrders, SUM(m.TotalAmount) as TotalSpend, AVG(m.TotalAmount) as AvgSpend
       FROM tbl_order_master m
       JOIN tbluser u ON m.UserId = u.ID
       WHERE ${whereSql}
       GROUP BY m.UserId
       ${havingSql}
       ORDER BY TotalSpend DESC
       LIMIT ? OFFSET ?`,
      [...params, ...havingParams, limitNum, offset]
    );

    const enrichedCustomers = await Promise.all(customers.map(async (c) => {
      // Favorite brand
      const [[brandRow]] = await pool.query(
        `SELECT p.BrandName, COUNT(oi.ID) as BrandCount
         FROM tbl_order_items oi
         JOIN tblproduct_variants v ON oi.VariantId = v.ID
         JOIN tblproducts p ON v.ProductId = p.ID
         JOIN tbl_order_master m ON oi.OrderMasterId = m.ID
         WHERE m.UserId = ? AND m.OrderStatus = 'Completed'
         GROUP BY p.BrandName
         ORDER BY BrandCount DESC LIMIT 1`,
        [c.ID]
      );

      const daysMember = Math.max(1, Math.floor((new Date() - new Date(c.RegDate)) / (1000 * 60 * 60 * 24)));
      const ordersPerMonth = (parseInt(c.TotalOrders) / daysMember) * 30;

      return {
        ...c,
        TotalOrders: parseInt(c.TotalOrders),
        TotalSpend: parseFloat(c.TotalSpend),
        AvgSpend: parseFloat(c.AvgSpend),
        fav_brand: brandRow?.BrandName || 'N/A',
        orders_per_month: ordersPerMonth,
        days_member: daysMember
      };
    }));

    const overallOrders = enrichedCustomers.reduce((acc, curr) => acc + curr.TotalOrders, 0);
    const overallAvg = overallOrders > 0 ? totalSpendAll / overallOrders : 0;

    res.json({
      customers: enrichedCustomers,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      summary: {
        totalSpendAll,
        totalLoyalty,
        overallAvg
      }
    });
  } catch (error) {
    console.error('Customer behavior error:', error);
    res.status(500).json({ message: 'Server error loading customer behavior report' });
  }
});

// 8. REPORT 5: BRAND PERFORMANCE
router.get('/brand-performance', verifyStaff(['Admin', 'Sales person']), async (req, res) => {
  try {
    const { date_from = '', date_to = '', product_name = '', page = 1, limit = 10 } = req.query;

    let whereClauses = ["m.OrderStatus = 'Completed'"];
    let params = [];

    if (date_from) {
      whereClauses.push("m.OrderDate >= ?");
      params.push(`${date_from} 00:00:00`);
    }
    if (date_to) {
      whereClauses.push("m.OrderDate <= ?");
      params.push(`${date_to} 23:59:59`);
    }
    if (product_name) {
      whereClauses.push("p.ProductName = ?");
      params.push(product_name);
    }

    const whereSql = whereClauses.join(' AND ');

    // Fetch products list for dropdown
    const [allProducts] = await pool.query(
      `SELECT DISTINCT ProductName FROM tblproducts WHERE Status = 1 ORDER BY ProductName ASC`
    );

    // KPI & Brands All query
    const [kpiRows] = await pool.query(
      `SELECT p.ProductName,
              SUM(oi.ProductQty) as UnitsSold,
              SUM(oi.ProductQty * oi.ProductPrice) as BrandRevenue
       FROM tbl_order_items oi
       JOIN tblproduct_variants v ON oi.VariantId = v.ID
       JOIN tblproducts p ON v.ProductId = p.ID
       JOIN tbl_order_master m ON oi.OrderMasterId = m.ID
       WHERE ${whereSql}
       GROUP BY p.ProductName
       ORDER BY BrandRevenue DESC`,
      params
    );

    let totalRevenueAll = 0;
    let totalProfitAll = 0;
    let totalReturnsAll = 0;
    const highDefectBrands = [];

    const brandsAll = await Promise.all(kpiRows.map(async (row) => {
      const bname = row.ProductName;
      const unitsSold = parseInt(row.UnitsSold || 0);
      const brandRevenue = parseFloat(row.BrandRevenue || 0);

      // Cost query
      const [[costRow]] = await pool.query(
        `SELECT SUM(oi.ProductQty * IFNULL((SELECT CostPrice FROM tbl_stock_batches WHERE VariantId = oi.VariantId LIMIT 1), oi.ProductPrice * 0.75)) as total_cost
         FROM tbl_order_items oi
         JOIN tblproduct_variants v ON oi.VariantId = v.ID
         JOIN tblproducts p ON v.ProductId = p.ID
         JOIN tbl_order_master m ON oi.OrderMasterId = m.ID
         WHERE p.ProductName = ? AND ${whereSql}`,
        [bname, ...params]
      );
      const totalCost = parseFloat(costRow?.total_cost || 0);
      const brandProfit = brandRevenue - totalCost;

      // Returns query
      const [[returnRow]] = await pool.query(
        `SELECT COUNT(r.ID) as return_count
         FROM tbl_returns r
         JOIN tblproduct_variants v ON r.VariantId = v.ID
         JOIN tblproducts p ON v.ProductId = p.ID
         WHERE p.ProductName = ?`,
        [bname]
      );
      const returnCount = parseInt(returnRow?.return_count || 0);
      const returnRate = unitsSold > 0 ? (returnCount / unitsSold) * 100 : 0;

      totalRevenueAll += brandRevenue;
      totalProfitAll += brandProfit;
      totalReturnsAll += returnCount;

      if (returnRate > 5.0) {
        highDefectBrands.push(`${bname} (${returnRate.toFixed(1)}%)`);
      }

      return {
        ProductName: bname,
        UnitsSold: unitsSold,
        BrandRevenue: brandRevenue,
        brand_profit: brandProfit,
        return_count: returnCount,
        return_rate: returnRate
      };
    }));

    const total = brandsAll.length;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;
    const paginatedBrands = brandsAll.slice(offset, offset + limitNum);

    res.json({
      brands: paginatedBrands,
      brandsAll,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      summary: {
        totalRevenueAll,
        totalProfitAll,
        totalReturnsAll,
        highDefectBrands
      },
      allProducts: allProducts.map(p => p.ProductName)
    });
  } catch (error) {
    console.error('Brand performance error:', error);
    res.status(500).json({ message: 'Server error loading brand performance report' });
  }
});

// 9. REPORT 6: EMPLOYEE PERFORMANCE
router.get('/employee-performance', verifyStaff(['Admin', 'Sales person']), async (req, res) => {
  try {
    const { date_from = '', date_to = '', role_filter = '', page = 1, limit = 10 } = req.query;

    let whereClauses = ["status = 'Active'"];
    let params = [];

    if (role_filter) {
      whereClauses.push("role = ?");
      params.push(role_filter);
    }

    const whereSql = whereClauses.join(' AND ');

    const [staffList] = await pool.query(
      `SELECT id, first_name, last_name, role, email FROM staff_users WHERE ${whereSql}`,
      params
    );

    let totalRevenueStaff = 0;
    let totalRepairsStaff = 0;

    const staffAll = await Promise.all(staffList.map(async (st) => {
      const staffId = st.id;

      // Sales query
      let salesWhere = ["ProcessedById = ?", "OrderStatus = 'Completed'"];
      let salesParams = [staffId];
      if (date_from) {
        salesWhere.push("OrderDate >= ?");
        salesParams.push(`${date_from} 00:00:00`);
      }
      if (date_to) {
        salesWhere.push("OrderDate <= ?");
        salesParams.push(`${date_to} 23:59:59`);
      }
      const [[salesRow]] = await pool.query(
        `SELECT COUNT(ID) as sales_count, IFNULL(SUM(TotalAmount), 0) as sales_revenue
         FROM tbl_order_master WHERE ${salesWhere.join(' AND ')}`,
        salesParams
      );

      // Repairs query
      let repairsWhere = ["TechnicianId = ?", "Status = 'Completed'"];
      let repairsParams = [staffId];
      if (date_from) {
        repairsWhere.push("RepairDate >= ?");
        repairsParams.push(date_from);
      }
      if (date_to) {
        repairsWhere.push("RepairDate <= ?");
        repairsParams.push(date_to);
      }
      const [[repairsRow]] = await pool.query(
        `SELECT COUNT(ID) as repairs_count, IFNULL(SUM(Income), 0) as repair_revenue, IFNULL(SUM(Income - Cost), 0) as repair_profit
         FROM tbl_repairs WHERE ${repairsWhere.join(' AND ')}`,
        repairsParams
      );

      // Feedback query
      const [[ratingRow]] = await pool.query(
        `SELECT AVG(Rating) as avg_rating, COUNT(ID) as feedback_count
         FROM tbl_employee_feedback WHERE EmployeeId = ?`,
        [staffId]
      );

      const salesCount = parseInt(salesRow?.sales_count || 0);
      const salesRevenue = parseFloat(salesRow?.sales_revenue || 0);
      const repairsCount = parseInt(repairsRow?.repairs_count || 0);
      const repairRevenue = parseFloat(repairsRow?.repair_revenue || 0);
      const repairProfit = parseFloat(repairsRow?.repair_profit || 0);
      const avgRating = parseFloat(ratingRow?.avg_rating || 0);
      const feedbackCount = parseInt(ratingRow?.feedback_count || 0);
      const totalRevenue = salesRevenue + repairRevenue;

      totalRevenueStaff += totalRevenue;
      totalRepairsStaff += repairsCount;

      return {
        ...st,
        sales_count: salesCount,
        sales_revenue: salesRevenue,
        repairs_count: repairsCount,
        repair_revenue: repairRevenue,
        repair_profit: repairProfit,
        avg_rating: avgRating,
        feedback_count: feedbackCount,
        total_revenue: totalRevenue
      };
    }));

    // Find star performer & low rating staff
    let maxRev = -1;
    let starPerformer = null;
    const lowRatingStaff = [];

    staffAll.forEach(s => {
      if (s.total_revenue > maxRev) {
        maxRev = s.total_revenue;
        starPerformer = `${s.first_name} ${s.last_name}`;
      }
      if (s.feedback_count > 0 && s.avg_rating < 4.0) {
        lowRatingStaff.push(`${s.first_name} ${s.last_name} (${s.avg_rating.toFixed(1)}★)`);
      }
    });

    const total = staffAll.length;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;
    const paginatedStaff = staffAll.slice(offset, offset + limitNum);

    res.json({
      staff: paginatedStaff,
      staffAll,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      summary: {
        totalRevenueStaff,
        totalRepairsStaff,
        starPerformer: maxRev > 0 ? starPerformer : null,
        starPerformerRev: maxRev,
        lowRatingStaff
      }
    });
  } catch (error) {
    console.error('Employee performance error:', error);
    res.status(500).json({ message: 'Server error loading employee performance report' });
  }
});

// 10. REPORT 7: SEASONAL TRENDS
router.get('/seasonal-trends', verifyStaff(['Admin', 'Sales person']), async (req, res) => {
  try {
    const { filter_year = new Date().getFullYear(), page = 1, limit = 10 } = req.query;
    const scope = getStaffScope(req.user);

    let whereClauses = ["OrderStatus = 'Completed'"];
    let params = [];

    if (scope.isSales) {
      whereClauses.push("ProcessedById = ?");
      params.push(scope.staffId);
    }
    if (filter_year !== '') {
      whereClauses.push("YEAR(OrderDate) = ?");
      params.push(filter_year);
    }

    const whereSql = whereClauses.join(' AND ');

    // Available Years
    const [yearRows] = await pool.query(
      `SELECT DISTINCT YEAR(OrderDate) as Yr FROM tbl_order_master WHERE OrderStatus = 'Completed' ORDER BY Yr DESC`
    );

    // Monthly trends
    const [monthlyRows] = await pool.query(
      `SELECT YEAR(OrderDate) as SalesYear, MONTH(OrderDate) as SalesMonth,
              COUNT(ID) as TotalOrders, SUM(TotalAmount) as MonthlyRevenue
       FROM tbl_order_master
       WHERE ${whereSql}
       GROUP BY YEAR(OrderDate), MONTH(OrderDate)
       ORDER BY SalesYear DESC, SalesMonth DESC`,
      params
    );

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const monthlyTrends = monthlyRows.map(m => ({
      ...m,
      TotalOrders: parseInt(m.TotalOrders),
      MonthlyRevenue: parseFloat(m.MonthlyRevenue || 0),
      month_name: monthNames[m.SalesMonth - 1] || `Month ${m.SalesMonth}`
    }));

    const revenues = monthlyTrends.map(m => m.MonthlyRevenue);
    const avgMonthlyRev = revenues.length > 0 ? revenues.reduce((a, b) => a + b, 0) / revenues.length : 0;
    const maxRev = revenues.length > 0 ? Math.max(...revenues) : 0;
    const minRev = revenues.length > 0 ? Math.min(...revenues) : 0;

    // All Weekly Trends
    const [weeklyAll] = await pool.query(
      `SELECT WEEK(OrderDate) as SalesWeek, COUNT(ID) as TotalOrders, SUM(TotalAmount) as WeeklyRevenue
       FROM tbl_order_master
       WHERE ${whereSql}
       GROUP BY WEEK(OrderDate)
       ORDER BY SalesWeek DESC`,
      params
    );

    const weeklyTrendsAll = weeklyAll.map(w => ({
      SalesWeek: w.SalesWeek,
      TotalOrders: parseInt(w.TotalOrders),
      WeeklyRevenue: parseFloat(w.WeeklyRevenue || 0)
    }));

    const totalWeekly = weeklyTrendsAll.length;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;
    const paginatedWeekly = weeklyTrendsAll.slice(offset, offset + limitNum);

    res.json({
      monthlyTrends,
      weeklyTrends: paginatedWeekly,
      weeklyTrendsAll,
      totalWeekly,
      page: pageNum,
      totalPages: Math.ceil(totalWeekly / limitNum),
      summary: {
        avgMonthlyRev,
        maxRev,
        minRev
      },
      availableYears: yearRows.map(y => y.Yr)
    });
  } catch (error) {
    console.error('Seasonal trends error:', error);
    res.status(500).json({ message: 'Server error loading seasonal trends report' });
  }
});

// 11. REPORT 8: GEOGRAPHIC DISTRIBUTION
router.get('/geographic-distribution', verifyStaff(['Admin', 'Sales person']), async (req, res) => {
  try {
    const { date_from = '', date_to = '', postal_code = '', page = 1, limit = 10 } = req.query;
    const scope = getStaffScope(req.user);

    let whereClauses = ["OrderStatus = 'Completed'"];
    let params = [];

    if (scope.isSales) {
      whereClauses.push("ProcessedById = ?");
      params.push(scope.staffId);
    }
    if (date_from) {
      whereClauses.push("OrderDate >= ?");
      params.push(`${date_from} 00:00:00`);
    }
    if (date_to) {
      whereClauses.push("OrderDate <= ?");
      params.push(`${date_to} 23:59:59`);
    }
    if (postal_code) {
      whereClauses.push("ShippingPostalCode = ?");
      params.push(postal_code);
    }

    const whereSql = whereClauses.join(' AND ');

    const [geoAllRows] = await pool.query(
      `SELECT ShippingPostalCode, COUNT(ID) as OrderCount, SUM(TotalAmount) as TotalRevenue, AVG(TotalAmount) as AvgOrderValue
       FROM tbl_order_master
       WHERE ${whereSql}
       GROUP BY ShippingPostalCode
       ORDER BY TotalRevenue DESC`,
      params
    );

    let totalOrders = 0;
    let totalRev = 0;

    const geoDataAll = await Promise.all(geoAllRows.map(async (row) => {
      const postal = row.ShippingPostalCode || 'Unknown';
      let city = 'Other Region';
      let province = 'Other Region';

      if (postal === '00300') {
        city = 'Colombo 03';
        province = 'Western Province';
      } else if (postal === '20400') {
        city = 'Peradeniya';
        province = 'Central Province';
      } else if (postal === '60000') {
        city = 'Kurunegala';
        province = 'North Western Province';
      } else {
        const [[addrRow]] = await pool.query(
          `SELECT ShippingAddress FROM tbl_order_master WHERE ShippingPostalCode = ? LIMIT 1`,
          [postal]
        );
        if (addrRow?.ShippingAddress) {
          const parts = addrRow.ShippingAddress.split(',');
          const lastPart = parts[parts.length - 1].trim();
          if (lastPart) city = lastPart;
        }
        if (city === 'Other Region' || !city) city = `Postal Code: ${postal}`;
      }

      const oCount = parseInt(row.OrderCount || 0);
      const tRev = parseFloat(row.TotalRevenue || 0);
      const aVal = parseFloat(row.AvgOrderValue || 0);

      totalOrders += oCount;
      totalRev += tRev;

      return {
        ShippingPostalCode: postal,
        city,
        province,
        OrderCount: oCount,
        TotalRevenue: tRev,
        AvgOrderValue: aVal
      };
    }));

    const total = geoDataAll.length;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;
    const paginatedGeo = geoDataAll.slice(offset, offset + limitNum);

    const topCity = geoDataAll.length > 0 ? geoDataAll[0].city : 'N/A';

    res.json({
      geoData: paginatedGeo,
      geoDataAll,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      summary: {
        totalOrders,
        totalRev,
        topCity
      }
    });
  } catch (error) {
    console.error('Geographic distribution error:', error);
    res.status(500).json({ message: 'Server error loading geographic distribution report' });
  }
});

module.exports = router;


