const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verifyToken } = require('../middleware/auth');

// Helper to determine if discount is active
const isDiscountActive = (product) => {
  const percent = parseFloat(product.DiscountPercent || 0);
  if (percent <= 0) return false;

  const today = new Date().toISOString().slice(0, 10);
  const start = product.DiscountStartDate ? new Date(product.DiscountStartDate).toISOString().slice(0, 10) : null;
  const end = product.DiscountEndDate ? new Date(product.DiscountEndDate).toISOString().slice(0, 10) : null;

  if (!start && !end) return true;
  if (start && today < start) return false;
  if (end && today > end) return false;

  return true;
};

// Helper to get discounted price
const getDiscountedPrice = (product, originalPrice) => {
  const original = parseFloat(originalPrice);
  if (!isDiscountActive(product)) return original;
  const percent = parseFloat(product.DiscountPercent);
  return Math.round(original * (1 - percent / 100) * 100) / 100;
};

// 1. Fetch Cart Items
router.get('/', verifyToken, async (req, res) => {
  const userid = req.user.id;

  try {
    const [rows] = await pool.query(
      `SELECT o.ID as OrderID, o.Quantity, v.ID as VariantID, v.Color, v.RAM, v.ROM, v.Price as Price, v.Stock as Stock, 
              p.ID as PID, p.ProductName, p.BrandName, p.ModelNumber, p.DiscountPercent, p.DiscountStartDate, p.DiscountEndDate, p.Image1
       FROM tblorders o
       JOIN tblproduct_variants v ON o.VariantId = v.ID
       JOIN tblproducts p ON v.ProductId = p.ID
       WHERE o.UserId = ?`,
      [userid]
    );

    const cartItems = rows.map(item => {
      const active = isDiscountActive(item);
      const discountedPrice = getDiscountedPrice(item, item.Price);
      return {
        ...item,
        price: parseFloat(item.Price),
        discountedPrice,
        discountActive: active,
        subtotal: discountedPrice * item.Quantity
      };
    });

    res.json(cartItems);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching cart' });
  }
});

// 2. Add Item to Cart
router.post('/', verifyToken, async (req, res) => {
  const userid = req.user.id;
  const { variantId, qty = 1 } = req.body;

  if (!variantId) {
    return res.status(400).json({ message: 'Variant ID is required' });
  }

  const quantity = parseInt(qty);
  if (quantity < 1) {
    return res.status(400).json({ message: 'Quantity must be at least 1' });
  }

  try {
    // Check variant exists and get stock
    const [variants] = await pool.query(
      'SELECT Stock FROM tblproduct_variants WHERE ID = ?',
      [variantId]
    );

    if (variants.length === 0) {
      return res.status(404).json({ message: 'Product variant not found' });
    }

    const availableStock = parseInt(variants[0].Stock);
    if (availableStock <= 0) {
      return res.status(400).json({ message: 'Sorry, this selected configuration is currently out of stock!' });
    }

    if (quantity > availableStock) {
      return res.status(400).json({ message: `Requested quantity exceeds available stock (${availableStock} available).` });
    }

    // Check if variant already in user's cart
    const [existing] = await pool.query(
      'SELECT ID, Quantity FROM tblorders WHERE UserId = ? AND VariantId = ?',
      [userid, variantId]
    );

    if (existing.length > 0) {
      const newQty = parseInt(existing[0].Quantity) + quantity;
      if (newQty > availableStock) {
        return res.status(400).json({ message: `Stock limit reached. Only ${availableStock} item(s) available.` });
      }
      await pool.query(
        'UPDATE tblorders SET Quantity = ? WHERE ID = ?',
        [newQty, existing[0].ID]
      );
    } else {
      await pool.query(
        'INSERT INTO tblorders (UserId, VariantId, Quantity) VALUES (?, ?, ?)',
        [userid, variantId, quantity]
      );
    }

    res.json({ message: 'Mobile added to your cart!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// 3. Update Cart Item Quantity
router.put('/:orderId', verifyToken, async (req, res) => {
  const userid = req.user.id;
  const { orderId } = req.params;
  const { qty } = req.body;

  const quantity = parseInt(qty);
  if (!quantity || quantity < 1) {
    return res.status(400).json({ message: 'Valid quantity is required' });
  }

  try {
    // Verify item belongs to user and get stock
    const [orders] = await pool.query(
      `SELECT o.ID, o.VariantId, v.Stock 
       FROM tblorders o
       JOIN tblproduct_variants v ON o.VariantId = v.ID
       WHERE o.ID = ? AND o.UserId = ?`,
      [orderId, userid]
    );

    if (orders.length === 0) {
      return res.status(404).json({ message: 'Cart item not found or unauthorized' });
    }

    const availableStock = parseInt(orders[0].Stock);
    if (quantity > availableStock) {
      return res.status(400).json({ message: `Requested quantity exceeds available stock (${availableStock} available).` });
    }

    await pool.query('UPDATE tblorders SET Quantity = ? WHERE ID = ?', [quantity, orderId]);
    res.json({ message: 'Cart updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error updating cart quantity' });
  }
});

// 4. Delete Item from Cart
router.delete('/:orderId', verifyToken, async (req, res) => {
  const userid = req.user.id;
  const { orderId } = req.params;

  try {
    const [result] = await pool.query(
      'DELETE FROM tblorders WHERE ID = ? AND UserId = ?',
      [orderId, userid]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Cart item not found or unauthorized' });
    }

    res.json({ message: 'Item removed from cart' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error removing cart item' });
  }
});

module.exports = router;
