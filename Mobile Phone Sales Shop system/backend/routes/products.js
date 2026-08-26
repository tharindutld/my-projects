const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verifyStaff } = require('../middleware/auth');

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

// 1. GET ALL PRODUCTS (Public Storefront & Admin Catalog)
router.get('/', async (req, res) => {
  const { category, brand, search, sortBy, limit, offset } = req.query;

  let query = `
    SELECT p.*, 
           (SELECT MIN(v.Price) FROM tblproduct_variants v WHERE v.ProductId = p.ID) as MinPrice,
           (SELECT MAX(v.Price) FROM tblproduct_variants v WHERE v.ProductId = p.ID) as MaxPrice,
           (SELECT SUM(v.Stock) FROM tblproduct_variants v WHERE v.ProductId = p.ID) as TotalStock
    FROM tblproducts p
    WHERE 1=1
  `;
  const params = [];

  if (category) {
    query += ' AND LOWER(p.CategoryName) = LOWER(?)';
    params.push(category);
  }

  if (brand) {
    query += ' AND LOWER(p.BrandName) = LOWER(?)';
    params.push(brand);
  }

  if (search) {
    query += ' AND (LOWER(p.ProductName) LIKE ? OR LOWER(p.ModelNumber) LIKE ?)';
    const searchParam = `%${search.toLowerCase()}%`;
    params.push(searchParam, searchParam);
  }

  // Handle sorting
  if (sortBy === 'price_asc') {
    query += ' ORDER BY MinPrice ASC';
  } else if (sortBy === 'price_desc') {
    query += ' ORDER BY MinPrice DESC';
  } else if (sortBy === 'newest') {
    query += ' ORDER BY p.ID DESC';
  } else {
    query += ' ORDER BY p.BrandName ASC, p.ProductName ASC';
  }

  if (limit) {
    query += ' LIMIT ?';
    params.push(parseInt(limit));
    if (offset) {
      query += ' OFFSET ?';
      params.push(parseInt(offset));
    }
  }

  try {
    const [products] = await pool.query(query, params);

    // Map discount information
    const formattedProducts = products.map((product) => {
      const active = isDiscountActive(product);
      return {
        ...product,
        discountActive: active,
        MinPriceDiscounted: active ? getDiscountedPrice(product, product.MinPrice) : parseFloat(product.MinPrice),
        MaxPriceDiscounted: active ? getDiscountedPrice(product, product.MaxPrice) : parseFloat(product.MaxPrice)
      };
    });

    res.json(formattedProducts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching products' });
  }
});

// 2. GET BRANDS
router.get('/brands', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT ID, BrandName, Status, CreationDate FROM tblbrand ORDER BY ID DESC');
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching brands' });
  }
});

// Create Brand
router.post('/brands', verifyStaff(['Admin']), async (req, res) => {
  const { brandName, status } = req.body;
  if (!brandName) {
    return res.status(400).json({ message: 'Brand name is required.' });
  }
  try {
    const [existing] = await pool.query('SELECT ID FROM tblbrand WHERE LOWER(BrandName) = LOWER(?)', [brandName]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'A brand with this name already exists.' });
    }
    await pool.query('INSERT INTO tblbrand (BrandName, Status) VALUES (?, ?)', [brandName, status !== undefined ? status : 1]);
    res.status(201).json({ message: 'Brand created successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error creating brand' });
  }
});

// Update Brand
router.put('/brands/:id', verifyStaff(['Admin']), async (req, res) => {
  const { id } = req.params;
  const { brandName, status } = req.body;
  if (!brandName) {
    return res.status(400).json({ message: 'Brand name is required.' });
  }
  try {
    await pool.query('UPDATE tblbrand SET BrandName = ?, Status = ? WHERE ID = ?', [brandName, status, id]);
    res.json({ message: 'Brand updated successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error updating brand' });
  }
});

