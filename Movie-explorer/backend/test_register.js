const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('./db');

async function test() {
  try {
    const username = 'testuser_' + Date.now();
    const email = 'testuser_' + Date.now() + '@example.com';
    const password = 'password123';
    
    console.log('Testing queries...');
    const [existingUsers] = await pool.query(
      'SELECT id FROM users WHERE email = ? OR username = ?',
      [email, username]
    );
    console.log('Existing users query successful:', existingUsers);

    console.log('Testing bcrypt...');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    console.log('Bcrypt hashing successful:', hashedPassword);

    console.log('Testing insert...');
    const [result] = await pool.query(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      [username, email, hashedPassword]
    );
    const userId = result.insertId;
    console.log('Insert user successful, id:', userId);

    console.log('Testing jwt...');
    const token = jwt.sign(
      { id: userId, username, email },
      'super_secret_movie_explorer_key_2026!',
      { expiresIn: '7d' }
    );
    console.log('JWT sign successful:', token);

    // Clean up
    await pool.query('DELETE FROM users WHERE id = ?', [userId]);
    console.log('Cleanup successful!');
    process.exit(0);
  } catch (err) {
    console.error('ERROR DETECTED:', err);
    process.exit(1);
  }
}

test();
