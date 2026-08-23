const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verifyToken } = require('../middleware/auth');

// 1. Fetch Wishlist Items
router.get('/', verifyToken, async (req, res) => {
  const userid = req.user.id;

  try {
    const [rows] = await pool.query(
      `SELECT w.ID as WishID, w.ProductId as PID, p.ProductName, p.BrandName, p.ModelNumber, p.Image1,
              (SELECT MIN(v.Price) FROM tblproduct_variants v WHERE v.ProductId = p.ID) as MinPrice,
              (SELECT SUM(v.Stock) FROM tblproduct_variants v WHERE v.ProductId = p.ID) as TotalStock
       FROM tblwish w
       JOIN tblproducts p ON w.ProductId = p.ID
       WHERE w.UserId = ?`,
      [userid]
    );

    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching wishlist' });
  }
});

// 2. Add Product to Wishlist
router.post('/', verifyToken, async (req, res) => {
  const userid = req.user.id;
  const { productId } = req.body;

  if (!productId) {
    return res.status(400).json({ message: 'Product ID is required' });
  }

  try {
    // Check if product exists
    const [products] = await pool.query('SELECT ID FROM tblproducts WHERE ID = ?', [productId]);
    if (products.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if already in wishlist
    const [existing] = await pool.query(
      'SELECT ID FROM tblwish WHERE UserId = ? AND ProductId = ?',
      [userid, productId]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: 'This item is already in your wishlist!' });
    }

    await pool.query(
      'INSERT INTO tblwish (UserId, ProductId) VALUES (?, ?)',
      [userid, productId]
    );

    res.json({ message: 'Mobile added to your wishlist!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// 3. Remove Item from Wishlist by Wish ID
router.delete('/:wishId', verifyToken, async (req, res) => {
  const userid = req.user.id;
  const { wishId } = req.params;

  try {
    const [result] = await pool.query(
      'DELETE FROM tblwish WHERE ID = ? AND UserId = ?',
      [wishId, userid]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Wishlist item not found or unauthorized' });
    }

    res.json({ message: 'Item removed from wishlist' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error removing wishlist item' });
  }
});

// 4. Remove Item from Wishlist by Product ID
router.delete('/product/:productId', verifyToken, async (req, res) => {
  const userid = req.user.id;
  const { productId } = req.params;

  try {
    const [result] = await pool.query(
      'DELETE FROM tblwish WHERE ProductId = ? AND UserId = ?',
      [productId, userid]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Wishlist item not found or unauthorized' });
    }

    res.json({ message: 'Item removed from wishlist' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error removing wishlist item' });
  }
});

module.exports = router;
