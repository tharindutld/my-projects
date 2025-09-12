const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Define the user schema
const UserSchema = new mongoose.Schema({
    fullname: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        match: /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/
    },
    phone: {
    type: String,
    required: true,
    match: /^[0-9]{10}$/ // Allows only 10-digit phone numbers
   },

    password: {
        type: String,
        required: true,
        minlength: 8,
        maxlength: 128
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual field for confirm password (used temporarily, not stored)
UserSchema.virtual('confirmPassword')
    .get(function () {
        return this._confirmPassword;
    })
    .set(function (value) {
        this._confirmPassword = value;
    });

// Pre-save hook to hash the password and validate confirm password
UserSchema.pre('save', async function (next) {
    // Only hash the password if it has been modified (or is new)
    if (this.isModified('password')) {
        if (this.password !== this._confirmPassword) {
            return next(new Error('Passwords do not match'));
        }
        const saltRounds = 10;
        this.password = await bcrypt.hash(this.password, saltRounds);
    }
    next();
});

// Create the user model
const User = mongoose.model('User', UserSchema);

module.exports = User;
