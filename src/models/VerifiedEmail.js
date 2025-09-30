const mongoose = require('mongoose');

const verifiedEmailSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, index: true },
}, { timestamps: true });

module.exports = mongoose.model('VerifiedEmail', verifiedEmailSchema, 'verified_emails');


