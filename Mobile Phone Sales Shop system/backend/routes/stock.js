const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verifyStaff } = require('../middleware/auth');

// 1. GET CURRENT STOCK LIST (All product variants & stock levels)
router.get('/', verifyStaff(['Admin', 'Sales person', 'Technician']), async (req, res) => {
  const { search } = req.query;

  let query = `
    SELECT v.ID as VariantId, v.Color, v.RAM, v.ROM, v.Price, v.Stock, 
           p.ID as ProductId, p.ProductName, p.BrandName, p.ModelNumber, p.SimType, p.CategoryName, p.Image1
    FROM tblproduct_variants v
    JOIN tblproducts p ON v.ProductId = p.ID
  `;
  const params = [];

  if (search) {
    query += ' WHERE LOWER(p.ProductName) LIKE ? OR LOWER(p.BrandName) LIKE ? OR LOWER(p.ModelNumber) LIKE ?';
    const searchParam = `%${search.toLowerCase()}%`;
    params.push(searchParam, searchParam, searchParam);
  }

  query += ' ORDER BY p.BrandName ASC, p.ProductName ASC, v.Price ASC';

  try {
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching stock' });
  }
});

// 2. GET STOCK BATCHES
router.get('/batches', verifyStaff(['Admin', 'Sales person']), async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT b.*, v.Color, v.RAM, v.ROM, p.ProductName, p.BrandName, p.ModelNumber
      FROM tbl_stock_batches b
      JOIN tblproduct_variants v ON b.VariantId = v.ID
      JOIN tblproducts p ON v.ProductId = p.ID
      ORDER BY b.ID DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching batches' });
  }
});

// Helper to generate unique batch number
const generateUniqueBatchNumber = async (connection) => {
  let isUnique = false;
  let batchNo = '';
  while (!isUnique) {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randStr = Math.random().toString(36).substring(2, 6).toUpperCase();
    batchNo = `BAT-${dateStr}-${randStr}`;

    const [rows] = await connection.query('SELECT ID FROM tbl_stock_batches WHERE BatchNumber = ?', [batchNo]);
    if (rows.length === 0) {
      isUnique = true;
    }
  }
  return batchNo;
};

// 3. GENERATE BATCH NUMBER ENDPOINT
router.get('/generate-batch-number', verifyStaff(['Admin', 'Sales person']), async (req, res) => {
  try {
    const batchNo = await generateUniqueBatchNumber(pool);
    res.json({ batchNumber: batchNo });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error generating batch number' });
  }
});

