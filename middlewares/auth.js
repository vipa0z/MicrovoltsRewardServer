const jwt = require('jsonwebtoken');

function authUser(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing or invalid token' });
  }

  const token = authHeader.split(' ')[1];
  try {
    
    const decoded = jwt.verify(token, process.env.USER_JWT_SECRET);

    req.user = decoded;
    return next();
  } catch (err) {
    // if user token validation fails, try validating against  admin jwt
    try {
      const decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET);
      req.user = decoded;
      return next();
    } catch (err) {

      return res.status(403).json({ message: 'Invalid or expired token' });
    }
  }

}
function authAdmin(req, res, next) {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Missing or invalid token' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET);

        if (decoded.grade >= Number(process.env.MINIMUM_GRADE_TO_CONFIGURE)) {
            req.user = decoded;
            next();
        } else {
            res.status(403).send('Forbidden: Insufficient privileges');
        }
    } catch (err) {
        const env = process.env.ENVIRONMENT || process.env.NODE_ENV || 'development';
        const brief = err && err.name ? `${err.name}: ${err.message}` : 'Token verification failed';
        
        if (env !== 'production') {
          console.warn('[authAdmin]', brief);
        } else {
          console.warn('[authAdmin] Invalid admin token');
        }
        return res.status(403).json({ message: 'Forbidden: Insufficient privileges' });
    }
}

module.exports = { authUser, authAdmin };
