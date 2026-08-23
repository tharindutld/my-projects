const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verifyStaff } = require('../middleware/auth');

// 1. GET INVENTORY (paginated + search) — Admin & Sales person
router.get('/', verifyStaff(['Admin', 'Sales person']), async (req, res) => {
  const { search, page = 1, limit = 15 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let whereClause = '';
  const params = [];

  if (search) {
    whereClause = `WHERE (
      p.ProductName LIKE ? OR p.BrandName LIKE ? OR p.ModelNumber LIKE ?
      OR v.Color LIKE ? OR v.RAM LIKE ? OR v.ROM LIKE ?
    )`;
    const s = `%${search}%`;
    params.push(s, s, s, s, s, s);
  }

  try {
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) as total FROM tblproduct_variants v JOIN tblproducts p ON v.ProductId = p.ID ${whereClause}`,
      params
    );

    const [rows] = await pool.query(
      `SELECT v.ID as variantId, p.ProductName, p.BrandName, p.ModelNumber, p.Status,
              v.Color, v.RAM, v.ROM, v.Stock,
              COALESCE(SUM(oi.ProductQty), 0) as soldQty
       FROM tblproduct_variants v
       JOIN tblproducts p ON v.ProductId = p.ID
       LEFT JOIN tbl_order_items oi ON v.ID = oi.VariantId
       LEFT JOIN tbl_order_master om ON oi.OrderMasterId = om.ID AND om.OrderStatus = 'Completed'
       ${whereClause}
       GROUP BY v.ID
       ORDER BY p.ProductName ASC, v.Color ASC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    const items = rows.map(r => ({
      ...r,
      initial: r.Stock + parseInt(r.soldQty)
    }));

    res.json({
      items,
      totalRows: total,
      totalPages: Math.ceil(total / parseInt(limit)),
      page: parseInt(page)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching inventory' });
  }
});

// 2. GET LOW STOCK items (≤ 5 units, active products) — Admin & Sales person
router.get('/low-stock', verifyStaff(['Admin', 'Sales person']), async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT v.ID as variantId, p.ProductName, v.Color, v.RAM, v.ROM, v.Stock
       FROM tblproduct_variants v
       JOIN tblproducts p ON v.ProductId = p.ID
       WHERE v.Stock <= 5 AND p.Status = 1
       ORDER BY v.Stock ASC`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching low stock' });
  }
});

// 3. POST STOCK ADJUSTMENT — Admin only
router.post('/adjust', verifyStaff(['Admin']), async (req, res) => {
  const { variantId, qtyAdjust, movementType, notes } = req.body;

  if (!variantId || qtyAdjust === undefined || qtyAdjust === 0 || !movementType || !notes) {
    return res.status(400).json({ message: 'All fields are required and quantity must not be zero.' });
  }

  const qty = parseInt(qtyAdjust);
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    const [[variant]] = await conn.query(
      `SELECT v.Stock, p.ProductName, v.Color, v.RAM, v.ROM
       FROM tblproduct_variants v JOIN tblproducts p ON v.ProductId = p.ID
       WHERE v.ID = ?`,
      [variantId]
    );

    if (!variant) {
      await conn.rollback();
      return res.status(404).json({ message: 'Variant not found.' });
    }

    let newStock = variant.Stock + qty;
    const actualQty = newStock < 0 ? -variant.Stock : qty;
    if (newStock < 0) newStock = 0;

    await conn.query('UPDATE tblproduct_variants SET Stock = ? WHERE ID = ?', [newStock, variantId]);
    await conn.query(
      'INSERT INTO tbl_stock_log (VariantId, Quantity, MovementType, ReferenceInfo) VALUES (?, ?, ?, ?)',
      [variantId, actualQty, movementType, notes]
    );

    await conn.commit();

    const desc = `${variant.ProductName} — ${variant.Color} (${variant.ROM} / ${variant.RAM})`;
    res.json({
      message: `Stock for ${desc} updated to ${newStock} units successfully.`,
      newStock
    });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ message: 'Server error adjusting stock' });
  } finally {
    conn.release();
  }
});

module.exports = router;
