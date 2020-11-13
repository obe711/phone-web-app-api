require("dotenv").config();
const jwt = require("jsonwebtoken");
const { Sid } = require("../models/Session");
const { User } = require("../models/User");
const { unAuthorize } = require("../helpers/errors");

module.exports = async function (req, res, next) {
  const token = req.cookies.token;
  const sid = req.cookies.sid;

  // Verify token & sid exist in request
  if (!token) unAuthorize(res, "Access Denied. No token provided.");
  if (!sid) unAuthorize(res, "Access Denied. No sid provided.");

  try {
    // Verify user session exists from request sid
    const userSession = await Sid.findById(sid);
    if (!userSession) unAuthorize(res, "Invalid Session");

    // Verify token with sid
    const decodedToken = jwt.verify(token, process.env.SECRET_KEY);
    if (decodedToken._id != userSession.user)
      return unAuthorize(res, "Invalid Session - Non matching sid");

    // Verify ip for session
    if (userSession.ip != req.ip)
      return unAuthorize(res, "Invalid Session - Incorrect IP");

    // Verify User exists
    const user = await User.findById(decodedToken._id).select({
      isAdmin: 1,
      status: 1,
      _id: 1,
      level: 1,
      name: 1,
    });
    if (!user) unAuthorize(res, "Invalid Session - No User");

    // Verify User is not suspended
    if (user.status === "Suspended")
      return unAuthorize(res, "Invalid Session - Suspended User");

    // CHECK token isAdmin matches DB isAdmin
    if (decodedToken.isAdmin != user.isAdmin)
      return unAuthorize(res, "Invalid Session - Not Admin");

    // Authorize admin role on user token cookie
    if (user.isAdmin) decodedToken.isAdmin = true;
    else user.isAdmin = false;

    // Update user token cookie
    const updatedToken = user.generateAuthToken();
    res.cookie("token", updatedToken, {
      httpOnly: true,
    });

    // Set user
    req.user = user;
    next();
  } catch (ex) {
    unAuthorize(res, "Invalid token.");
  }
};
