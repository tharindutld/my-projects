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

// 5. POST NEW PRODUCT (Admin & Staff authorized)
router.post('/', verifyStaff(['Admin']), async (req, res) => {
  const {
    ProductName,
    BrandName,
    CategoryName,
    ModelNumber,
    SimType,
    Display,
    Processor,
    BackCamera,
    FrontCamera,
    Battery,
    OS,
    Warranty,
    Image1,
    Image2,
    Image3,
    Status
  } = req.body;

  if (!ProductName || !BrandName || !CategoryName || !ModelNumber) {
    return res.status(400).json({ message: 'ProductName, BrandName, CategoryName, and ModelNumber are required' });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO tblproducts 
       (ProductName, BrandName, CategoryName, ModelNumber, SimType, Display, Processor, BackCamera, FrontCamera, Battery, OS, Warranty, Image1, Image2, Image3, Status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        ProductName,
        BrandName,
        CategoryName,
        ModelNumber,
        SimType || 'Dual SIM',
        Display || '',
        Processor || '',
        BackCamera || '',
        FrontCamera || '',
        Battery || '',
        OS || '',
        Warranty || '',
        Image1 || '',
        Image2 || '',
        Image3 || '',
        Status !== undefined ? Status : 1
      ]
    );

    res.status(201).json({ message: 'Product created successfully', id: result.insertId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error creating product' });
  }
});

// 6. PUT UPDATE PRODUCT
router.put('/:id', verifyStaff(['Admin']), async (req, res) => {
  const { id } = req.params;
  const {
    ProductName,
    BrandName,
    CategoryName,
    ModelNumber,
    SimType,
    Display,
    Processor,
    BackCamera,
    FrontCamera,
    Battery,
    OS,
    Warranty,
    Image1,
    Image2,
    Image3,
    Status
  } = req.body;

  if (!ProductName || !BrandName || !CategoryName || !ModelNumber) {
    return res.status(400).json({ message: 'ProductName, BrandName, CategoryName, and ModelNumber are required' });
  }

  try {
    await pool.query(
      `UPDATE tblproducts SET 
       ProductName = ?, BrandName = ?, CategoryName = ?, ModelNumber = ?, SimType = ?, Display = ?, 
       Processor = ?, BackCamera = ?, FrontCamera = ?, Battery = ?, OS = ?, Warranty = ?, 
       Image1 = ?, Image2 = ?, Image3 = ?, Status = ? 
       WHERE ID = ?`,
      [
        ProductName,
        BrandName,
        CategoryName,
        ModelNumber,
        SimType,
        Display,
        Processor,
        BackCamera,
        FrontCamera,
        Battery,
        OS,
        Warranty,
        Image1,
        Image2,
        Image3,
        Status,
        id
      ]
    );

    res.json({ message: 'Product updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error updating product' });
  }
});

// 7. DELETE PRODUCT
router.delete('/:id', verifyStaff(['Admin']), async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM tblproducts WHERE ID = ?', [id]);
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error deleting product' });
  }
});

module.exports = router;
