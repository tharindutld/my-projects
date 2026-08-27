const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verifyToken, verifyStaff } = require('../middleware/auth');

// Helper to generate a unique order number
const generateOrderNumber = () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randNum = Math.floor(1000 + Math.random() * 9000);
  return `ORD-${dateStr}-${randNum}`;
};

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

// 1. PLACE AN ORDER (Checkout)
router.post('/checkout', verifyToken, async (req, res) => {
  const userid = req.user.id;
  const {
    shippingName,
    shippingPhone,
    shippingCountry,
    shippingAddress,
    shippingPostalCode,
    billingName,
    billingPhone,
    billingCountry,
    billingAddress,
    billingPostalCode,
    paymentMethod = 'Card',
    redeemPoints = 0,
    saveAddress = false
  } = req.body;

  // Validation
  if (!shippingName || !shippingPhone || !shippingCountry || !shippingAddress || !shippingPostalCode) {
    return res.status(400).json({ message: 'Shipping details are required' });
  }

  if (!/^0[0-9]{9}$/.test(shippingPhone)) {
    return res.status(400).json({ message: 'Phone number must be exactly 10 digits starting with 0.' });
  }

  if (!/^[0-9]{5}$/.test(shippingPostalCode)) {
    return res.status(400).json({ message: 'Postal code must be exactly 5 digits.' });
  }

  if (!/^[a-zA-Z0-9\s,\.\-\/]+$/.test(shippingAddress)) {
    return res.status(400).json({ message: 'Shipping address contains invalid characters.' });
  }

  const finalBillingName = billingName || shippingName;
  const finalBillingPhone = billingPhone || shippingPhone;
  const finalBillingCountry = billingCountry || shippingCountry;
  const finalBillingAddress = billingAddress || shippingAddress;
  const finalBillingPostalCode = billingPostalCode || shippingPostalCode;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Fetch Cart Items
    const [cartItems] = await connection.query(
      `SELECT o.ID as OrderID, o.Quantity, v.ID as VariantID, v.Color, v.RAM, v.ROM, v.Price as Price, v.Stock as Stock, 
              p.ID as PID, p.ProductName, p.BrandName, p.ModelNumber, p.DiscountPercent, p.DiscountStartDate, p.DiscountEndDate
       FROM tblorders o
       JOIN tblproduct_variants v ON o.VariantId = v.ID
       JOIN tblproducts p ON v.ProductId = p.ID
       WHERE o.UserId = ?`,
      [userid]
    );

    if (cartItems.length === 0) {
      await connection.rollback();
      return res.status(400).json({ message: 'Your cart is empty.' });
    }

    // 2. Verify stock
    for (const item of cartItems) {
      if (item.Quantity > item.Stock) {
        await connection.rollback();
        return res.status(400).json({ message: `Insufficient stock for variant of ${item.ProductName}. Available: ${item.Stock}` });
      }
    }

    // 3. Fetch User Loyalty Points
    const [users] = await connection.query('SELECT LoyaltyPoints, Email FROM tbluser WHERE ID = ?', [userid]);
    if (users.length === 0) {
      await connection.rollback();
      return res.status(400).json({ message: 'User not found.' });
    }

    const userLoyaltyPoints = parseInt(users[0].LoyaltyPoints || 0);

    // Calculate total price
    let subtotal = 0;
    cartItems.forEach(item => {
      const price = getDiscountedPrice(item, item.Price);
      subtotal += price * item.Quantity;
    });

    const validatedRedeemPoints = Math.max(0, Math.min(redeemPoints, userLoyaltyPoints, Math.floor(subtotal)));
    const loyaltyDiscount = validatedRedeemPoints; // 1 pt = Rs. 1
    const finalTotal = Math.max(0, subtotal - loyaltyDiscount);

    const orderNumber = generateOrderNumber();
    const orderDate = new Date();

    let transactionDetails = `Paid via Credit / Debit Card`;
    if (loyaltyDiscount > 0) {
      transactionDetails += ` (Redeemed ${validatedRedeemPoints} Loyalty Pts: Rs. ${loyaltyDiscount.toFixed(2)} Discount)`;
    }

    // Save Address if requested
    if (saveAddress) {
      await connection.query(
        `INSERT INTO tbluseraddress (UserId, RecipientName, Country, StreetAddress, PostalCode, MobilePhone) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [userid, shippingName, shippingCountry, shippingAddress, shippingPostalCode, shippingPhone]
      );
    }

    // 4. Insert order master
    const [orderMasterResult] = await connection.query(
      `INSERT INTO tbl_order_master 
       (OrderNumber, UserId, ShippingName, ShippingPhone, ShippingCountry, ShippingAddress, ShippingPostalCode, 
        BillingName, BillingPhone, BillingCountry, BillingAddress, BillingPostalCode, TotalAmount, 
        PaymentMethod, TransactionDetails, OrderStatus, DeliveryStatus, OrderDate) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', 'Processing', ?)`,
      [
        orderNumber,
        userid,
        shippingName,
        shippingPhone,
        shippingCountry,
        shippingAddress,
        shippingPostalCode,
        finalBillingName,
        finalBillingPhone,
        finalBillingCountry,
        finalBillingAddress,
        finalBillingPostalCode,
        finalTotal,
        paymentMethod,
        transactionDetails,
        orderDate
      ]
    );

    const orderId = orderMasterResult.insertId;

    // 5. Deduct Loyalty Points if redeemed
    if (validatedRedeemPoints > 0) {
      await connection.query(
        'UPDATE tbluser SET LoyaltyPoints = GREATEST(0, LoyaltyPoints - ?) WHERE ID = ?',
        [validatedRedeemPoints, userid]
      );
    }

    // 6. Insert items & update stock
    for (const item of cartItems) {
      const vid = item.VariantID;
      const qty = item.Quantity;
      const price = getDiscountedPrice(item, item.Price);

      // Line item
      await connection.query(
        'INSERT INTO tbl_order_items (OrderMasterId, VariantId, ProductQty, ProductPrice) VALUES (?, ?, ?, ?)',
        [orderId, vid, qty, price]
      );

      // Deduct stock
      await connection.query(
        'UPDATE tblproduct_variants SET Stock = GREATEST(0, Stock - ?) WHERE ID = ?',
        [qty, vid]
      );

      // Log movement
      await connection.query(
        'INSERT INTO tbl_stock_log (VariantId, Quantity, MovementType, ReferenceInfo) VALUES (?, ?, ?, ?)',
        [vid, -qty, 'Sale', `Sale (Order: ${orderNumber})`]
      );

      // Sold tracker
      await connection.query(
        'INSERT INTO tblcart (VariantId, ProductQty) VALUES (?, ?)',
        [vid, qty]
      );
    }

    // 7. Clear cart
    await connection.query('DELETE FROM tblorders WHERE UserId = ?', [userid]);

    await connection.commit();
    res.json({ message: 'Order placed successfully!', orderNumber });
  } catch (error) {
    await connection.rollback();
    console.error(error);
    res.status(500).json({ message: 'Unable to process order. Please try again.' });
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
    const searchClause = ' AND (m.OrderNumber LIKE ? OR u.FirstName LIKE ? OR u.LastName LIKE ? OR u.Email LIKE ? OR u.MobileNumber LIKE ? OR m.PaymentMethod LIKE ? OR m.ShippingName LIKE ?)';
    countQuery += searchClause;
    selectQuery += searchClause;
    params.push(q, q, q, q, q, q, q);
  }

  selectQuery += ' ORDER BY m.OrderDate DESC LIMIT ? OFFSET ?';
  const selectParams = [...params, parseInt(limit), offset];

  try {
    const [countResult] = await pool.query(countQuery, params);
    const totalResults = countResult[0].count;

    const [orders] = await pool.query(selectQuery, selectParams);

    const detailedOrders = [];
    for (const order of orders) {
      const [items] = await pool.query(
        `SELECT oi.ProductQty, oi.ProductPrice, v.Color, v.RAM, v.ROM, p.ProductName, p.ModelNumber
         FROM tbl_order_items oi
         JOIN tblproduct_variants v ON oi.VariantId = v.ID
         JOIN tblproducts p ON v.ProductId = p.ID
         WHERE oi.OrderMasterId = ?`,
        [order.ID]
      );
      detailedOrders.push({
        ...order,
        items
      });
    }

    res.json({
      orders: detailedOrders,
      pagination: {
        totalResults,
        totalPages: Math.ceil(totalResults / limit),
        currentPage: parseInt(page)
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching orders list' });
  }
});

// 5. ADMIN UPDATE ORDER STATUS (Includes stock cancellation / restore and points awarding)
router.put('/admin/:id/status', verifyStaff(['Admin', 'Sales person']), async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['Pending', 'Completed', 'Cancelled'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Fetch current order state
    const [orders] = await connection.query(
      'SELECT UserId, TotalAmount, PointsAwarded, OrderStatus FROM tbl_order_master WHERE ID = ?',
      [id]
    );

    if (orders.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Order not found' });
    }

    const order = orders[0];
    const user_id = order.UserId;
    const total = order.TotalAmount;
    const awarded = order.PointsAwarded;
    const old_status = order.OrderStatus;
    const points = Math.floor(total / 1000);

    // Fetch Walk-in Customer ID to skip points
    const [walkin] = await connection.query("SELECT ID FROM tbluser WHERE Email = 'walkin@mobilestore.com'");
    const walkin_id = walkin.length > 0 ? walkin[0].ID : 0;

    // Update status and points
    if (status === 'Completed' && awarded === 0 && user_id !== walkin_id) {
      await connection.query('UPDATE tbluser SET LoyaltyPoints = LoyaltyPoints + ? WHERE ID = ?', [points, user_id]);
      await connection.query('UPDATE tbl_order_master SET OrderStatus = ?, PointsAwarded = 1 WHERE ID = ?', [status, id]);
    } else if (status !== 'Completed' && awarded === 1 && user_id !== walkin_id) {
      await connection.query('UPDATE tbluser SET LoyaltyPoints = GREATEST(0, LoyaltyPoints - ?) WHERE ID = ?', [points, user_id]);
      await connection.query('UPDATE tbl_order_master SET OrderStatus = ?, PointsAwarded = 0 WHERE ID = ?', [status, id]);
    } else {
      await connection.query('UPDATE tbl_order_master SET OrderStatus = ? WHERE ID = ?', [status, id]);
    }

    // Handle stock cancellation
    if (status === 'Cancelled' && old_status !== 'Cancelled') {
      const [items] = await connection.query('SELECT VariantId, ProductQty FROM tbl_order_items WHERE OrderMasterId = ?', [id]);
      for (const item of items) {
        await connection.query('UPDATE tblproduct_variants SET Stock = Stock + ? WHERE ID = ?', [item.ProductQty, item.VariantId]);
        await connection.query(
          'INSERT INTO tbl_stock_log (VariantId, Quantity, MovementType, ReferenceInfo) VALUES (?, ?, ?, ?)',
          [item.VariantId, item.ProductQty, 'Correction', `Stock returned from Cancelled Order #${id}`]
        );
      }
    } else if (status !== 'Cancelled' && old_status === 'Cancelled') {
      const [items] = await connection.query('SELECT VariantId, ProductQty FROM tbl_order_items WHERE OrderMasterId = ?', [id]);
      for (const item of items) {
        await connection.query('UPDATE tblproduct_variants SET Stock = GREATEST(0, Stock - ?) WHERE ID = ?', [item.ProductQty, item.VariantId]);
        await connection.query(
          'INSERT INTO tbl_stock_log (VariantId, Quantity, MovementType, ReferenceInfo) VALUES (?, ?, ?, ?)',
          [item.VariantId, -item.ProductQty, 'Sale', `Stock re-deducted for restored Order #${id}`]
        );
      }
    }

    await connection.commit();
    res.json({ message: `Order status updated to ${status} successfully.` });
  } catch (error) {
    await connection.rollback();
    console.error(error);
    res.status(500).json({ message: 'Server error updating order status' });
  } finally {
    connection.release();
  }
});

// 6. ADMIN UPDATE DELIVERY STATUS
router.put('/admin/:id/delivery', verifyStaff(['Admin', 'Sales person']), async (req, res) => {
  const { id } = req.params;
  const { delivery } = req.body;

  if (!['Processing', 'Shipped', 'In Transit', 'Delivered', 'Returned'].includes(delivery)) {
    return res.status(400).json({ message: 'Invalid delivery status' });
  }

  try {
    await pool.query('UPDATE tbl_order_master SET DeliveryStatus = ? WHERE ID = ?', [delivery, id]);
    res.json({ message: `Delivery status updated to ${delivery} successfully.` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error updating delivery status' });
  }
});

// 7. ADMIN DELETE ORDER
router.delete('/admin/:id', verifyStaff(['Admin']), async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM tbl_order_master WHERE ID = ?', [id]);
    res.json({ message: 'Order deleted successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error deleting order' });
  }
});

// 8. ADMIN GET SPECIFIC USER ORDER HISTORY (For UserOrders page)
router.get('/admin/user-history/:uid', verifyStaff(['Admin', 'Sales person']), async (req, res) => {
  const { uid } = req.params;
  const { page = 1, limit = 10 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  try {
    const [userRows] = await pool.query(
      'SELECT ID, FirstName, LastName, Email, MobileNumber, LoyaltyPoints, RegDate FROM tbluser WHERE ID = ?',
      [uid]
    );

    if (userRows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = userRows[0];

    const [countRows] = await pool.query(
      'SELECT COUNT(*) as totalCount, SUM(CASE WHEN OrderStatus = "Completed" THEN TotalAmount ELSE 0 END) as totalSpend FROM tbl_order_master WHERE UserId = ?',
      [uid]
    );
    const totalOrders = countRows[0].totalCount || 0;
    const totalSpend = countRows[0].totalSpend || 0;

    const [orders] = await pool.query(
      `SELECT ID, OrderNumber, TotalAmount, PaymentMethod, TransactionDetails, OrderStatus, OrderDate, DeliveryStatus
       FROM tbl_order_master
       WHERE UserId = ?
       ORDER BY OrderDate DESC
       LIMIT ? OFFSET ?`,
      [uid, parseInt(limit), offset]
    );

    res.json({
      user,
      stats: {
        totalOrders,
        totalSpend,
        loyaltyPoints: user.LoyaltyPoints || 0
      },
      orders,
      pagination: {
        totalResults: totalOrders,
        totalPages: Math.ceil(totalOrders / limit),
        currentPage: parseInt(page)
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching user order history' });
  }
});

// 9. SEARCH CUSTOMERS FOR POS (Admin / Staff)
router.get('/admin/customers/search', verifyStaff(['Admin', 'Sales person']), async (req, res) => {
  const { q } = req.query;
  if (!q || q.trim() === '') return res.json([]);

  try {
    const search = `%${q.trim()}%`;
    const [rows] = await pool.query(
      `SELECT ID as id, CONCAT(FirstName, ' ', LastName) as name, Email as email, MobileNumber as phone, LoyaltyPoints
       FROM tbluser 
       WHERE FirstName LIKE ? OR LastName LIKE ? OR Email LIKE ? OR MobileNumber LIKE ?
       LIMIT 10`,
      [search, search, search, search]
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error searching customers' });
  }
});

// 10. SEARCH PRODUCTS FOR POS (Admin / Staff)
router.get('/admin/products/search', verifyStaff(['Admin', 'Sales person']), async (req, res) => {
  const { q } = req.query;
  if (!q || q.trim() === '') return res.json([]);

  try {
    const search = `%${q.trim()}%`;
    const [rows] = await pool.query(
      `SELECT v.ID as id, CONCAT(p.ProductName, ' (', v.Color, ' - ', v.RAM, '/', v.ROM, ')') as name, 
              p.ModelNumber as model, p.BrandName as brand, v.Price as price, v.Stock as stock
       FROM tblproduct_variants v
       JOIN tblproducts p ON v.ProductId = p.ID
       WHERE p.ProductName LIKE ? OR p.BrandName LIKE ? OR p.ModelNumber LIKE ? OR v.Color LIKE ?
       LIMIT 15`,
      [search, search, search, search]
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error searching products' });
  }
});

// 11. POS IN-STORE ORDER CREATION (Admin / Staff)
router.post('/admin/pos', verifyStaff(['Admin', 'Sales person']), async (req, res) => {
  const {
    user_type = 'walkin',
    customer_id,
    walkin_name,
    walkin_phone,
    walkin_email,
    walkin_address,
    payment_method = 'Cash',
    order_status = 'Completed',
    custom_order_date,
    transaction_details = '',
    items = []
  } = req.body;

  if (items.length === 0) {
    return res.status(400).json({ message: 'Cannot create empty order. Add at least one product.' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    let finalCustomerId = 0;
    let finalShippingName = '';
    let finalShippingPhone = '';
    let finalShippingAddress = '';

    if (user_type === 'registered') {
      if (!customer_id) {
        await connection.rollback();
        return res.status(400).json({ message: 'Registered customer is required.' });
      }
      const [uRows] = await connection.query('SELECT ID, FirstName, LastName, MobileNumber FROM tbluser WHERE ID = ?', [customer_id]);
      if (uRows.length === 0) {
        await connection.rollback();
        return res.status(404).json({ message: 'Customer account not found.' });
      }
      finalCustomerId = uRows[0].ID;
      finalShippingName = `${uRows[0].FirstName} ${uRows[0].LastName}`.trim();
      finalShippingPhone = uRows[0].MobileNumber || '0000000000';
      finalShippingAddress = 'Store Member Pick-up / Delivery';
    } else {
      if (!walkin_name || !walkin_phone || !walkin_email || !walkin_address) {
        await connection.rollback();
        return res.status(400).json({ message: 'All walk-in customer details are mandatory.' });
      }

      finalShippingName = walkin_name;
      finalShippingPhone = walkin_phone;
      finalShippingAddress = walkin_address;

      const [existingUser] = await connection.query('SELECT ID FROM tbluser WHERE Email = ?', [walkin_email]);
      if (existingUser.length > 0) {
        finalCustomerId = existingUser[0].ID;
      } else {
        const bcrypt = require('bcryptjs');
        const defaultPass = await bcrypt.hash('walkin_pass_123', 10);
        const [newUser] = await connection.query(
          'INSERT INTO tbluser (FirstName, LastName, Email, MobileNumber, Password, LoyaltyPoints) VALUES (?, "", ?, ?, ?, 0)',
          [walkin_name, walkin_email, walkin_phone, defaultPass]
        );
        finalCustomerId = newUser.insertId;
      }
    }

    // Process line items & stock verification
    let grandTotal = 0;
    const itemsToInsert = [];

    for (const item of items) {
      const vid = parseInt(item.product_id);
      const qty = parseInt(item.qty);
      const discount = parseFloat(item.discount || 0);

      const [vRows] = await connection.query(
        'SELECT v.Price, v.Stock, p.ProductName FROM tblproduct_variants v JOIN tblproducts p ON v.ProductId = p.ID WHERE v.ID = ?',
        [vid]
      );
      if (vRows.length === 0) {
        await connection.rollback();
        return res.status(404).json({ message: `Product variant #${vid} not found.` });
      }

      const variant = vRows[0];
      if (variant.Stock < qty) {
        await connection.rollback();
        return res.status(400).json({ message: `Insufficient stock for ${variant.ProductName}. Available: ${variant.Stock}` });
      }

      const basePrice = parseFloat(variant.Price);
      // Staff role check: non-Admin staff cannot apply discount
      const effectiveDiscount = (req.staff.role === 'Sales person') ? 0 : Math.min(100, Math.max(0, discount));
      const unitPrice = basePrice * (1 - effectiveDiscount / 100);
      const lineTotal = unitPrice * qty;

      grandTotal += lineTotal;
      itemsToInsert.push({
        vid,
        qty,
        unitPrice,
        baseStock: variant.Stock
      });
    }

    const orderNumber = `ORD-INST-${Date.now().toString().slice(-6)}`;
    const processedBy = req.staff.id;
    const orderDateStr = custom_order_date ? `${custom_order_date} ${new Date().toISOString().slice(11, 19)}` : new Date();

    // Insert tbl_order_master
    const [masterResult] = await connection.query(
      `INSERT INTO tbl_order_master 
       (OrderNumber, UserId, ShippingName, ShippingPhone, ShippingCountry, ShippingAddress, ShippingPostalCode, 
        BillingName, BillingPhone, BillingCountry, BillingAddress, BillingPostalCode, TotalAmount, 
        PaymentMethod, TransactionDetails, OrderStatus, DeliveryStatus, ProcessedById, OrderDate) 
       VALUES (?, ?, ?, ?, 'Sri Lanka', ?, '00000', ?, ?, 'Sri Lanka', ?, '00000', ?, ?, ?, ?, 'Delivered', ?, ?)`,
      [
        orderNumber,
        finalCustomerId,
        finalShippingName,
        finalShippingPhone,
        finalShippingAddress,
        finalShippingName,
        finalShippingPhone,
        finalShippingAddress,
        grandTotal,
        payment_method,
        transaction_details || 'In-store POS Order',
        order_status,
        processedBy,
        orderDateStr
      ]
    );

    const orderId = masterResult.insertId;

    // Insert items & deduct stock
    for (const item of itemsToInsert) {
      await connection.query(
        'INSERT INTO tbl_order_items (OrderMasterId, VariantId, ProductQty, ProductPrice) VALUES (?, ?, ?, ?)',
        [orderId, item.vid, item.qty, item.unitPrice]
      );

      await connection.query(
        'UPDATE tblproduct_variants SET Stock = GREATEST(0, Stock - ?) WHERE ID = ?',
        [item.qty, item.vid]
      );

      await connection.query(
        'INSERT INTO tbl_stock_log (VariantId, Quantity, MovementType, ReferenceInfo) VALUES (?, ?, "Sale", ?)',
        [item.vid, -item.qty, `In-store POS Sale (Order: ${orderNumber})`]
      );

      await connection.query(
        'INSERT INTO tblcart (VariantId, ProductQty) VALUES (?, ?)',
        [item.vid, item.qty]
      );
    }

    // Loyalty points if completed
    if (order_status === 'Completed' && user_type === 'registered') {
      const points = Math.floor(grandTotal / 1000);
      if (points > 0) {
        await connection.query('UPDATE tbluser SET LoyaltyPoints = LoyaltyPoints + ? WHERE ID = ?', [points, finalCustomerId]);
        await connection.query('UPDATE tbl_order_master SET PointsAwarded = 1 WHERE ID = ?', [orderId]);
      }
    }

    await connection.commit();
    res.status(201).json({ message: `In-store order ${orderNumber} created successfully!`, orderNumber, orderId });
  } catch (error) {
    await connection.rollback();
    console.error(error);
    res.status(500).json({ message: 'Failed to process in-store order: ' + error.message });
  } finally {
    connection.release();
  }
});

// 12. RATE ORDER (Customer endpoint)
router.post('/rate', verifyToken, async (req, res) => {
  const userid = req.user.id;
  const { order_id, rating } = req.body;

  const numRating = parseInt(rating);
  if (isNaN(numRating) || numRating < 1 || numRating > 5) {
    return res.status(400).json({ message: 'Rating must be between 1 and 5 stars.' });
  }

  try {
    const [rows] = await pool.query(
      'SELECT ID FROM tbl_order_master WHERE ID = ? AND UserId = ? AND OrderStatus = "Completed"',
      [order_id, userid]
    );

    if (rows.length === 0) {
      return res.status(400).json({ message: 'Only completed orders can be rated.' });
    }

    await pool.query('UPDATE tbl_order_master SET OrderRating = ? WHERE ID = ?', [numRating, order_id]);
    res.json({ success: true, message: 'Thank you for rating your order!', rating: numRating });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error rating order' });
  }
});

module.exports = router;

