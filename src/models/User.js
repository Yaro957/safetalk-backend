const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const logger = require('../utils/logger'); // centralized logger

const userSchema = new mongoose.Schema({
  name: { type: String, trim: true },
  username: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true, 
    trim: true, 
    index: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true, 
    index: true, 
    match: /.+\@.+\..+/ 
  },
  passwordHash: { type: String, required: true },
  isEmailVerified: { type: Boolean, default: false },
}, { timestamps: true });

// Password hashing middleware
userSchema.pre('save', async function(next) {
  if (this.isModified('passwordHash')) {
    const salt = await bcrypt.genSalt(10);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
  }
  next();
});

// Verify password method
userSchema.methods.verifyPassword = async function(passwordPlain) {
  const result = await bcrypt.compare(passwordPlain, this.passwordHash);
  logger.info(`Password verification for user: ${this.email} - ${result ? 'SUCCESS' : 'FAIL'}`);
  return result;
};

// Static hashPassword method (optional)
userSchema.statics.hashPassword = async function(passwordPlain) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(passwordPlain, salt);
};

// Log user creation
userSchema.post('save', function(doc) {
  logger.info(`User created: ${doc.email}`);
});

module.exports = mongoose.model('User', userSchema);
