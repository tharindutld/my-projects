const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verifyStaff } = require('../middleware/auth');

// 1. Fetch Repairs List (Filtered & Paginated)
router.get('/', verifyStaff(['Admin', 'Technician', 'Sales person']), async (req, res) => {
  const { status, technicianId, page = 1, limit = 10 } = req.query;
  const { id: loggedInStaffId, role: loggedInStaffRole } = req.user;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let countQuery = `
    SELECT COUNT(*) as count 
    FROM tbl_repairs r
    JOIN staff_users s ON r.TechnicianId = s.id
    WHERE 1=1
  `;
  let selectQuery = `
    SELECT r.*, s.first_name as TechFirstName, s.last_name as TechLastName
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
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', ?, ?, ?, ?)`,
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
        RepairDate,
        RepairNotes || '',
        PartsUsed || '',
        LaborTime || ''
      ]
    );

    res.status(201).json({ message: 'Repair job recorded successfully', id: result.insertId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error creating repair job' });
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
