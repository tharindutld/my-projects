const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const connectDB = require('./Database/connect');

const register = require('./routes/register.route');
const login = require('./routes/login.route');
const postmessagesroute = require('./routes/postmessages.route');
const bookingusroute = require('./routes/bookingus.route');

require('dotenv').config();
connectDB(process.env.MONGODB_URL);

const app = express();
const PORT = 5000;

app.use(cors());
app.use(bodyParser.json());


//Routes
app.use('/register', register);
app.use('/login', login);
app.use('/post-messages-jwt', postmessagesroute );
app.use('/bookings-jwt', bookingusroute );

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});