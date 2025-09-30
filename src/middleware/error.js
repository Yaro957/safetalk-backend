function notFoundHandler(req, res, next) {
  res.status(404).json({ message: 'Not found' });
}

function errorHandler(err, req, res, next) {
  console.error(err);
  const status = err.status || 500;
  const message = err.message || 'Internal server error';
  res.status(status).json({ message });
}

module.exports = { notFoundHandler, errorHandler };


