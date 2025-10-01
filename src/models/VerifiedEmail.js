const mongoose = require('mongoose');
const logger = require('../utils/logger'); // centralized logger

const verifiedEmailSchema = new mongoose.Schema({
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true, 
    index: true,
    match: /.+\@.+\..+/ 
  },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: false // optional, if you want to link
  }
}, { timestamps: true });

// Log verified email creation
verifiedEmailSchema.post('save', function(doc) {
  logger.info(`Verified email added: ${doc.email}`);
});

module.exports = mongoose.model('VerifiedEmail', verifiedEmailSchema, 'verified_emails');
