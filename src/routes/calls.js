const express = require('express');
const path = require('path');
const fs = require('fs');
// File upload removed
const { authenticate } = require('../middleware/auth');
const Call = require('../models/Call');

const router = express.Router();

// Upload directory and multer storage removed

router.post('/upload', authenticate, async (req, res) => {
  const { caller, receiver, timestamp, duration, transcript } = req.body || {};
  if (!caller || !receiver || !timestamp || typeof duration === 'undefined') {
    return res.status(400).json({ message: 'caller, receiver, timestamp, duration are required' });
  }
  const call = await Call.create({
    owner: req.user.id,
    caller,
    receiver,
    timestamp: new Date(timestamp),
    durationSeconds: Number(duration),
    transcript,
  });
  res.status(201).json({ id: call._id, message: 'Created', call });
});

router.get('/', authenticate, async (req, res) => {
  const calls = await Call.find({ owner: req.user.id }).sort({ createdAt: -1 });
  res.json({ calls });
});

router.get('/:id', authenticate, async (req, res) => {
  const call = await Call.findById(req.params.id);
  if (!call) {
    return res.status(404).json({ message: 'Call not found' });
  }
  if (call.owner.toString() !== req.user.id) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  // Return metadata only
  res.json({ call });
});

module.exports = router;


