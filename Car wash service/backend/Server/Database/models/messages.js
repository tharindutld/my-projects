const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
    message: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    }
    // userId: {
    //     type: mongoose.Schema.Types.ObjectId,  // It will be a reference to the User model
    //     ref: 'User',  // Assuming you have a User model
    //     required: true
    // }
});

const UserMessage = mongoose.model('UserMessage', MessageSchema);

module.exports = UserMessage;
