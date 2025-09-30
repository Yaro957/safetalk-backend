const express = require('express');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.post('/predict', authenticate, async (req, res) => {
  const { transcript } = req.body || {};
  if (typeof transcript !== 'string' || transcript.trim().length === 0) {
    return res.status(400).json({ message: 'transcript (string) is required' });
  }
  return res.json({ prediction: 'pending' });
});

module.exports = router;


