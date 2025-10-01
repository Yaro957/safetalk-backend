const mongoose = require('mongoose');
const logger = require('../utils/logger'); // optional centralized logger

const otpSchema = new mongoose.Schema({
  email: { 
    type: String, 
    required: true, 
    lowercase: true, 
    index: true, 
    match: /.+\@.+\..+/ // email format validation
  },
  otp: { 
    type: String, 
    required: true, 
    minlength: 6, 
    maxlength: 6 
  },
  expiresAt: { type: Date, required: true },
}, { timestamps: true });

// TTL index to auto-remove expired OTPs
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Middleware to log OTP creation
otpSchema.post('save', function(doc) {
  logger.info(`OTP created for email: ${doc.email}`);
});

module.exports = mongoose.model('Otp', otpSchema, 'otps');
