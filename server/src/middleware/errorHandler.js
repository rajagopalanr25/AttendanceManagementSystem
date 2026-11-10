const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  console.error('Server Error:', err);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = `Resource not found with id ${err.value}`;
    return res.status(404).json({ success: false, message });
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const fields = Object.keys(err.keyValue || {}).join(', ');
    const message = `Duplicate field value entered for [${fields}]. Already exists.`;
    return res.status(400).json({ success: false, message });
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map((val) => val.message);
    return res.status(400).json({ success: false, message: message.join(', ') });
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Internal Server Error'
  });
};

module.exports = errorHandler;

