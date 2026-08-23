const express = require('express');
const router = express.Router();

router.post('/', async (req, res) => {
  const { name, email, subject, message } = req.body;

  // Validation
  if (!name || !email || !subject || !message) {
    return res.status(400).json({ message: 'All fields are required. Please fill in all fields.' });
  }

  if (!/^[a-zA-Z\s]+$/.test(name)) {
    return res.status(400).json({ message: 'Your name can only contain letters and spaces (no numbers or special characters).' });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ message: 'Please enter a valid email address.' });
  }

  if (subject.length <= 3) {
    return res.status(400).json({ message: 'Subject must be greater than 3 characters.' });
  }

  if (message.length <= 5) {
    return res.status(400).json({ message: 'Message must be greater than 5 characters.' });
  }

  // Simulation of SMTP send
  try {
    return res.status(200).json({
      message: `Thank you, ${name}! Your message has been sent successfully (Dev Simulation Mode: SMTP is currently disabled).`
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Failed to process inquiry.' });
  }
});

module.exports = router;
