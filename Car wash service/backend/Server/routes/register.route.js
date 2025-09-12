const express = require('express');
const User = require('../Database/models/user');
const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { fullname, email, phone, password, confirmPassword } = req.body;

    const user = new User({ fullname, email, phone, password });
    user.confirmPassword = confirmPassword;

    await user.save();

    // Remove sensitive info before sending response
    const userToReturn = user.toObject();
    delete userToReturn.password;

    res.status(201).json({
      status: 'success',
      data: { user: userToReturn }
    });
  } catch (err) {
    let errorMessage;

    if (err.code === 11000) {
      errorMessage = 'Email already exists';
    } else if (err.name === 'ValidationError') {
      errorMessage = Object.values(err.errors).map(val => val.message).join(', ');
    } else {
      errorMessage = err.message;
    }

    res.status(400).json({
      status: 'failed',
      message: errorMessage
    });
  }
});

module.exports = router;
