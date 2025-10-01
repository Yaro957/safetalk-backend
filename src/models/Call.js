const mongoose = require('mongoose');

const callSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  caller: { type: String, required: true },
  receiver: { type: String, required: true },
  timestamp: { type: Date, required: true },
  durationSeconds: { type: Number, required: true, min: 0 },
  transcript: { type: String },
}, { timestamps: true });

// Prevent OverwriteModelError on hot reloads/serverless
module.exports = mongoose.models.Call || mongoose.model('Call', callSchema);
