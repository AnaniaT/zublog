const jwt = require('jsonwebtoken');
const User = require('../models/user');

const autoLogger = async (req, res, next) => {
  try {
    const token = req.cookies._Oth;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({
      _id: decoded._id,
      'tokens.token': token,
    });
    if (!user) {
      throw new Error();
    }
    res.redirect('/home');
  } catch {
    next();
  }
};

module.exports = autoLogger;
