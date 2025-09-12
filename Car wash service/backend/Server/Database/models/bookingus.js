const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  vehicleType: {
    type: String,
    required: true
  },
  washPackage: {
    type: String
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });



const BookingMessage = mongoose.model('BookingMessage', BookingSchema);

module.exports = BookingMessage;
