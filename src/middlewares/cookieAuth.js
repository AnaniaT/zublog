const jwt = require('jsonwebtoken');
const User = require('../models/user');

// FOR ASSUREANCE YOU COULD EMBED THE IP ADDRESS IN THE TOKEN THEN CHECK IF THE
// TOKEN WAS USED FROM ANOTHER COMPUTER WHICH WAS NOT USED TO LOGIN IN FIRST PLACE
const cookieAuth = async (req, res, next) => {
  try {
    const token = req.cookies._Oth;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({
      _id: decoded._id,
      'tokens.token': token,
    });
    if (!user) {
      throw new Error('Not Authorized');
    }

    req.user = user;
    req.token = token;
    next();
  } catch (e) {
    res.status(401).redirect('/');
  }
};

module.exports = cookieAuth;
