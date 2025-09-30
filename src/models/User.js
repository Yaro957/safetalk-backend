const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, trim: true },
  username: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  email: { type: String, required: true, unique: true, lowercase: true, index: true },
  passwordHash: { type: String, required: true },
  isEmailVerified: { type: Boolean, default: false },
}, { timestamps: true });

userSchema.methods.verifyPassword = async function(passwordPlain) {
  return bcrypt.compare(passwordPlain, this.passwordHash);
};

userSchema.statics.hashPassword = async function(passwordPlain) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(passwordPlain, salt);
};

module.exports = mongoose.model('User', userSchema);