// Delete Brand
router.delete('/brands/:id', verifyStaff(['Admin']), async (req, res) => {
  const { id } = req.params;
  try {
    const [brandRows] = await pool.query('SELECT BrandName FROM tblbrand WHERE ID = ?', [id]);
    if (brandRows.length === 0) {
      return res.status(404).json({ message: 'Brand not found.' });
    }
    const brandName = brandRows[0].BrandName;

    // Check product usage
    const [prodRows] = await pool.query('SELECT COUNT(*) as count FROM tblproducts WHERE BrandName = ?', [brandName]);
    if (prodRows[0].count > 0) {
      return res.status(400).json({ message: `Cannot delete brand '${brandName}' because it has ${prodRows[0].count} item(s) in the catalog.` });
    }

    await pool.query('DELETE FROM tblbrand WHERE ID = ?', [id]);
    res.json({ message: 'Brand deleted successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error deleting brand' });
  }
});

// 3. GET CATEGORIES
router.get('/categories', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT ID, CategoryName, Status, CreationDate FROM tblcategory ORDER BY ID DESC');
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching categories' });
  }
});

// Create Category
router.post('/categories', verifyStaff(['Admin']), async (req, res) => {
  const { categoryName, status } = req.body;
  if (!categoryName) {
    return res.status(400).json({ message: 'Category name is required.' });
  }
  try {
    const [existing] = await pool.query('SELECT ID FROM tblcategory WHERE LOWER(CategoryName) = LOWER(?)', [categoryName]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'A category with this name already exists.' });
    }
    await pool.query('INSERT INTO tblcategory (CategoryName, Status) VALUES (?, ?)', [categoryName, status !== undefined ? status : 1]);
    res.status(201).json({ message: 'Category created successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error creating category' });
  }
});

// Update Category
router.put('/categories/:id', verifyStaff(['Admin']), async (req, res) => {
  const { id } = req.params;
  const { categoryName, status } = req.body;
  if (!categoryName) {
    return res.status(400).json({ message: 'Category name is required.' });
  }
  try {
    await pool.query('UPDATE tblcategory SET CategoryName = ?, Status = ? WHERE ID = ?', [categoryName, status, id]);
    res.json({ message: 'Category updated successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error updating category' });
  }
});

// Delete Category
router.delete('/categories/:id', verifyStaff(['Admin']), async (req, res) => {
  const { id } = req.params;
  try {
    const [catRows] = await pool.query('SELECT CategoryName FROM tblcategory WHERE ID = ?', [id]);
    if (catRows.length === 0) {
      return res.status(404).json({ message: 'Category not found.' });
    }
    const categoryName = catRows[0].CategoryName;

    // Check product usage
    const [prodRows] = await pool.query('SELECT COUNT(*) as count FROM tblproducts WHERE CategoryName = ?', [categoryName]);
    if (prodRows[0].count > 0) {
      return res.status(400).json({ message: `Cannot delete category '${categoryName}' because it has ${prodRows[0].count} item(s) in the catalog.` });
    }

    await pool.query('DELETE FROM tblcategory WHERE ID = ?', [id]);
    res.json({ message: 'Category deleted successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error deleting category' });
  }
});

// 4. GET SINGLE PRODUCT DETAILS & VARIANTS
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [products] = await pool.query('SELECT * FROM tblproducts WHERE ID = ?', [id]);
    if (products.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const product = products[0];
    const [variants] = await pool.query('SELECT * FROM tblproduct_variants WHERE ProductId = ?', [id]);

    const active = isDiscountActive(product);
    const formattedVariants = variants.map(v => {
      const discountedPrice = getDiscountedPrice(product, v.Price);
      return {
        ...v,
        originalPrice: parseFloat(v.Price),
        price: discountedPrice,
        savings: Math.round((parseFloat(v.Price) - discountedPrice) * 100) / 100,
        discountActive: active
      };
    });

    res.json({
      ...product,
      discountActive: active,
      variants: formattedVariants
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching product details' });
  }
});

