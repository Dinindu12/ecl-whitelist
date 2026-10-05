const jwt = require('jsonwebtoken');

function checkAuth(req) {
  const auth = req.headers.authorization || '';
  const token = auth.replace('Bearer ', '');
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.admin === true;
  } catch (e) {
    return false;
  }
}

module.exports = { checkAuth };