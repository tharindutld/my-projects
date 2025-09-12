const express = require('express');
const Booking = require('../Database/models/bookingus');
const { authenticate } = require('../Middleware/auth'); 

const router = express.Router();

router.post('/', authenticate, async (req, res) => {  
    try {
        console.log("BookingContent");

        const BookingContent = {
            name: req.body.name,
            phone: req.body.phone,
            date: req.body.date,
            time: req.body.time,
            vehicleType: req.body.vehicleType,
            washPackage: req.body.washPackage,
            userId: req.user._id  
        };
        
        const booking = new Booking(BookingContent);
        const savedBooking = await booking.save();

        res.status(200).json({
            status: 'success',
            data: {
                booking: savedBooking
            }
        });
    } catch (err) {
        res.status(500).json({
            status: 'Failed',
            message: err.message 
        });
    }
});

module.exports = router;
