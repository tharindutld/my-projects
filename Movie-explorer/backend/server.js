const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('./db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Token verification middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required.' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token.' });
    }
    req.user = user;
    next();
  });
};

// --------------------------------------------------------
// Auth Routes
// --------------------------------------------------------

// Register Customer
app.post('/api/auth/register', async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'All fields (username, email, password) are required.' });
  }

  try {
    // Check if user already exists
    const [existingUsers] = await pool.query(
      'SELECT id FROM users WHERE email = ? OR username = ?',
      [email, username]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'Username or email already exists.' });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert user into DB
    const [result] = await pool.query(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      [username, email, hashedPassword]
    );

    const userId = result.insertId;

    // Create JWT Token
    const token = jwt.sign(
      { id: userId, username, email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Registration successful!',
      token,
      user: { id: userId, username, email }
    });
  } catch (err) {
    console.error('Error in registration: ', err);
    res.status(500).json({ error: 'Server error. Please try again later.' });
  }
});

// Login Customer
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    // Find user
    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    const user = users[0];

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    // Create JWT Token
    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful!',
      token,
      user: { id: user.id, username: user.username, email: user.email }
    });
  } catch (err) {
    console.error('Error in login: ', err);
    res.status(500).json({ error: 'Server error. Please try again later.' });
  }
});

// Verify Current Token & Get User Details
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const [users] = await pool.query('SELECT id, username, email, created_at FROM users WHERE id = ?', [req.user.id]);
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }
    res.json({ user: users[0] });
  } catch (err) {
    console.error('Error checking user: ', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// --------------------------------------------------------
// Watchlist Routes (Protected)
// --------------------------------------------------------

// Get user watchlist
app.get('/api/watchlist', authenticateToken, async (req, res) => {
  try {
    const [watchlist] = await pool.query(
      'SELECT id, movie_id, title, poster_path, release_date, vote_average FROM watchlist WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(watchlist);
  } catch (err) {
    console.error('Error fetching watchlist: ', err);
    res.status(500).json({ error: 'Failed to fetch watchlist.' });
  }
});

// Add movie to watchlist
app.post('/api/watchlist', authenticateToken, async (req, res) => {
  const { movie_id, title, poster_path, release_date, vote_average } = req.body;

  if (!movie_id || !title) {
    return res.status(400).json({ error: 'Movie ID and title are required.' });
  }

  try {
    // Insert and ignore duplicate
    await pool.query(
      'INSERT INTO watchlist (user_id, movie_id, title, poster_path, release_date, vote_average) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE title = VALUES(title)',
      [req.user.id, movie_id, title, poster_path, release_date, vote_average]
    );
    res.status(201).json({ message: 'Movie added to watchlist.', movie: { movie_id, title } });
  } catch (err) {
    console.error('Error adding to watchlist: ', err);
    res.status(500).json({ error: 'Failed to add movie to watchlist.' });
  }
});

// Remove movie from watchlist
app.delete('/api/watchlist/:movie_id', authenticateToken, async (req, res) => {
  const { movie_id } = req.params;

  try {
    const [result] = await pool.query(
      'DELETE FROM watchlist WHERE user_id = ? AND movie_id = ?',
      [req.user.id, movie_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Movie not found in watchlist.' });
    }

    res.json({ message: 'Movie removed from watchlist.' });
  } catch (err) {
    console.error('Error removing from watchlist: ', err);
    res.status(500).json({ error: 'Failed to remove movie from watchlist.' });
  }
});

// --------------------------------------------------------
// Movie Reviews Routes
// --------------------------------------------------------

// Get reviews for a specific movie (Public)
app.get('/api/reviews/:movie_id', async (req, res) => {
  const { movie_id } = req.params;

  try {
    const [reviews] = await pool.query(
      'SELECT id, username, rating, review_text, created_at FROM reviews WHERE movie_id = ? ORDER BY created_at DESC',
      [movie_id]
    );
    res.json(reviews);
  } catch (err) {
    console.error('Error fetching reviews: ', err);
    res.status(500).json({ error: 'Failed to fetch reviews.' });
  }
});

// Add review to a movie (Protected)
app.post('/api/reviews', authenticateToken, async (req, res) => {
  const { movie_id, rating, review_text } = req.body;

  if (!movie_id || !rating || !review_text) {
    return res.status(400).json({ error: 'All fields (movie_id, rating, review_text) are required.' });
  }

  const ratingNum = parseInt(rating);
  if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 10) {
    return res.status(400).json({ error: 'Rating must be a number between 1 and 10.' });
  }

  try {
    await pool.query(
      'INSERT INTO reviews (user_id, username, movie_id, rating, review_text) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, req.user.username, movie_id, ratingNum, review_text]
    );

    res.status(201).json({
      message: 'Review posted successfully!',
      review: {
        username: req.user.username,
        rating: ratingNum,
        review_text,
        created_at: new Date()
      }
    });
  } catch (err) {
    console.error('Error posting review: ', err);
    res.status(500).json({ error: 'Failed to post review.' });
  }
});

// Root check
app.get('/', (req, res) => {
  res.send('Movie Explorer API is running...');
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
