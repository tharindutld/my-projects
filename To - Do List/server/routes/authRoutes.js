import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getPool } from '../config/db.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'antigravity_todo_secret_2026';

// Register User
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password, avatar } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({ error: 'Name, email, phone number, and password are required.' });
    }

    // 1. Name validation: No numbers, decimals, minus, plus, special characters (only letters and spaces)
    const nameRegex = /^[A-Za-z\s]+$/;
    if (!nameRegex.test(name.trim())) {
      return res.status(400).json({
        error: 'Name cannot include numbers, special characters, decimals, minus or plus.',
        field: 'name'
      });
    }

    // 2. Phone validation: Exactly 10 digits, no letters, special characters
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phone.trim())) {
      return res.status(400).json({
        error: 'Phone number must be exactly 10 digits (no letters or special characters).',
        field: 'phone'
      });
    }

    // 3. Email validation: No duplicate @, standard format
    const atCount = (email.match(/@/g) || []).length;
    if (atCount !== 1) {
      return res.status(400).json({
        error: atCount > 1 ? 'Email cannot contain multiple @ signs.' : 'Email must contain an @ sign.',
        field: 'email'
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({
        error: 'Please enter a valid email address in standard format.',
        field: 'email'
      });
    }

    const pool = await getPool();

    // Check if email exists
    const [existingEmail] = await pool.query('SELECT id FROM users WHERE email = ?', [email.trim()]);
    if (existingEmail.length > 0) {
      return res.status(400).json({ error: 'Email is already registered.', field: 'email' });
    }

    // Check if phone exists
    const [existingPhone] = await pool.query('SELECT id FROM users WHERE phone = ?', [phone.trim()]);
    if (existingPhone.length > 0) {
      return res.status(400).json({ error: 'Phone number is already registered.', field: 'phone' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userAvatar = avatar || '⚡';

    const [result] = await pool.query(
      'INSERT INTO users (name, email, phone, password, avatar) VALUES (?, ?, ?, ?, ?)',
      [name.trim(), email.trim(), phone.trim(), hashedPassword, userAvatar]
    );

    const userId = result.insertId;
    const token = jwt.sign({ id: userId, email: email.trim() }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      message: 'Account created successfully!',
      token,
      user: { id: userId, name: name.trim(), email: email.trim(), phone: phone.trim(), avatar: userAvatar }
    });
  } catch (error) {
    console.error('Registration error:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      if (error.sqlMessage && error.sqlMessage.includes('phone')) {
        return res.status(400).json({ error: 'Phone number is already registered.', field: 'phone' });
      }
      return res.status(400).json({ error: 'Email is already registered.', field: 'email' });
    }
    res.status(500).json({ error: error.message || 'Server error during registration.' });
  }
});

// Login User
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const atCount = (email.match(/@/g) || []).length;
    if (atCount !== 1) {
      return res.status(400).json({ error: 'Email cannot contain multiple @ signs.', field: 'email' });
    }

    const pool = await getPool();
    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email.trim()]);

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      message: 'Login successful!',
      token,
      user: { id: user.id, name: user.name, email: user.email, phone: user.phone, avatar: user.avatar }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message || 'Server error during login.' });
  }
});

// Get Current User Profile
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No authorization token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const pool = await getPool();
    const [users] = await pool.query('SELECT id, name, email, phone, avatar, created_at FROM users WHERE id = ?', [decoded.id]);

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.json({ user: users[0] });
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token.' });
  }
});

// Update User Profile
router.put('/me', async (req, res) => {
  try {
    const { id, name, phone, avatar } = req.body;

    if (!id || !name || !phone) {
      return res.status(400).json({ error: 'User ID, name, and phone number are required.' });
    }

    const nameRegex = /^[A-Za-z\s]+$/;
    if (!nameRegex.test(name.trim())) {
      return res.status(400).json({
        error: 'Name cannot include numbers, special characters, decimals, minus or plus.',
        field: 'name'
      });
    }

    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phone.trim())) {
      return res.status(400).json({
        error: 'Phone number must be exactly 10 digits (no letters or special characters).',
        field: 'phone'
      });
    }

    const pool = await getPool();

    // Check if phone number is taken by another user
    const [existingPhone] = await pool.query('SELECT id FROM users WHERE phone = ? AND id != ?', [phone.trim(), id]);
    if (existingPhone.length > 0) {
      return res.status(400).json({ error: 'Phone number is already registered by another account.', field: 'phone' });
    }

    await pool.query(
      'UPDATE users SET name = ?, phone = ?, avatar = ? WHERE id = ?',
      [name.trim(), phone.trim(), avatar || '⚡', id]
    );

    const [updatedUsers] = await pool.query('SELECT id, name, email, phone, avatar, created_at FROM users WHERE id = ?', [id]);
    res.json({ message: 'Profile updated successfully!', user: updatedUsers[0] });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Server error updating profile.' });
  }
});

export default router;
