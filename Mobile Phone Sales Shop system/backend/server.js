const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded product images statically
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Test Route
app.get('/api/test', (req, res) => {
  res.json({ status: 'success', message: 'Mobile Store API is working!' });
});

// Routes Registration
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/wishlist', require('./routes/wishlist'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/repairs', require('./routes/repairs'));
app.use('/api/staff', require('./routes/staff'));
app.use('/api/pricing', require('./routes/pricing'));
app.use('/api/stock', require('./routes/stock'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/contact', require('./routes/contact'));
app.use('/api/inventory', require('./routes/inventory'));

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal Server Error' });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
