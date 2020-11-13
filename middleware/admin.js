require("dotenv").config();
const { unAuthorize } = require("../helpers/errors");

module.exports = function (req, res, next) {
  // Verify user isAdmin
  if (!req.user.isAdmin) unAuthorize(res, "Restricted");

  next();
};
