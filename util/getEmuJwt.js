const jwt = require('jsonwebtoken');

let cachedToken = null;
let cachedTokenExpiry = 0;

function getEmuToken() {
  const now = Math.floor(Date.now() / 1000);

  if (!cachedToken || now >= cachedTokenExpiry) {
    const payload = {
      role: 4,       // required for /sendreward
      iat: now,
      exp: now + 3600 // 1 hour validity
    };
    
    cachedToken = jwt.sign(payload, process.env.EMU_JWT_SECRET, { algorithm: 'HS256' });
    cachedTokenExpiry = now + 3600;
  }
  return cachedToken;
}

module.exports = { getEmuToken };
