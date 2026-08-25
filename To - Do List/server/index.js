import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import { getPool } from './config/db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/tasks', taskRoutes);

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const pool = await getPool();
    await pool.query('SELECT 1');
    res.json({ status: 'online', database: 'connected', timestamp: new Date() });
  } catch (error) {
    res.json({ status: 'degraded', database: 'disconnected', error: error.message });
  }
});

// Start Express Server & initialize MySQL DB connection
app.listen(PORT, async () => {
  console.log(`\n==================================================`);
  console.log(`🚀 Task Manager API Server running on http://localhost:${PORT}`);
  console.log(`==================================================\n`);

  try {
    await getPool();
  } catch (err) {
    console.warn(`[WARN] Server started, but MySQL is currently unreachable: ${err.message}`);
  }
});
