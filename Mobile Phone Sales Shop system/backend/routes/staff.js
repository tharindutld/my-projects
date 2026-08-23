const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const { verifyStaff } = require('../middleware/auth');

// 1. GET ALL STAFF USERS (Admin Only)
router.get('/', verifyStaff(['Admin']), async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, first_name, last_name, email, phone, gender, birth_date, role, status, created_at FROM staff_users ORDER BY id DESC'
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// 2. GET LIST OF ACTIVE TECHNICIANS (Accessible by Admin and Sales person)
router.get('/technicians', verifyStaff(['Admin', 'Sales person']), async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, first_name, last_name FROM staff_users WHERE role = 'Technician' AND status = 'Active' ORDER BY first_name ASC"
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// 3. CREATE NEW STAFF USER (Admin Only)
router.post('/', verifyStaff(['Admin']), async (req, res) => {
  const { first_name, last_name, email, phone, gender, birth_date, role, status, password } = req.body;

  if (!first_name || !last_name || !email || !phone || !gender || !birth_date || !role || !status || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    // Check if email already registered
    const [existing] = await pool.query('SELECT id FROM staff_users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Email address already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      `INSERT INTO staff_users 
       (first_name, last_name, email, phone, gender, birth_date, role, status, password) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [first_name, last_name, email, phone, gender, birth_date, role, status, hashedPassword]
    );

    res.status(201).json({ message: 'Staff user created successfully', id: result.insertId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// 4. UPDATE STAFF USER (Admin Only)
router.put('/:id', verifyStaff(['Admin']), async (req, res) => {
  const { id } = req.params;
  const { first_name, last_name, email, phone, gender, birth_date, role, status, password } = req.body;

  if (!first_name || !last_name || !email || !phone || !gender || !birth_date || !role || !status) {
    return res.status(400).json({ message: 'Required fields are missing' });
  }

  try {
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      await pool.query(
        `UPDATE staff_users SET 
         first_name = ?, last_name = ?, email = ?, phone = ?, gender = ?, birth_date = ?, role = ?, status = ?, password = ? 
         WHERE id = ?`,
        [first_name, last_name, email, phone, gender, birth_date, role, status, hashedPassword, id]
      );
    } else {
      await pool.query(
        `UPDATE staff_users SET 
         first_name = ?, last_name = ?, email = ?, phone = ?, gender = ?, birth_date = ?, role = ?, status = ? 
         WHERE id = ?`,
        [first_name, last_name, email, phone, gender, birth_date, role, status, id]
      );
    }

    res.json({ message: 'Staff user updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// 5. DELETE STAFF USER (Admin Only)
router.delete('/:id', verifyStaff(['Admin']), async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM staff_users WHERE id = ?', [id]);
    res.json({ message: 'Staff user deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// 6. GET REGISTERED CUSTOMERS (Admin and Sales person)
router.get('/customers', verifyStaff(['Admin', 'Sales person']), async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT ID, FirstName, LastName, MobileNumber, Email, LoyaltyPoints, Status, RegDate FROM tbluser ORDER BY ID DESC'
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// 7. GET REGISTERED CUSTOMERS — Paginated with search (for AdminUsers.jsx)
router.get('/users', verifyStaff(['Admin', 'Sales person']), async (req, res) => {
  const { search, page = 1, limit = 15 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  let whereClause = '';
  const params = [];

  if (search) {
    whereClause = 'WHERE (FirstName LIKE ? OR LastName LIKE ? OR Email LIKE ? OR MobileNumber LIKE ?)';
    const s = `%${search}%`;
    params.push(s, s, s, s);
  }

  try {
    const [[{ total }]] = await pool.query(`SELECT COUNT(*) as total FROM tbluser ${whereClause}`, params);
    const [rows] = await pool.query(
      `SELECT ID, FirstName, LastName, MobileNumber, Email, LoyaltyPoints, Status, RegDate, RegDate AS CreationDate FROM tbluser ${whereClause} ORDER BY ID DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );
    res.json({ users: rows, totalRows: total, totalPages: Math.ceil(total / parseInt(limit)), page: parseInt(page) });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// 8. TOGGLE CUSTOMER ACTIVE STATUS (Admin and Sales person)
router.put('/customers/:id/status', verifyStaff(['Admin', 'Sales person']), async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['Active', 'Inactive'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  try {
    await pool.query('UPDATE tbluser SET Status = ? WHERE ID = ?', [status, id]);
    res.json({ message: `Customer status updated to ${status} successfully.` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// 9. TOGGLE CUSTOMER STATUS — alternate route used by AdminUsers.jsx
router.put('/users/:id/status', verifyStaff(['Admin', 'Sales person']), async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['Active', 'Inactive'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  try {
    await pool.query('UPDATE tbluser SET Status = ? WHERE ID = ?', [status, id]);
    res.json({ message: `Customer status updated to ${status} successfully.` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

