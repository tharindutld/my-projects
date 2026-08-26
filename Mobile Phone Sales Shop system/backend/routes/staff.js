const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const { verifyStaff } = require('../middleware/auth');

// 1. GET ALL STAFF USERS (Admin Only)
router.get('/', verifyStaff(['Admin']), async (req, res) => {
  const { search, role, page, limit = 10 } = req.query;

  let whereClause = 'WHERE 1=1';
  const params = [];

  if (search) {
    whereClause += ' AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ?)';
    const s = `%${search}%`;
    params.push(s, s, s);
  }

  if (role) {
    whereClause += ' AND role = ?';
    params.push(role);
  }

  try {
    if (page) {
      const p = parseInt(page, 10) || 1;
      const l = parseInt(limit, 10) || 10;
      const offset = (p - 1) * l;

      const [[{ total }]] = await pool.query(`SELECT COUNT(*) as total FROM staff_users ${whereClause}`, params);
      const [rows] = await pool.query(
        `SELECT id, first_name, last_name, email, phone, gender, birth_date, role, status, created_at 
         FROM staff_users ${whereClause} ORDER BY id DESC LIMIT ? OFFSET ?`,
        [...params, l, offset]
      );

      return res.json({
        staff: rows,
        totalRows: total,
        totalPages: Math.ceil(total / l),
        page: p
      });
    } else {
      const [rows] = await pool.query(
        `SELECT id, first_name, last_name, email, phone, gender, birth_date, role, status, created_at 
         FROM staff_users ${whereClause} ORDER BY id DESC`,
        params
      );
      return res.json(rows);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET SINGLE STAFF USER BY ID (Admin Only)
router.get('/user/:id', verifyStaff(['Admin']), async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(
      'SELECT id, first_name, last_name, email, phone, gender, birth_date, role, status, created_at FROM staff_users WHERE id = ?',
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Staff member not found' });
    }
    res.json(rows[0]);
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
    return res.status(400).json({ message: 'All required fields must be filled.' });
  }

  // Validations
  const nameRegex = /^[a-zA-Z\s]+$/;
  if (!nameRegex.test(first_name) || first_name.trim().length < 2 || first_name.trim().length > 50) {
    return res.status(400).json({ message: 'First name must contain only letters and spaces (2-50 characters).' });
  }
  if (!nameRegex.test(last_name) || last_name.trim().length < 2 || last_name.trim().length > 50) {
    return res.status(400).json({ message: 'Last name must contain only letters and spaces (2-50 characters).' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return res.status(400).json({ message: 'Please enter a valid email address.' });
  }
  if (!/^0[0-9]{9}$/.test(phone.trim())) {
    return res.status(400).json({ message: 'Phone number must be exactly 10 digits starting with 0.' });
  }
  if (!['Male', 'Female'].includes(gender)) {
    return res.status(400).json({ message: 'Please select a valid gender.' });
  }
  if (!['Admin', 'Sales person', 'Technician'].includes(role)) {
    return res.status(400).json({ message: 'Please select a valid role.' });
  }
  if (!['Active', 'Inactive'].includes(status)) {
    return res.status(400).json({ message: 'Please select a valid status.' });
  }
  if (password.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters long.' });
  }

  // Age Check >= 18
  const birth = new Date(birth_date);
  const today = new Date();
  if (isNaN(birth.getTime()) || birth > today) {
    return res.status(400).json({ message: 'Birth date cannot be in the future.' });
  }
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  if (age < 18) {
    return res.status(400).json({ message: 'Staff member must be at least 18 years old.' });
  }

  try {
    // Check if email already registered
    const [existing] = await pool.query('SELECT id FROM staff_users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'An account with this email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      `INSERT INTO staff_users 
       (first_name, last_name, email, phone, gender, birth_date, role, status, password) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [first_name.trim(), last_name.trim(), email.trim(), phone.trim(), gender, birth_date, role, status, hashedPassword]
    );

    res.status(201).json({ message: 'Staff member added successfully.', id: result.insertId });
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
    return res.status(400).json({ message: 'All required fields must be filled.' });
  }

  // Validations
  const nameRegex = /^[a-zA-Z\s]+$/;
  if (!nameRegex.test(first_name) || first_name.trim().length < 2 || first_name.trim().length > 50) {
    return res.status(400).json({ message: 'First name must contain only letters and spaces (2-50 characters).' });
  }
  if (!nameRegex.test(last_name) || last_name.trim().length < 2 || last_name.trim().length > 50) {
    return res.status(400).json({ message: 'Last name must contain only letters and spaces (2-50 characters).' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return res.status(400).json({ message: 'Please enter a valid email address.' });
  }
  if (!/^0[0-9]{9}$/.test(phone.trim())) {
    return res.status(400).json({ message: 'Phone number must be exactly 10 digits starting with 0.' });
  }
  if (password && password.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters long.' });
  }

  // Age Check >= 18
  const birth = new Date(birth_date);
  const today = new Date();
  if (isNaN(birth.getTime()) || birth > today) {
    return res.status(400).json({ message: 'Birth date cannot be in the future.' });
  }
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  if (age < 18) {
    return res.status(400).json({ message: 'Staff member must be at least 18 years old.' });
  }

  try {
    // Check if email already used by another user
    const [existing] = await pool.query('SELECT id FROM staff_users WHERE email = ? AND id != ?', [email, id]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'An account with this email already exists.' });
    }

    if (password && password.trim().length >= 8) {
      const hashedPassword = await bcrypt.hash(password, 10);
      await pool.query(
        `UPDATE staff_users SET 
         first_name = ?, last_name = ?, email = ?, phone = ?, gender = ?, birth_date = ?, role = ?, status = ?, password = ? 
         WHERE id = ?`,
        [first_name.trim(), last_name.trim(), email.trim(), phone.trim(), gender, birth_date, role, status, hashedPassword, id]
      );
    } else {
      await pool.query(
        `UPDATE staff_users SET 
         first_name = ?, last_name = ?, email = ?, phone = ?, gender = ?, birth_date = ?, role = ?, status = ? 
         WHERE id = ?`,
        [first_name.trim(), last_name.trim(), email.trim(), phone.trim(), gender, birth_date, role, status, id]
      );
    }

    res.json({ message: 'Staff profile updated successfully.' });
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

