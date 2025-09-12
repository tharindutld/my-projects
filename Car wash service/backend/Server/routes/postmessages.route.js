const express = require('express');
const Message = require('../Database/models/messages');
// const { authenticate } = require('../Middleware/auth'); 

const router = express.Router();
// router.post('/', async (req, res) => {  

router.post('/', async (req, res) => {  
    try {
        console.log("messageContent");
        const messageContent = {
            message: req.body.message,
            name: req.body.name,
            email: req.body.email,
            // userId: req.user._id  
        };
        
        const message = new Message(messageContent);
       // const message = new Message(req.body);
        await message.save();
        res.status(200).json({
            status: 'success',
            data: {
                message
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
