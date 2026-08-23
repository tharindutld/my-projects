const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verifyStaff } = require('../middleware/auth');

// 1. Fetch Repairs List (Filtered, Searched & Paginated)
router.get('/', verifyStaff(['Admin', 'Technician', 'Sales person']), async (req, res) => {
  const { status, technicianId, search, page = 1, limit = 10 } = req.query;
  const { id: loggedInStaffId, role: loggedInStaffRole } = req.user;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let countQuery = `
    SELECT COUNT(*) as count 
    FROM tbl_repairs r
    JOIN staff_users s ON r.TechnicianId = s.id
    WHERE 1=1
  `;
  let selectQuery = `
    SELECT r.*, s.first_name as TechFirstName, s.last_name as TechLastName, s.role as TechRole
    FROM tbl_repairs r
    JOIN staff_users s ON r.TechnicianId = s.id
    WHERE 1=1
  `;
  const params = [];

  // If role is Technician, restrict to only their assigned repairs
  if (loggedInStaffRole === 'Technician') {
    countQuery += ' AND r.TechnicianId = ?';
    selectQuery += ' AND r.TechnicianId = ?';
    params.push(loggedInStaffId);
  } else if (technicianId) {
    countQuery += ' AND r.TechnicianId = ?';
    selectQuery += ' AND r.TechnicianId = ?';
    params.push(parseInt(technicianId));
  }

  if (status) {
    countQuery += ' AND r.Status = ?';
    selectQuery += ' AND r.Status = ?';
    params.push(status);
  }

  if (search && search.trim()) {
    const searchVal = `%${search.trim()}%`;
    const searchClause = ` AND (r.CustomerName LIKE ? OR r.DeviceName LIKE ? OR r.BrandName LIKE ? OR r.ProductName LIKE ? OR r.IMEINumber LIKE ? OR s.first_name LIKE ? OR s.last_name LIKE ?)`;
    countQuery += searchClause;
    selectQuery += searchClause;
    params.push(searchVal, searchVal, searchVal, searchVal, searchVal, searchVal, searchVal);
  }

  selectQuery += ' ORDER BY r.RepairDate DESC, r.ID DESC LIMIT ? OFFSET ?';
  const selectParams = [...params, parseInt(limit), offset];

  try {
    const [countResult] = await pool.query(countQuery, params);
    const totalResults = countResult[0].count;

    const [repairs] = await pool.query(selectQuery, selectParams);

    res.json({
      repairs,
      pagination: {
        totalResults,
        totalPages: Math.ceil(totalResults / limit),
        currentPage: parseInt(page)
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching repairs list' });
  }
});

// Helper 1: Quick device & IMEI search for auto-fill in AddRepair
router.get('/quick-search', verifyStaff(['Admin', 'Technician', 'Sales person']), async (req, res) => {
  const { q } = req.query;
  if (!q || q.trim().length < 2) return res.json({ success: true, results: [] });

  const term = `%${q.trim()}%`;
  try {
    const [rows] = await pool.query(
      `SELECT p.id, p.ProductTitle as product_name, b.BrandName as brand, st.imei, p.Color as color, p.Storage as storage
       FROM tblproducts p
       LEFT JOIN tblbrand b ON p.ProductBrand = b.id OR p.ProductBrand = b.BrandName
       LEFT JOIN tbl_stock st ON p.id = st.product_id
       WHERE p.ProductTitle LIKE ? OR b.BrandName LIKE ? OR st.imei LIKE ? OR p.ModelNumber LIKE ?
       LIMIT 10`,
      [term, term, term, term]
    );

    res.json({ success: true, results: rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Quick search failed' });
  }
});

// Helper 2: Fetch brand list for repairs dropdown
router.get('/helper/brands', verifyStaff(['Admin', 'Technician', 'Sales person']), async (req, res) => {
  try {
    const [brands] = await pool.query(`SELECT BrandName FROM tblbrand ORDER BY BrandName ASC`);
    res.json(brands);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching brands' });
  }
});

// Helper 3: Fetch products by brand name
router.get('/helper/products-by-brand', verifyStaff(['Admin', 'Technician', 'Sales person']), async (req, res) => {
  const { brand } = req.query;
  if (!brand) return res.json([]);
  try {
    const [products] = await pool.query(
      `SELECT p.id, p.ProductTitle as product_name 
       FROM tblproducts p 
       LEFT JOIN tblbrand b ON p.ProductBrand = b.id OR p.ProductBrand = b.BrandName
       WHERE b.BrandName = ? OR p.ProductBrand = ?
       ORDER BY p.ProductTitle ASC`,
      [brand, brand]
    );
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching products by brand' });
  }
});

// Helper 4: Fetch IMEIs for a product
router.get('/helper/imeis-by-product', verifyStaff(['Admin', 'Technician', 'Sales person']), async (req, res) => {
  const { productId, productName } = req.query;
  try {
    let query = `SELECT imei, status, CONCAT(IFNULL(color,''), ' ', IFNULL(storage,'')) as specs FROM tbl_stock WHERE 1=1`;
    const params = [];
    if (productId) {
      query += ` AND product_id = ?`;
      params.push(productId);
    } else if (productName) {
      query += ` AND product_id IN (SELECT id FROM tblproducts WHERE ProductTitle = ?)`;
      params.push(productName);
    } else {
      return res.json([]);
    }
    const [imeis] = await pool.query(query, params);
    res.json(imeis);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching IMEIs' });
  }
});

// 2. Fetch Single Repair Detail
router.get('/:id', verifyStaff(['Admin', 'Technician', 'Sales person']), async (req, res) => {
  const { id } = req.params;
  const { id: loggedInStaffId, role: loggedInStaffRole } = req.user;

  try {
    const [rows] = await pool.query(
      `SELECT r.*, s.first_name as TechFirstName, s.last_name as TechLastName
       FROM tbl_repairs r
       JOIN staff_users s ON r.TechnicianId = s.id
       WHERE r.ID = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Repair job not found' });
    }

    const repair = rows[0];

    // Authorize technician access
    if (loggedInStaffRole === 'Technician' && repair.TechnicianId !== loggedInStaffId) {
      return res.status(403).json({ message: 'Forbidden: You are not assigned to this repair.' });
    }

    res.json(repair);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching repair details' });
  }
});

// 3. Create New Repair Job
router.post('/', verifyStaff(['Admin', 'Sales person']), async (req, res) => {
  const {
    CustomerName,
    BrandName,
    ProductName,
    IMEINumber,
    DeviceName,
    Issue,
    Cost = 0,
    Income = 0,
    TechnicianId,
    Status = 'Pending',
    RepairDate,
    RepairNotes,
    PartsUsed,
    LaborTime
  } = req.body;

  if (!CustomerName || !DeviceName || !Issue || !TechnicianId || !RepairDate) {
    return res.status(400).json({ message: 'CustomerName, DeviceName, Issue, TechnicianId, and RepairDate are required' });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO tbl_repairs 
       (CustomerName, BrandName, ProductName, IMEINumber, DeviceName, Issue, Cost, Income, TechnicianId, Status, RepairDate, RepairNotes, PartsUsed, LaborTime) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        CustomerName,
        BrandName || '',
        ProductName || '',
        IMEINumber || '',
        DeviceName,
        Issue,
        parseFloat(Cost),
        parseFloat(Income),
        parseInt(TechnicianId),
        Status || 'Pending',
        RepairDate,
        RepairNotes || '',
        PartsUsed || '',
        LaborTime || ''
      ]
    );

    res.status(201).json({ message: 'Repair log has been successfully added.', id: result.insertId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error creating repair job' });
  }
});

// Quick inline update status endpoint
router.patch('/:id/status', verifyStaff(['Admin', 'Technician']), async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!status) return res.status(400).json({ success: false, message: 'Status is required' });

  try {
    await pool.query('UPDATE tbl_repairs SET Status = ? WHERE ID = ?', [status, id]);
    res.json({ success: true, status, message: `Status updated to "${status}"` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to update repair status' });
  }
});

// 4. Update Repair Job (Admin or Assigned Technician)
router.put('/:id', verifyStaff(['Admin', 'Technician', 'Sales person']), async (req, res) => {
  const { id } = req.params;
  const { id: loggedInStaffId, role: loggedInStaffRole } = req.user;

  const {
    CustomerName,
    BrandName,
    ProductName,
    IMEINumber,
    DeviceName,
    Issue,
    Cost,
    Income,
    TechnicianId,
    Status,
    RepairDate,
    RepairNotes,
    PartsUsed,
    LaborTime
  } = req.body;

  try {
    // Check if repair exists
    const [existing] = await pool.query('SELECT TechnicianId FROM tbl_repairs WHERE ID = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Repair job not found' });
    }

    // Authorization
    if (loggedInStaffRole === 'Technician' && existing[0].TechnicianId !== loggedInStaffId) {
      return res.status(403).json({ message: 'Forbidden: You are not assigned to this repair.' });
    }

    await pool.query(
      `UPDATE tbl_repairs SET 
       CustomerName = ?, BrandName = ?, ProductName = ?, IMEINumber = ?, DeviceName = ?, Issue = ?, 
       Cost = ?, Income = ?, TechnicianId = ?, Status = ?, RepairDate = ?, RepairNotes = ?, PartsUsed = ?, LaborTime = ? 
       WHERE ID = ?`,
      [
        CustomerName,
        BrandName,
        ProductName,
        IMEINumber,
        DeviceName,
        Issue,
        parseFloat(Cost),
        parseFloat(Income),
        parseInt(TechnicianId),
        Status,
        RepairDate,
        RepairNotes,
        PartsUsed,
        LaborTime,
        id
      ]
    );

    res.json({ message: 'Repair job updated successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error updating repair job' });
  }
});

// 5. Delete Repair Job
router.delete('/:id', verifyStaff(['Admin']), async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM tbl_repairs WHERE ID = ?', [id]);
    res.json({ message: 'Repair job deleted successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error deleting repair job' });
  }
});

module.exports = router;
