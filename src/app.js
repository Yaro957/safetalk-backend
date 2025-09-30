const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const callRoutes = require('./routes/calls');
const mlRoutes = require('./routes/ml');
const { notFoundHandler, errorHandler } = require('./middleware/error');

const app = express();

app.use(cors());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
// Removed static serving of uploads since file uploads are not used

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/calls', callRoutes);
app.use('/api/ml', mlRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;