// 4. GET DEALERS / SUPPLIERS
router.get('/dealers', verifyStaff(['Admin', 'Sales person']), async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT DISTINCT Dealer as Name FROM tbl_stock_batches 
       UNION 
       SELECT SupplierName as Name FROM tbl_suppliers 
       ORDER BY Name ASC`
    );
    res.json(rows.map(r => r.Name).filter(Boolean));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching dealers' });
  }
});

// 5. RECEIVE NEW STOCK BATCH (Goods Receiving)
router.post('/batch', verifyStaff(['Admin', 'Sales person']), async (req, res) => {
  const {
    brand,
    model_name,
    color,
    ram,
    storage,
    screen_size,
    network = '5G',
    simtype = 'Single SIM',
    batch_number,
    dealer,
    purchase_date,
    cost_price,
    selling_price,
    quantity,
    product_category = 'Smartphone',
    serial_nos = [],
    imeis = []
  } = req.body;

  // Validation
  if (!brand || !model_name || !color || !ram || !storage || !dealer || !purchase_date || !cost_price || !selling_price || !quantity) {
    return res.status(400).json({ message: 'Required fields are missing.' });
  }

  if (parseFloat(cost_price) <= 0 || parseFloat(selling_price) <= 0) {
    return res.status(400).json({ message: 'Pricing values must be positive.' });
  }

  const qty = parseInt(quantity);
  if (qty <= 0) {
    return res.status(400).json({ message: 'Quantity must be greater than zero.' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Check/Create Parent Product
    let productId = null;
    const [prodCheck] = await connection.query(
      'SELECT ID FROM tblproducts WHERE LOWER(BrandName) = LOWER(?) AND LOWER(ProductName) = LOWER(?)',
      [brand, model_name]
    );

    if (prodCheck.length > 0) {
      productId = prodCheck[0].ID;
    } else {
      const modelCode = `MOD-${brand.substring(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
      const displayStr = screen_size ? `${screen_size}" Display` : 'Unspecified';

      const [insProd] = await connection.query(
        `INSERT INTO tblproducts (ProductName, BrandName, CategoryName, ModelNumber, SimType, Display, Status) 
         VALUES (?, ?, ?, ?, ?, ?, 1)`,
        [model_name, brand, product_category, modelCode, simtype, displayStr]
      );
      productId = insProd.insertId;
    }

    // 2. Check/Update Variant
    let variantId = null;
    const [varCheck] = await connection.query(
      'SELECT ID, Stock FROM tblproduct_variants WHERE ProductId = ? AND LOWER(Color) = LOWER(?) AND LOWER(RAM) = LOWER(?) AND LOWER(ROM) = LOWER(?)',
      [productId, color, ram, storage]
    );

    if (varCheck.length > 0) {
      variantId = varCheck[0].ID;
      const newStock = parseInt(varCheck[0].Stock) + qty;
      await connection.query(
        'UPDATE tblproduct_variants SET Stock = ?, Price = ? WHERE ID = ?',
        [newStock, parseFloat(selling_price), variantId]
      );
    } else {
      const [insVar] = await connection.query(
        'INSERT INTO tblproduct_variants (ProductId, Color, RAM, ROM, Price, Stock) VALUES (?, ?, ?, ?, ?, ?)',
        [productId, color, ram, storage, parseFloat(selling_price), qty]
      );
      variantId = insVar.insertId;
    }

    // 3. Insert Batch Record
    const finalBatchNumber = batch_number || (await generateUniqueBatchNumber(connection));
    const [insBatch] = await connection.query(
      `INSERT INTO tbl_stock_batches 
       (VariantId, BatchNumber, Dealer, PurchaseDate, CostPrice, SellingPrice, InitialQuantity, CurrentQuantity) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [variantId, finalBatchNumber, dealer, purchase_date, parseFloat(cost_price), parseFloat(selling_price), qty, qty]
    );
    const batchId = insBatch.insertId;

    // 4. Insert IMEIs / Serial Numbers
    if (product_category === 'Tablet') {
      if (simtype !== 'None') {
        const isDualSim = simtype.toLowerCase().includes('dual');
        let imeiIdx = 0;
        for (let u = 0; u < qty; u++) {
          const serial = serial_nos[u] || '';
          const imei1 = imeis[imeiIdx++] || '';
          await connection.query(
            'INSERT INTO tbl_stock_imeis (BatchId, IMEI, SerialNumber, Status) VALUES (?, ?, ?, "Available")',
            [batchId, imei1, serial]
          );
          if (isDualSim) {
            const imei2 = imeis[imeiIdx++] || '';
            await connection.query(
              'INSERT INTO tbl_stock_imeis (BatchId, IMEI, SerialNumber, Status) VALUES (?, ?, ?, "Available")',
              [batchId, imei2, serial]
            );
          }
        }
      } else {
        // Wi-Fi only Tablet
        for (let u = 0; u < qty; u++) {
          const serial = serial_nos[u] || '';
          await connection.query(
            'INSERT INTO tbl_stock_imeis (BatchId, IMEI, SerialNumber, Status) VALUES (?, NULL, ?, "Available")',
            [batchId, serial]
          );
        }
      }
    } else {
      // Smartphone
      for (const imei of imeis) {
        if (imei && imei.trim() !== '') {
          await connection.query(
            'INSERT INTO tbl_stock_imeis (BatchId, IMEI, Status) VALUES (?, ?, "Available")',
            [batchId, imei.trim()]
          );
        }
      }
    }

    // 5. Insert Stock Log
    const logRef = `Batch ${finalBatchNumber}`;
    await connection.query(
      'INSERT INTO tbl_stock_log (VariantId, Quantity, MovementType, ReferenceInfo) VALUES (?, ?, "Restock", ?)',
      [variantId, qty, logRef]
    );

    await connection.commit();
    res.status(201).json({ message: `Batch ${finalBatchNumber} received successfully! Added ${qty} units.` });
  } catch (error) {
    await connection.rollback();
    console.error(error);
    res.status(500).json({ message: 'Server error processing goods receipt.' });
  } finally {
    connection.release();
  }
});

// 6. GET BATCH STOCK LIST (detailed with filters, IMEIs, KPI metrics, pagination)
router.get('/list', verifyStaff(['Admin', 'Sales person']), async (req, res) => {
  const { search = '', brand = '', status = '', page = 1, limit = 10 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  const whereClauses = ['1=1'];
  const params = [];

  if (search) {
    whereClauses.push('(p.ProductName LIKE ? OR p.BrandName LIKE ? OR p.ModelNumber LIKE ? OR b.BatchNumber LIKE ? OR i.IMEI LIKE ? OR i.SerialNumber LIKE ?)');
    const s = `%${search}%`;
    params.push(s, s, s, s, s, s);
  }

  if (brand) {
    whereClauses.push('p.BrandName = ?');
    params.push(brand);
  }

  if (status === 'in-stock') {
    whereClauses.push('b.CurrentQuantity > 5');
  } else if (status === 'low') {
    whereClauses.push('b.CurrentQuantity > 0 AND b.CurrentQuantity <= 5');
  } else if (status === 'out') {
    whereClauses.push('b.CurrentQuantity = 0');
  }

  const whereStr = whereClauses.join(' AND ');

  try {
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(DISTINCT b.ID) as total 
       FROM tbl_stock_batches b
       JOIN tblproduct_variants v ON b.VariantId = v.ID
       JOIN tblproducts p ON v.ProductId = p.ID
       LEFT JOIN tbl_stock_imeis i ON b.ID = i.BatchId
       WHERE ${whereStr}`,
      params
    );

    const [rows] = await pool.query(
      `SELECT b.ID, b.VariantId, b.BatchNumber, b.Dealer, b.PurchaseDate, b.CostPrice, b.SellingPrice, b.InitialQuantity, b.CurrentQuantity,
              p.ProductName, p.BrandName, p.ModelNumber, p.SimType, p.CategoryName, v.RAM, v.ROM, v.Color,
              GROUP_CONCAT(CONCAT(COALESCE(i.IMEI, i.SerialNumber, ''), ':', i.Status, ':', COALESCE(i.SerialNumber, '')) SEPARATOR ',') as batch_imeis
       FROM tbl_stock_batches b
       JOIN tblproduct_variants v ON b.VariantId = v.ID
       JOIN tblproducts p ON v.ProductId = p.ID
       LEFT JOIN tbl_stock_imeis i ON b.ID = i.BatchId
       WHERE ${whereStr}
       GROUP BY b.ID
       ORDER BY b.ID DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    // KPI Summary
    const [[{ totalBatches }]] = await pool.query('SELECT COUNT(*) as totalBatches FROM tbl_stock_batches');
    const [[{ totalUnits }]] = await pool.query('SELECT COALESCE(SUM(CurrentQuantity), 0) as totalUnits FROM tbl_stock_batches');
    const [[{ lowStockCount }]] = await pool.query('SELECT COUNT(*) as lowStockCount FROM tbl_stock_batches WHERE CurrentQuantity <= 5 AND CurrentQuantity > 0');
    const [[{ availableImeis }]] = await pool.query('SELECT COUNT(*) as availableImeis FROM tbl_stock_imeis WHERE Status="Available"');

    res.json({
      items: rows,
      totalRows: total,
      totalPages: Math.ceil(total / parseInt(limit)),
      page: parseInt(page),
      kpis: {
        totalBatches,
        totalUnits,
        lowStockCount,
        availableImeis
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching stock list.' });
  }
});

// 7. EDIT BATCH DETAILS (Admin only)
router.put('/batch/:id', verifyStaff(['Admin']), async (req, res) => {
  const { id } = req.params;
  const { cost_price, selling_price, dealer } = req.body;

  const cost = parseFloat(cost_price);
  const selling = parseFloat(selling_price);

  if (cost <= 0 || selling <= 0 || selling <= cost || selling < 10000) {
    return res.status(400).json({ message: 'Invalid pricing parameters. Selling price must be greater than cost price and at least 10,000 LKR.' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [bCheck] = await connection.query('SELECT VariantId, BatchNumber FROM tbl_stock_batches WHERE ID = ?', [id]);
    if (bCheck.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Batch not found.' });
    }

    const { VariantId, BatchNumber } = bCheck[0];

    await connection.query(
      'UPDATE tbl_stock_batches SET CostPrice = ?, SellingPrice = ?, Dealer = ? WHERE ID = ?',
      [cost, selling, dealer, id]
    );

    await connection.query('UPDATE tblproduct_variants SET Price = ? WHERE ID = ?', [selling, VariantId]);

    await connection.commit();
    res.json({ message: `Batch ${BatchNumber} updated successfully.` });
  } catch (error) {
    await connection.rollback();
    console.error(error);
    res.status(500).json({ message: 'Server error updating batch.' });
  } finally {
    connection.release();
  }
});

// 8. DELETE BATCH (Admin only)
router.delete('/batch/:id', verifyStaff(['Admin']), async (req, res) => {
  const { id } = req.params;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [bCheck] = await connection.query('SELECT VariantId, CurrentQuantity, BatchNumber FROM tbl_stock_batches WHERE ID = ?', [id]);
    if (bCheck.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Batch not found.' });
    }

    const { VariantId, CurrentQuantity, BatchNumber } = bCheck[0];

    const [vCheck] = await connection.query('SELECT Stock FROM tblproduct_variants WHERE ID = ?', [VariantId]);
    if (vCheck.length > 0) {
      const newStock = Math.max(0, parseInt(vCheck[0].Stock) - parseInt(CurrentQuantity));
      await connection.query('UPDATE tblproduct_variants SET Stock = ? WHERE ID = ?', [newStock, VariantId]);
    }

    await connection.query('DELETE FROM tbl_stock_batches WHERE ID = ?', [id]);

    const logRef = `Deleted batch ${BatchNumber}`;
    const adj = -parseInt(CurrentQuantity);
    await connection.query('INSERT INTO tbl_stock_log (VariantId, Quantity, MovementType, ReferenceInfo) VALUES (?, ?, "Correction", ?)', [VariantId, adj, logRef]);

    await connection.commit();
    res.json({ message: `Batch ${BatchNumber} deleted successfully and variant stock corrected.` });
  } catch (error) {
    await connection.rollback();
    console.error(error);
    res.status(500).json({ message: 'Server error deleting batch.' });
  } finally {
    connection.release();
  }
});

module.exports = router;

