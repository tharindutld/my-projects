import mysql from 'mysql2/promise';

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASS = process.env.DB_PASS || '';
const DB_NAME = process.env.DB_NAME || 'defaultdb';
const DB_PORT = parseInt(process.env.DB_PORT || '3306', 10);

const sslConfig = (process.env.DB_SSL === 'true' || (DB_HOST !== 'localhost' && DB_HOST !== '127.0.0.1'))
  ? { rejectUnauthorized: false }
  : undefined;

let pool = null;

export async function getPool() {
  if (pool) return pool;

  let dbToUse = DB_NAME || 'defaultdb';

  try {
    try {
      pool = mysql.createPool({
        host: DB_HOST,
        user: DB_USER,
        password: DB_PASS,
        database: dbToUse,
        port: DB_PORT,
        ssl: sslConfig,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        connectTimeout: 10000
      });

      // Test connection
      await pool.query('SELECT 1');
    } catch (dbErr) {
      pool = null;
      // Fallback: If specified database does not exist on cloud DB (e.g. Aiven), try 'defaultdb'
      if (dbErr.code === 'ER_BAD_DB_ERROR' && dbToUse !== 'defaultdb') {
        console.warn(`[MySQL] Database "${dbToUse}" not found. Trying fallback to "defaultdb"...`);
        dbToUse = 'defaultdb';
        pool = mysql.createPool({
          host: DB_HOST,
          user: DB_USER,
          password: DB_PASS,
          database: dbToUse,
          port: DB_PORT,
          ssl: sslConfig,
          waitForConnections: true,
          connectionLimit: 10,
          queueLimit: 0,
          connectTimeout: 10000
        });
        await pool.query('SELECT 1');
      } else {
        throw dbErr;
      }
    }

    // Initialize tables if needed
    await initDB(pool);
    console.log(`[MySQL] Connected successfully to database "${dbToUse}"`);
    return pool;
  } catch (error) {
    console.error(`[MySQL] Connection failed: ${error.message}`);
    pool = null;
    throw error;
  }
}

async function initDB(dbPool) {
  // Users table
  await dbPool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(150) NOT NULL UNIQUE,
      phone VARCHAR(20) UNIQUE DEFAULT NULL,
      password VARCHAR(255) NOT NULL,
      avatar VARCHAR(255) DEFAULT '⚡',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // Migrate existing users table to add phone column if missing
  try {
    const [cols] = await dbPool.query(`SHOW COLUMNS FROM users LIKE 'phone'`);
    if (cols.length === 0) {
      await dbPool.query(`ALTER TABLE users ADD COLUMN phone VARCHAR(20) UNIQUE DEFAULT NULL AFTER email`);
    }
  } catch (err) {
    console.log('[MySQL] Migration note:', err.message);
  }

  // Categories table
  await dbPool.query(`
    CREATE TABLE IF NOT EXISTS categories (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT DEFAULT NULL,
      name VARCHAR(100) NOT NULL,
      color VARCHAR(30) DEFAULT '#6366f1',
      icon VARCHAR(50) DEFAULT 'folder',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // Tasks table
  await dbPool.query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT DEFAULT NULL,
      category_id INT DEFAULT NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT DEFAULT NULL,
      status ENUM('todo', 'in_progress', 'review', 'completed') DEFAULT 'todo',
      priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
      due_date DATETIME DEFAULT NULL,
      is_starred TINYINT(1) DEFAULT 0,
      is_pinned TINYINT(1) DEFAULT 0,
      estimated_minutes INT DEFAULT 30,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // Subtasks table
  await dbPool.query(`
    CREATE TABLE IF NOT EXISTS subtasks (
      id INT AUTO_INCREMENT PRIMARY KEY,
      task_id INT NOT NULL,
      title VARCHAR(255) NOT NULL,
      completed TINYINT(1) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // Seed default categories if table is empty
  const [categories] = await dbPool.query('SELECT COUNT(*) as count FROM categories');
  if (categories[0].count === 0) {
    await dbPool.query(`
      INSERT INTO categories (name, color, icon) VALUES
      ('Work & Career', '#6366f1', 'briefcase'),
      ('Personal Life', '#ec4899', 'heart'),
      ('Tech & Projects', '#10b981', 'code'),
      ('Health & Fitness', '#f59e0b', 'activity')
    `);
  }
}
