const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'movie_explorer_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test connection
pool.getConnection()
  .then(conn => {
    console.log('Successfully connected to MySQL database: ' + (process.env.DB_NAME || 'movie_explorer_db'));
    conn.release();
  })
  .catch(err => {
    console.error('MySQL database connection failed: ', err.message);
  });

module.exports = pool;
