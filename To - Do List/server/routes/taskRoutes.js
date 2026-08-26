import express from 'express';
import { getPool } from '../config/db.js';

const router = express.Router();

// Helper: Attach subtasks to tasks array
async function attachSubtasks(pool, tasks) {
  if (tasks.length === 0) return tasks;

  const taskIds = tasks.map((t) => t.id);
  const [subtasks] = await pool.query(
    `SELECT * FROM subtasks WHERE task_id IN (?) ORDER BY id ASC`,
    [taskIds]
  );

  const subtaskMap = {};
  subtasks.forEach((st) => {
    if (!subtaskMap[st.task_id]) subtaskMap[st.task_id] = [];
    subtaskMap[st.task_id].push(st);
  });

  return tasks.map((t) => ({
    ...t,
    subtasks: subtaskMap[t.id] || [],
  }));
}

// Get All Tasks
router.get('/', async (req, res) => {
  try {
    const { search, category, status, priority, userId, starred } = req.query;
    const pool = await getPool();

    let query = `
      SELECT t.*, c.name as category_name, c.color as category_color, c.icon as category_icon
      FROM tasks t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (userId) {
      query += ' AND (t.user_id = ? OR t.user_id IS NULL)';
      params.push(userId);
    }

    if (search) {
      query += ' AND (t.title LIKE ? OR t.description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (category) {
      query += ' AND t.category_id = ?';
      params.push(category);
    }

    if (status) {
      query += ' AND t.status = ?';
      params.push(status);
    }

    if (priority) {
      query += ' AND t.priority = ?';
      params.push(priority);
    }

    if (starred === 'true') {
      query += ' AND t.is_starred = 1';
    }

    query += ' ORDER BY t.is_pinned DESC, t.created_at DESC';

    const [tasks] = await pool.query(query, params);
    const tasksWithSubtasks = await attachSubtasks(pool, tasks);

    res.json(tasksWithSubtasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks.' });
  }
});

// Create Task
router.post('/', async (req, res) => {
  try {
    const {
      title,
      description,
      status = 'todo',
      priority = 'medium',
      due_date,
      category_id,
      user_id,
      is_starred = 0,
      is_pinned = 0,
      subtasks = []
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Task title is required.' });
    }

    if (!/[A-Za-z]/.test(title.trim()) || !/^[A-Za-z0-9\s]+$/.test(title.trim())) {
      return res.status(400).json({
        error: 'Task title must contain letters (can include numbers, but no special characters, minus, or plus).'
      });
    }

    if (due_date) {
      const todayStr = new Date().toISOString().substring(0, 10);
      const inputDateStr = due_date.substring(0, 10);
      if (inputDateStr < todayStr) {
        return res.status(400).json({ error: 'Due date cannot be a past date.' });
      }
    }

    const pool = await getPool();
    const [result] = await pool.query(
      `INSERT INTO tasks (user_id, category_id, title, description, status, priority, due_date, is_starred, is_pinned)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user_id || null,
        category_id || null,
        title,
        description || null,
        status,
        priority,
        due_date || null,
        is_starred ? 1 : 0,
        is_pinned ? 1 : 0
      ]
    );

    const taskId = result.insertId;

    // Insert subtasks if provided
    if (subtasks && subtasks.length > 0) {
      for (const st of subtasks) {
        if (typeof st === 'string' && st.trim() !== '') {
          await pool.query('INSERT INTO subtasks (task_id, title) VALUES (?, ?)', [taskId, st.trim()]);
        } else if (st && st.title) {
          await pool.query('INSERT INTO subtasks (task_id, title, completed) VALUES (?, ?, ?)', [
            taskId,
            st.title,
            st.completed ? 1 : 0
          ]);
        }
      }
    }

    const [created] = await pool.query(
      `SELECT t.*, c.name as category_name, c.color as category_color 
       FROM tasks t LEFT JOIN categories c ON t.category_id = c.id WHERE t.id = ?`,
      [taskId]
    );

    const [stList] = await pool.query('SELECT * FROM subtasks WHERE task_id = ?', [taskId]);

    res.status(201).json({
      ...created[0],
      subtasks: stList
    });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task.' });
  }
});

