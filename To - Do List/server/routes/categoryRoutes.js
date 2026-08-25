import express from 'express';
import { getPool } from '../config/db.js';

const router = express.Router();

// Get Categories
router.get('/', async (req, res) => {
  try {
    const userId = req.query.userId || null;
    const pool = await getPool();

    let query = 'SELECT * FROM categories WHERE user_id IS NULL';
    const params = [];

    if (userId) {
      query += ' OR user_id = ?';
      params.push(userId);
    }
    query += ' ORDER BY created_at ASC';

    const [categories] = await pool.query(query, params);
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories.' });
  }
});

// Create Category
router.post('/', async (req, res) => {
  try {
    const { name, color, icon, userId } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Category name is required.' });
    }

    const pool = await getPool();
    const [result] = await pool.query(
      'INSERT INTO categories (name, color, icon, user_id) VALUES (?, ?, ?, ?)',
      [name, color || '#6366f1', icon || 'folder', userId || null]
    );

    const [newCategory] = await pool.query('SELECT * FROM categories WHERE id = ?', [result.insertId]);
    res.status(201).json(newCategory[0]);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Failed to create category.' });
  }
});

// Delete Category
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getPool();
    await pool.query('DELETE FROM categories WHERE id = ?', [id]);
    res.json({ message: 'Category deleted successfully.' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: 'Failed to delete category.' });
  }
});

export default router;
