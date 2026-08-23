const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verifyStaff } = require('../middleware/auth');

// 1. GET ALL PRICING/DISCOUNT DETAILS (Admin/Sales person only)
router.get('/', verifyStaff(['Admin', 'Sales person']), async (req, res) => {
  const { filterActive } = req.query;

  let query = `
    SELECT p.ID, p.ProductName, p.BrandName, p.CategoryName, p.ModelNumber, p.DiscountPercent, p.DiscountStartDate, p.DiscountEndDate,
           (SELECT MIN(v.Price) FROM tblproduct_variants v WHERE v.ProductId = p.ID) as MinPrice,
           (SELECT MAX(v.Price) FROM tblproduct_variants v WHERE v.ProductId = p.ID) as MaxPrice
    FROM tblproducts p
  `;

  if (filterActive === 'true') {
    query += ` WHERE p.DiscountPercent > 0 
               AND (p.DiscountStartDate IS NULL OR p.DiscountStartDate <= CURDATE()) 
               AND (p.DiscountEndDate IS NULL OR p.DiscountEndDate >= CURDATE())`;
  }

  query += ' ORDER BY p.ProductName ASC';

  try {
    const [rows] = await pool.query(query);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Helper to validate dates
const validateDiscountDates = (startDate, endDate) => {
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end < start) {
      return 'End date cannot be earlier than start date.';
    }
  }
  return null;
};

// 2. UPDATE PRICING FOR A SINGLE PRODUCT
router.post('/update', verifyStaff(['Admin', 'Sales person']), async (req, res) => {
  const { pid, discountPercent, startDate, endDate } = req.body;

  if (!pid) {
    return res.status(400).json({ message: 'Product ID is required.' });
  }

  const pct = parseFloat(discountPercent || 0);
  if (pct < 0 || pct > 100) {
    return res.status(400).json({ message: 'Discount percent must be between 0 and 100.' });
  }

  const dateError = validateDiscountDates(startDate, endDate);
  if (dateError) {
    return res.status(400).json({ message: dateError });
  }

  const startVal = startDate ? startDate : null;
  const endVal = endDate ? endDate : null;

  try {
    await pool.query(
      `UPDATE tblproducts 
       SET DiscountPercent = ?, DiscountStartDate = ?, DiscountEndDate = ? 
       WHERE ID = ?`,
      [pct, startVal, endVal, pid]
    );

    res.json({ message: 'Discount updated successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// 3. BULK UPDATE PRICING
router.post('/bulk-update', verifyStaff(['Admin', 'Sales person']), async (req, res) => {
  const { productIds, bulkDiscount, startDate, endDate } = req.body;

  if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
    return res.status(400).json({ message: 'Select at least one product for bulk update.' });
  }

  const pct = parseFloat(bulkDiscount || 0);
  if (pct < 0 || pct > 100) {
    return res.status(400).json({ message: 'Discount percent must be between 0 and 100.' });
  }

  const dateError = validateDiscountDates(startDate, endDate);
  if (dateError) {
    return res.status(400).json({ message: dateError });
  }

  const startVal = startDate ? startDate : null;
  const endVal = endDate ? endDate : null;

  try {
    await pool.query(
      `UPDATE tblproducts 
       SET DiscountPercent = ?, DiscountStartDate = ?, DiscountEndDate = ? 
       WHERE ID IN (?)`,
      [pct, startVal, endVal, productIds]
    );

    res.json({ message: `Bulk discount applied to ${productIds.length} products.` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// 4. RESET ALL DISCOUNTS
router.post('/reset-all', verifyStaff(['Admin', 'Sales person']), async (req, res) => {
  try {
    await pool.query('UPDATE tblproducts SET DiscountPercent = 0, DiscountStartDate = NULL, DiscountEndDate = NULL');
    res.json({ message: 'All discounts cleared successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
