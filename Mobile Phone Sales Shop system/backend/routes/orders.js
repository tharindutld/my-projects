const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verifyToken, verifyStaff } = require('../middleware/authMiddleware');

// 1. CREATE CUSTOMER ORDER (Checkout)
router.post('/create', verifyToken, async (req, res) => {
  const userid = req.user.id;
  const { items, shippingAddress, paymentMethod, transactionDetails } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ message: 'Cart items are required.' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Calculate total amount & validate stock
    let totalAmount = 0;
    for (let item of items) {
      const [rows] = await connection.query(
        'SELECT v.*, p.ProductPrice FROM tblproduct_variants v JOIN tblproducts p ON v.ProductId = p.ID WHERE v.ID = ?',
        [item.VariantId || item.id]
      );

      if (rows.length === 0) {
        throw new Error(`Variant ID ${item.VariantId || item.id} not found.`);
      }

      const variant = rows[0];
      if (variant.Quantity < item.quantity) {
        throw new Error(`Insufficient stock for product. Only ${variant.Quantity} available.`);
      }

      const itemPrice = parseFloat(variant.ProductPrice);
      totalAmount += itemPrice * item.quantity;
    }

    // 2. Generate Order Number (ORD-YYYYMMDD-XXXX)
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `ORD-${dateStr}-${randomSuffix}`;

    // 3. Create Order Master record
    const [orderResult] = await connection.query(
      `INSERT INTO tbl_order_master 
       (OrderNumber, UserId, TotalAmount, OrderStatus, DeliveryStatus, PaymentMethod, TransactionDetails, ShippingAddress) 
       VALUES (?, ?, ?, 'Processing', 'Processing', ?, ?, ?)`,
      [orderNumber, userid, totalAmount, paymentMethod || 'Card', transactionDetails || null, shippingAddress || 'Default Address']
    );

    const orderMasterId = orderResult.insertId;

    // 4. Create Order Items & Update Stock
    for (let item of items) {
      const vid = item.VariantId || item.id;
      const qty = item.quantity;

      const [rows] = await connection.query(
        'SELECT p.ProductPrice FROM tblproduct_variants v JOIN tblproducts p ON v.ProductId = p.ID WHERE v.ID = ?',
        [vid]
      );
      const unitPrice = parseFloat(rows[0].ProductPrice);

      await connection.query(
        `INSERT INTO tbl_order_items (OrderMasterId, VariantId, ProductQty, ProductPrice) 
         VALUES (?, ?, ?, ?)`,
        [orderMasterId, vid, qty, unitPrice]
      );

      // Deduct stock
      await connection.query(
        'UPDATE tblproduct_variants SET Quantity = Quantity - ? WHERE ID = ?',
        [qty, vid]
      );

      // Log stock movement
      await connection.query(
        'INSERT INTO tbl_stock_log (VariantId, Quantity, MovementType, ReferenceInfo) VALUES (?, ?, ?, ?)',
        [vid, -qty, 'Sale', `Sale (Order: ${orderNumber})`]
      );
    }

    // Clear cart
    await connection.query('DELETE FROM tblorders WHERE UserId = ?', [userid]);

    await connection.commit();
    res.json({ message: 'Order placed successfully!', orderNumber });
  } catch (error) {
    await connection.rollback();
    console.error('Error creating order:', error);
    res.status(500).json({ message: error.message || 'Unable to process order. Please try again.' });
  } finally {
    connection.release();
  }
});