// Helper function to generate unique batch numbers
async function generateProductBatchNumber(conn) {
  let batchNo = '';
  let exists = true;
  while (exists) {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
    batchNo = `BAT-${dateStr}-${randomStr}`;
    const [rows] = await conn.query('SELECT ID FROM tbl_stock_batches WHERE BatchNumber = ?', [batchNo]);
    if (rows.length === 0) exists = false;
  }
  return batchNo;
}

// 5. POST NEW PRODUCT (Admin & Staff authorized)
router.post('/', verifyStaff(['Admin']), async (req, res) => {
  const {
    ProductName, pname,
    BrandName, bname,
    CategoryName, cname,
    ModelNumber, modelno,
    Price, price,
    Color, color,
    RAM, ram,
    ROM, rom,
    FrontCamera, fcamera,
    Processor, processor,
    Display, display,
    SimType, simtype,
    SerialNumber, serial_no,
    TabletHasSim, tablet_has_sim,
    IMEI1, imei1,
    IMEI2, imei2,
    KeyFeature, kfeatures,
    Specification, specification,
    Image1, image1,
    Image2, image2,
    Image3, image3,
    Status, status
  } = req.body;

  const p_name = (ProductName || pname || '').trim();
  const b_name = (BrandName || bname || '').trim();
  const c_name = (CategoryName || cname || '').trim();
  const m_number = (ModelNumber || modelno || '').trim();
  const p_price = parseFloat(Price || price || 0);
  const p_color = (Color || color || '').trim();
  const p_ram = (RAM || ram || '').trim();
  const p_rom = (ROM || rom || '').trim();
  const f_camera = (FrontCamera || fcamera || '').trim();
  const p_processor = (Processor || processor || '').trim();
  const p_display = (Display || display || '').trim();
  let s_type = (SimType || simtype || '').trim();
  const s_number = (SerialNumber || serial_no || '').trim();
  const tab_has_sim = (TabletHasSim !== undefined ? TabletHasSim : tablet_has_sim) || false;
  const i1 = (IMEI1 || imei1 || '').trim();
  const i2 = (IMEI2 || imei2 || '').trim();
  const k_features = (KeyFeature || kfeatures || '').trim();
  const spec = (Specification || specification || '').trim();

  const img1 = Image1 || image1 || 'phone_sample1.jpg';
  const img2 = Image2 || image2 || 'phone_sample2.jpg';
  const img3 = Image3 || image3 || 'phone_sample3.jpg';
  const p_status = Status !== undefined ? (Status ? 1 : 0) : (status !== undefined ? (status ? 1 : 0) : 1);

  const errors = [];

  // Client & Server input validations (Matching add-product.php)
  const pattern = /^[a-zA-Z0-9\s\/]+$/;

  if (!p_name) {
    errors.push('Product Name is required.');
  } else if (!pattern.test(p_name)) {
    errors.push('Product Name cannot contain special characters, plus, minus, or decimals.');
  } else if (!/[a-zA-Z]/.test(p_name)) {
    errors.push('Product Name must contain at least one letter.');
  }

  if (!b_name) errors.push('Brand selection is required.');
  if (!c_name) errors.push('Category selection is required.');

  if (!m_number) {
    errors.push('Model Number is required.');
  } else if (!pattern.test(m_number)) {
    errors.push('Model Number cannot contain special characters, plus, minus, or decimals.');
  }

  if (f_camera && !pattern.test(f_camera)) {
    errors.push('Front Camera cannot contain special characters, plus, minus, or decimals.');
  }

  if (p_processor && !pattern.test(p_processor)) {
    errors.push('Processor cannot contain special characters, plus, minus, or decimals.');
  }

  if (p_display && !pattern.test(p_display)) {
    errors.push('Display cannot contain special characters, plus, minus, or decimals.');
  }

  if (!p_color) {
    errors.push('Please provide product color.');
  } else if (!/^[a-zA-Z\s\-\/]+$/.test(p_color)) {
    errors.push('Color cannot contain numbers, minus numbers, or special characters.');
  }

  const validRams = ['2GB', '3GB', '4GB', '6GB', '8GB', '12GB', '16GB', '24GB', '32GB'];
  const validRoms = ['16GB', '32GB', '64GB', '128GB', '256GB', '512GB', '1TB', '2TB'];

  if (p_ram && !validRams.includes(p_ram)) {
    errors.push('Please select a valid RAM option from the dropdown.');
  }

  if (p_rom && !validRoms.includes(p_rom)) {
    errors.push('Please select a valid ROM option from the dropdown.');
  }

  if (isNaN(p_price) || p_price < 10000) {
    errors.push('Selling Price must be at least 10000 LKR.');
  }

  // Tablet Serial & SIM rules
  const isTablet = c_name === 'Tablet';
  if (isTablet) {
    if (!s_number) {
      errors.push('Serial Number is required for Tablet devices.');
    } else {
      const [chkSn] = await pool.query(
        'SELECT ID FROM tbl_stock_imeis WHERE SerialNumber = ? OR IMEI = ?',
        [s_number, s_number]
      );
      if (chkSn.length > 0) {
        errors.push(`Serial Number '${s_number}' is already registered in the database.`);
      }
    }
  }

  const sim_required = (!isTablet) || (isTablet && tab_has_sim);

  const is_dual_sim = s_type.toLowerCase().includes('dual');

  if (sim_required) {
    if (!s_type) {
      errors.push('Please select SIM Support type.');
    }

    if (!i1) {
      errors.push('IMEI 1 number is required.');
    } else if (!/^[0-9]{15}$/.test(i1)) {
      errors.push('IMEI 1 must be exactly 15 numeric digits.');
    } else {
      const [chk1] = await pool.query(
        'SELECT ID FROM tbl_stock_imeis WHERE IMEI = ? OR SerialNumber = ?',
        [i1, i1]
      );
      if (chk1.length > 0) {
        errors.push(`IMEI '${i1}' is already registered in the database.`);
      }
    }

    if (is_dual_sim) {
      if (!i2) {
        errors.push('IMEI 2 number is required for Dual SIM devices.');
      } else if (!/^[0-9]{15}$/.test(i2)) {
        errors.push('IMEI 2 must be exactly 15 numeric digits.');
      } else if (i1 === i2) {
        errors.push('IMEI 1 and IMEI 2 cannot be identical.');
      } else {
        const [chk2] = await pool.query(
          'SELECT ID FROM tbl_stock_imeis WHERE IMEI = ? OR SerialNumber = ?',
          [i2, i2]
        );
        if (chk2.length > 0) {
          errors.push(`IMEI '${i2}' is already registered in the database.`);
        }
      }
    }
  } else {
    s_type = 'None';
  }

  if (errors.length > 0) {
    return res.status(400).json({ message: errors.join(' ') });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Insert product master record
    const [pResult] = await conn.query(
      `INSERT INTO tblproducts
       (ProductName, BrandName, CategoryName, ModelNumber, SimType, Status, FrontCamera, KeyFeature, Specification, Processor, Display, Image1, Image2, Image3)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        p_name,
        b_name,
        c_name,
        m_number,
        s_type,
        p_status,
        f_camera,
        k_features,
        spec,
        p_processor,
        p_display,
        img1,
        img2,
        img3
      ]
    );

    const productId = pResult.insertId;

    // 2. Insert variant record
    const [vResult] = await conn.query(
      `INSERT INTO tblproduct_variants (ProductId, Color, RAM, ROM, Price, Stock)
       VALUES (?, ?, ?, ?, ?, 1)`,
      [productId, p_color, p_ram, p_rom, p_price]
    );

    const variantId = vResult.insertId;

    // 3. Auto-generate batch number and insert stock batch
    const batchNumber = await generateProductBatchNumber(conn);
    const costPrice = p_price * 0.8;

    const [bResult] = await conn.query(
      `INSERT INTO tbl_stock_batches (VariantId, BatchNumber, Dealer, PurchaseDate, CostPrice, SellingPrice, InitialQuantity, CurrentQuantity)
       VALUES (?, ?, 'Initial Product Registration', CURDATE(), ?, ?, 1, 1)`,
      [variantId, batchNumber, costPrice, p_price]
    );

    const batchId = bResult.insertId;

    // 4. Insert IMEIs / Serial Number into tbl_stock_imeis
    if (isTablet) {
      if (sim_required) {
        await conn.query(
          `INSERT INTO tbl_stock_imeis (BatchId, IMEI, SerialNumber, Status) VALUES (?, ?, ?, 'Available')`,
          [batchId, i1, s_number]
        );
        if (is_dual_sim) {
          await conn.query(
            `INSERT INTO tbl_stock_imeis (BatchId, IMEI, SerialNumber, Status) VALUES (?, ?, ?, 'Available')`,
            [batchId, i2, s_number]
          );
        }
      } else {
        await conn.query(
          `INSERT INTO tbl_stock_imeis (BatchId, IMEI, SerialNumber, Status) VALUES (?, NULL, ?, 'Available')`,
          [batchId, s_number]
        );
      }
    } else {
      await conn.query(
        `INSERT INTO tbl_stock_imeis (BatchId, IMEI, Status) VALUES (?, ?, 'Available')`,
        [batchId, i1]
      );
      if (is_dual_sim) {
        await conn.query(
          `INSERT INTO tbl_stock_imeis (BatchId, IMEI, Status) VALUES (?, ?, 'Available')`,
          [batchId, i2]
        );
      }
    }

    // 5. Stock movement log
    await conn.query(
      `INSERT INTO tbl_stock_log (VariantId, Quantity, MovementType, ReferenceInfo) VALUES (?, 1, 'Initial', ?)`,
      [variantId, `Batch ${batchNumber}`]
    );

    await conn.commit();
    res.status(201).json({ message: `Product "${p_name}" created successfully.`, id: productId });
  } catch (error) {
    await conn.rollback();
    console.error(error);
    res.status(500).json({ message: 'Something went wrong while creating the product: ' + error.message });
  } finally {
    conn.release();
  }
});

// 6. PUT UPDATE PRODUCT GENERAL INFO
router.put('/:id', verifyStaff(['Admin']), async (req, res) => {
  const { id } = req.params;
  const {
    ProductName, pname,
    BrandName, bname,
    CategoryName, cname,
    ModelNumber, modelno,
    SimType, simtype,
    Display, display,
    Processor, processor,
    FrontCamera, fcamera,
    KeyFeature, kfeatures,
    Specification, specification,
    Image1, image1,
    Image2, image2,
    Image3, image3,
    Status, status
  } = req.body;

  const p_name = (ProductName || pname || '').trim();
  const b_name = (BrandName || bname || '').trim();
  const c_name = (CategoryName || cname || '').trim();
  const m_number = (ModelNumber || modelno || '').trim();
  const f_camera = (FrontCamera || fcamera || '').trim();
  const p_processor = (Processor || processor || '').trim();
  const p_display = (Display || display || '').trim();
  let s_type = (SimType || simtype || '').trim();
  const k_features = (KeyFeature || kfeatures || '').trim();
  const spec = (Specification || specification || '').trim();
  const img1 = Image1 || image1;
  const img2 = Image2 || image2;
  const img3 = Image3 || image3;
  const p_status = Status !== undefined ? (Status ? 1 : 0) : (status !== undefined ? (status ? 1 : 0) : 1);

  const errors = [];
  const pattern = /^[a-zA-Z0-9\s\/]+$/;

  if (!p_name) {
    errors.push('Product Name is required.');
  } else if (!pattern.test(p_name)) {
    errors.push('Product Name cannot contain special characters, plus, minus, or decimals.');
  } else if (!/[a-zA-Z]/.test(p_name)) {
    errors.push('Product Name must contain at least one letter.');
  }

  if (!b_name) errors.push('Brand selection is required.');
  if (!c_name) errors.push('Category selection is required.');

  if (!m_number) {
    errors.push('Model Number is required.');
  } else if (!pattern.test(m_number)) {
    errors.push('Model Number cannot contain special characters, plus, minus, or decimals.');
  }

  if (f_camera && !pattern.test(f_camera)) {
    errors.push('Front Camera details cannot contain special characters, plus, minus, or decimals.');
  }

  if (p_processor && !pattern.test(p_processor)) {
    errors.push('Processor details cannot contain special characters, plus, minus, or decimals.');
  }

  if (p_display && !pattern.test(p_display)) {
    errors.push('Display details cannot contain special characters, plus, minus, or decimals.');
  }

  if (c_name !== 'Tablet' && (!s_type || s_type === 'None')) {
    errors.push('Please select a valid SIM Support type for Smartphone.');
  }

  if (errors.length > 0) {
    return res.status(400).json({ message: errors.join(' ') });
  }

  try {
    const fields = [p_name, b_name, c_name, m_number, s_type, p_display, p_processor, f_camera, k_features, spec, p_status];
    let query = `UPDATE tblproducts SET 
       ProductName = ?, BrandName = ?, CategoryName = ?, ModelNumber = ?, SimType = ?, Display = ?, 
       Processor = ?, FrontCamera = ?, KeyFeature = ?, Specification = ?, Status = ?`;

    if (img1) {
      query += `, Image1 = ?`;
      fields.push(img1);
    }
    if (img2) {
      query += `, Image2 = ?`;
      fields.push(img2);
    }
    if (img3) {
      query += `, Image3 = ?`;
      fields.push(img3);
    }

    query += ` WHERE ID = ?`;
    fields.push(id);

    await pool.query(query, fields);

    res.json({ message: 'Product updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error updating product: ' + error.message });
  }
});

// 7. ADD NEW PRODUCT VARIANT
router.post('/:id/variants', verifyStaff(['Admin']), async (req, res) => {
  const { id } = req.params;
  const { Color, v_color, RAM, v_ram, ROM, v_rom, Price, v_price, Stock, v_stock } = req.body;

  const color = (Color || v_color || '').trim();
  const ram = (RAM || v_ram || 'None').trim();
  const rom = (ROM || v_rom || 'None').trim();
  const price = floatval(Price || v_price || 0);
  const stock = parseInt(Stock !== undefined ? Stock : (v_stock !== undefined ? v_stock : 0));

  const errors = [];
  if (!color) {
    errors.push('Variant Color is required.');
  } else if (!/^[a-zA-Z\s\-\/]+$/.test(color)) {
    errors.push('Variant Color cannot contain numbers, minus numbers, or special characters.');
  }

  if (isNaN(price) || price < 10000) {
    errors.push('Variant Price must be at least 10000 LKR.');
  }

  if (isNaN(stock) || stock < 0) {
    errors.push('Initial Stock cannot be negative.');
  }

  if (errors.length > 0) {
    return res.status(400).json({ message: errors.join(' ') });
  }

  try {
    // Check duplicate color/RAM/ROM combination
    const [dup] = await pool.query(
      `SELECT ID FROM tblproduct_variants WHERE ProductId = ? AND LOWER(Color) = LOWER(?) AND LOWER(RAM) = LOWER(?) AND LOWER(ROM) = LOWER(?)`,
      [id, color, ram, rom]
    );

    if (dup.length > 0) {
      return res.status(400).json({ message: `Cannot add duplicate variant ('${color}', ${ram}, ${rom}) for this product.` });
    }

    const [vResult] = await pool.query(
      `INSERT INTO tblproduct_variants (ProductId, Color, RAM, ROM, Price, Stock) VALUES (?, ?, ?, ?, ?, ?)`,
      [id, color, ram, rom, price, stock]
    );

    const variantId = vResult.insertId;

    if (stock > 0) {
      await pool.query(
        `INSERT INTO tbl_stock_log (VariantId, Quantity, MovementType, ReferenceInfo) VALUES (?, ?, 'Restock', 'Added via Edit Product Page')`,
        [variantId, stock]
      );
    }

    res.status(201).json({ message: 'New product variant added successfully.', variantId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error adding variant: ' + error.message });
  }
});

// Helper floatval parser
function floatval(val) {
  const f = parseFloat(val);
  return isNaN(f) ? 0 : f;
}

// 8. UPDATE PRODUCT VARIANT (Price & Stock Inline Edit)
router.put('/variants/:variantId', verifyStaff(['Admin']), async (req, res) => {
  const { variantId } = req.params;
  const { Price, v_price, Stock, v_stock } = req.body;

  const price = floatval(Price || v_price || 0);
  const stock = parseInt(Stock !== undefined ? Stock : (v_stock !== undefined ? v_stock : 0));

  if (isNaN(price) || price < 10000) {
    return res.status(400).json({ message: 'Variant Price must be at least 10000 LKR.' });
  }
  if (isNaN(stock) || stock < 0) {
    return res.status(400).json({ message: 'Stock cannot be negative.' });
  }

  try {
    const [rows] = await pool.query('SELECT Stock FROM tblproduct_variants WHERE ID = ?', [variantId]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Variant not found.' });
    }

    const curStock = parseInt(rows[0].Stock || 0);

    await pool.query(
      'UPDATE tblproduct_variants SET Price = ?, Stock = ? WHERE ID = ?',
      [price, stock, variantId]
    );

    if (stock !== curStock) {
      const diff = stock - curStock;
      await pool.query(
        'INSERT INTO tbl_stock_log (VariantId, Quantity, MovementType, ReferenceInfo) VALUES (?, ?, ?, ?)',
        [variantId, diff, 'Correction', 'Manual Adjustment from Edit Page']
      );
    }

    res.json({ message: 'Variant updated successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error updating variant: ' + error.message });
  }
});

// 9. DELETE PRODUCT VARIANT
router.delete('/variants/:variantId', verifyStaff(['Admin']), async (req, res) => {
  const { variantId } = req.params;
  try {
    const [rows] = await pool.query('SELECT Stock, ProductId FROM tblproduct_variants WHERE ID = ?', [variantId]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Variant not found.' });
    }

    const currentStock = parseInt(rows[0].Stock || 0);
    if (currentStock > 0) {
      return res.status(400).json({
        message: `Cannot delete variant. This variant currently has active stock (${currentStock} units) in inventory. Set stock to 0 first.`
      });
    }

    await pool.query('DELETE FROM tblproduct_variants WHERE ID = ?', [variantId]);
    res.json({ message: 'Variant deleted successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error deleting variant: ' + error.message });
  }
});

// 10. UPDATE PRODUCT IMAGE
router.put('/:id/image/:imageNum', verifyStaff(['Admin']), async (req, res) => {
  const { id, imageNum } = req.params;
  const { imageName } = req.body;

  if (!['1', '2', '3'].includes(imageNum)) {
    return res.status(400).json({ message: 'Invalid image slot. Allowed slots: 1, 2, 3.' });
  }
  if (!imageName) {
    return res.status(400).json({ message: 'Image filename is required.' });
  }

  const column = `Image${imageNum}`;
  try {
    await pool.query(`UPDATE tblproducts SET ${column} = ? WHERE ID = ?`, [imageName, id]);
    res.json({ message: `Product Image ${imageNum} updated successfully.` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error updating product image: ' + error.message });
  }
});

// 11. DELETE PRODUCT
router.delete('/:id', verifyStaff(['Admin']), async (req, res) => {
  const { id } = req.params;
  try {
    // Check if there is active stock in any variants
    const [stockRows] = await pool.query('SELECT SUM(Stock) as TotalStock FROM tblproduct_variants WHERE ProductId = ?', [id]);
    const totalStock = parseInt(stockRows[0]?.TotalStock || 0);
    if (totalStock > 0) {
      return res.status(400).json({
        message: `Cannot delete product. This product currently has active stock (${totalStock} units) remaining across its variants. Set stock to 0 first.`
      });
    }

    await pool.query('DELETE FROM tblproducts WHERE ID = ?', [id]);
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error deleting product: ' + error.message });
  }
});

module.exports = router;