// Update Task
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      status,
      priority,
      due_date,
      category_id,
      is_starred,
      is_pinned
    } = req.body;

    const pool = await getPool();

    if (due_date) {
      const todayStr = new Date().toISOString().substring(0, 10);
      const inputDateStr = due_date.substring(0, 10);
      if (inputDateStr < todayStr) {
        return res.status(400).json({ error: 'Due date cannot be a past date.' });
      }
    }

    await pool.query(
      `UPDATE tasks SET
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        status = COALESCE(?, status),
        priority = COALESCE(?, priority),
        due_date = COALESCE(?, due_date),
        category_id = COALESCE(?, category_id),
        is_starred = COALESCE(?, is_starred),
        is_pinned = COALESCE(?, is_pinned)
      WHERE id = ?`,
      [
        title || null,
        description !== undefined ? description : null,
        status || null,
        priority || null,
        due_date || null,
        category_id || null,
        is_starred !== undefined ? (is_starred ? 1 : 0) : null,
        is_pinned !== undefined ? (is_pinned ? 1 : 0) : null,
        id
      ]
    );

    const [updated] = await pool.query(
      `SELECT t.*, c.name as category_name, c.color as category_color 
       FROM tasks t LEFT JOIN categories c ON t.category_id = c.id WHERE t.id = ?`,
      [id]
    );

    const [stList] = await pool.query('SELECT * FROM subtasks WHERE task_id = ?', [id]);

    res.json({
      ...updated[0],
      subtasks: stList
    });
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task.' });
  }
});

// Fast Toggle Task Completion Status
router.put('/:id/toggle', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getPool();

    const [tasks] = await pool.query('SELECT status FROM tasks WHERE id = ?', [id]);
    if (tasks.length === 0) return res.status(404).json({ error: 'Task not found.' });

    const newStatus = tasks[0].status === 'completed' ? 'todo' : 'completed';
    await pool.query('UPDATE tasks SET status = ? WHERE id = ?', [newStatus, id]);

    res.json({ id, status: newStatus });
  } catch (error) {
    res.status(500).json({ error: 'Failed to toggle task.' });
  }
});

// Delete Task
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getPool();
    await pool.query('DELETE FROM tasks WHERE id = ?', [id]);
    res.json({ message: 'Task deleted.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete task.' });
  }
});

// Subtask Operations
router.post('/:id/subtasks', async (req, res) => {
  try {
    const { id } = req.params;
    const { title } = req.body;
    if (!title) return res.status(400).json({ error: 'Subtask title is required.' });

    const pool = await getPool();
    const [result] = await pool.query('INSERT INTO subtasks (task_id, title) VALUES (?, ?)', [id, title]);

    res.status(201).json({ id: result.insertId, task_id: Number(id), title, completed: 0 });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add subtask.' });
  }
});

router.put('/subtasks/:subtaskId', async (req, res) => {
  try {
    const { subtaskId } = req.params;
    const { completed, title } = req.body;

    const pool = await getPool();
    await pool.query(
      'UPDATE subtasks SET completed = COALESCE(?, completed), title = COALESCE(?, title) WHERE id = ?',
      [completed !== undefined ? (completed ? 1 : 0) : null, title || null, subtaskId]
    );

    res.json({ message: 'Subtask updated.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update subtask.' });
  }
});

router.delete('/subtasks/:subtaskId', async (req, res) => {
  try {
    const { subtaskId } = req.params;
    const pool = await getPool();
    await pool.query('DELETE FROM subtasks WHERE id = ?', [subtaskId]);
    res.json({ message: 'Subtask deleted.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete subtask.' });
  }
});

// Analytics Dashboard Endpoint
router.get('/stats/summary', async (req, res) => {
  try {
    const pool = await getPool();

    const [totalRes] = await pool.query('SELECT COUNT(*) as total FROM tasks');
    const [completedRes] = await pool.query("SELECT COUNT(*) as completed FROM tasks WHERE status = 'completed'");
    const [inProgressRes] = await pool.query("SELECT COUNT(*) as in_progress FROM tasks WHERE status = 'in_progress'");
    const [pendingRes] = await pool.query("SELECT COUNT(*) as pending FROM tasks WHERE status = 'todo'");
    const [urgentRes] = await pool.query("SELECT COUNT(*) as urgent FROM tasks WHERE priority = 'urgent' AND status != 'completed'");

    const total = totalRes[0].total || 0;
    const completed = completedRes[0].completed || 0;
    const inProgress = inProgressRes[0].in_progress || 0;
    const pending = pendingRes[0].pending || 0;
    const urgent = urgentRes[0].urgent || 0;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    res.json({
      total,
      completed,
      inProgress,
      pending,
      urgent,
      completionRate
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats.' });
  }
});

export default router;
