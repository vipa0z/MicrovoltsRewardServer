// This just exports the middleware function
module.exports = (err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
      console.error("Malformed JSON:", err.message);
  
      return res.status(400).json({
        error: "Malformed JSON in request body",
        message: err.message
      });
    }
  
    // Handle other errors
    const env = process.env.ENVIRONMENT || process.env.NODE_ENV || 'development';
    const brief = err && err.message ? err.message : String(err);
    if (env !== 'production') {
      console.error('Unhandled error:', brief);
    } else {
      console.error('Unhandled error');
    }
    res.status(500).json({ error: "Internal server error" });
  };