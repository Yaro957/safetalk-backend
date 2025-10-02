require('dotenv').config();
require('express-async-errors');
const http = require('http');
const app = require('./app');
const { connectToDatabase } = require('./config/db');

const PORT = process.env.PORT || 4000;

(async () => {
  try {
    await connectToDatabase();
    const server = http.createServer(app);
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`Server listening on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
})();