// 2. CUSTOMER MY ORDERS
router.get('/', verifyToken, async (req, res) => {
  const userid = req.user.id;

  try {
    const [orders] = await pool.query(
      `SELECT m.*, 
              (SELECT COUNT(*) FROM tbl_order_items WHERE OrderMasterId = m.ID) as TotalItems
       FROM tbl_order_master m
       WHERE m.UserId = ?
       ORDER BY m.OrderDate DESC`,
      [userid]
    );

    // Fetch order items for each order
    for (let order of orders) {
      const [items] = await pool.query(
        `SELECT oi.ProductQty, oi.ProductPrice, v.Color, v.RAM, v.ROM, p.ProductName, p.BrandName, p.ModelNumber, p.Image1
         FROM tbl_order_items oi
         LEFT JOIN tblproduct_variants v ON oi.VariantId = v.ID
         LEFT JOIN tblproducts p ON v.ProductId = p.ID
         WHERE oi.OrderMasterId = ?`,
        [order.ID]
      );
      order.items = items;
    }

    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// 3. CUSTOMER SINGLE ORDER DETAILS
router.get('/:id', verifyToken, async (req, res) => {
  const userid = req.user.id;
  const { id } = req.params;

  try {
    const [orders] = await pool.query(
      'SELECT * FROM tbl_order_master WHERE ID = ? AND UserId = ?',
      [id, userid]
    );

    if (orders.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const [items] = await pool.query(
      `SELECT oi.ProductQty, oi.ProductPrice, v.Color, v.RAM, v.ROM, p.ProductName, p.ModelNumber, p.Image1
       FROM tbl_order_items oi
       JOIN tblproduct_variants v ON oi.VariantId = v.ID
       JOIN tblproducts p ON v.ProductId = p.ID
       WHERE oi.OrderMasterId = ?`,
      [id]
    );

    res.json({
      ...orders[0],
      items
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// 3.5. CUSTOMER RATE ORDER
router.post('/rate', verifyToken, async (req, res) => {
  const userid = req.user.id;
  const { order_id, rating } = req.body;

  if (!order_id || !rating) {
    return res.status(400).json({ success: false, message: 'Order ID and rating are required.' });
  }

  const ratingVal = parseInt(rating);
  if (isNaN(ratingVal) || ratingVal < 1 || ratingVal > 5) {
    return res.status(400).json({ success: false, message: 'Rating must be a number between 1 and 5.' });
  }

  try {
    // 1. Ensure column OrderRating exists in tbl_order_master
    try {
      const [cols] = await pool.query("SHOW COLUMNS FROM tbl_order_master LIKE 'OrderRating'");
      if (cols.length === 0) {
        await pool.query("ALTER TABLE tbl_order_master ADD COLUMN OrderRating INT DEFAULT NULL");
      }
    } catch (colErr) {
      console.warn('Column check warning:', colErr.message);
    }

    // 2. Fetch order
    const [orders] = await pool.query(
      'SELECT ID, OrderStatus, DeliveryStatus FROM tbl_order_master WHERE ID = ? AND UserId = ?',
      [order_id, userid]
    );

    if (orders.length === 0) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    const order = orders[0];
    const isCompleted = ['Completed', 'completed', 'Delivered', 'delivered'].includes(order.OrderStatus) ||
                        ['Delivered', 'delivered', 'Completed', 'completed'].includes(order.DeliveryStatus);

    if (!isCompleted) {
      return res.status(400).json({ success: false, message: 'Only completed or delivered orders can be rated.' });
    }

    // 3. Update rating
    await pool.query(
      'UPDATE tbl_order_master SET OrderRating = ? WHERE ID = ? AND UserId = ?',
      [ratingVal, order_id, userid]
    );

    res.json({ success: true, message: 'Rating submitted successfully!' });
  } catch (error) {
    console.error('Error submitting rating:', error);
    res.status(500).json({ success: false, message: 'Server error rating order: ' + error.message });
  }
});

// 4. ADMIN ORDER MANAGEMENT - LIST (Paginated & Filtered)
router.get('/admin/list', verifyStaff(['Admin', 'Sales person']), async (req, res) => {
  const { status, search, page = 1, limit = 10 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let countQuery = `
    SELECT COUNT(*) as count 
    FROM tbl_order_master m
    JOIN tbluser u ON m.UserId = u.ID
    WHERE 1=1
  `;
  let selectQuery = `
    SELECT m.*, m.TotalAmount as GrandTotal, u.FirstName, u.LastName, u.Email, u.MobileNumber
    FROM tbl_order_master m
    JOIN tbluser u ON m.UserId = u.ID
    WHERE 1=1
  `;
  const params = [];

  if (status && status !== '') {
    countQuery += ' AND m.OrderStatus = ?';
    selectQuery += ' AND m.OrderStatus = ?';
    params.push(status);
  }

  if (search && search.trim() !== '') {
    const q = `%${search.trim()}%`;
    countQuery += ' AND (m.OrderNumber LIKE ? OR u.FirstName LIKE ? OR u.LastName LIKE ? OR u.MobileNumber LIKE ?)';
    selectQuery += ' AND (m.OrderNumber LIKE ? OR u.FirstName LIKE ? OR u.LastName LIKE ? OR u.MobileNumber LIKE ?)';
    params.push(q, q, q, q);
  }

  selectQuery += ' ORDER BY m.OrderDate DESC LIMIT ? OFFSET ?';

  try {
    const [countResult] = await pool.query(countQuery, params);
    const totalOrders = countResult[0].count;

    const queryParams = [...params, parseInt(limit), offset];
    const [orders] = await pool.query(selectQuery, queryParams);

    res.json({
      orders,
      pagination: {
        total: totalOrders,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalOrders / parseInt(limit))
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// 5. UPDATE ORDER STATUS (ADMIN)
router.put('/admin/status/:id', verifyStaff(['Admin', 'Sales person']), async (req, res) => {
  const { id } = req.params;
  const { status, delivery_status } = req.body;

  try {
    const updates = [];
    const params = [];

    if (status) {
      updates.push('OrderStatus = ?');
      params.push(status);
    }
    if (delivery_status) {
      updates.push('DeliveryStatus = ?');
      params.push(delivery_status);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No status provided for update.' });
    }

    params.push(id);
    await pool.query(
      `UPDATE tbl_order_master SET ${updates.join(', ')} WHERE ID = ?`,
      params
    );

    res.json({ message: 'Order status updated successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
