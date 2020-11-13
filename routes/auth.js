const { User } = require("../models/User");
const { Sid } = require("../models/Session");
const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const Joi = require("joi");
const auth = require("../middleware/auth");
const { unAuthorize } = require("../helpers/errors");

// LOGIN
router.post("/", async (req, res) => {
  // Error - Validation
  const { error } = validate(req.body);
  if (error) unAuthorize(res, error.details[0].message);

  // Error - No User Found
  let user = await User.findOne({ email: req.body.email });
  if (!user) unAuthorize(res, "Invalid email or password");

  // Error - Invalid Password
  const validPassword = await bcrypt.compare(req.body.password, user.password);
  if (!validPassword) unAuthorize(res, "Invalid email or password");

  // Remove current login sessions
  let userLoggedIn = await Sid.findOne({ user: user._id });
  if (userLoggedIn) await userLoggedIn.remove();

  // Create User Token
  const token = user.generateAuthToken();
  res.cookie("token", token, {
    httpOnly: true,
  });

  // Create User Session for 24 hours
  const sid = await new Sid({
    ip: req.ip,
    user: user._id,
  }).save();

  // Set Session cookie
  res.cookie("sid", sid._id, {
    expires: new Date(Date.now() + 3600 * 24 * 1000),
    httpOnly: true,
  });

  res.send("Authorized");
});

// CHANGE PASSWORD
router.put("/", auth, async (req, res) => {
  // Non matching new passwords
  if (req.body.password !== req.body.repeatPassword)
    return res.status(403).send("Passwords do not match");

  // Error - Validation
  const { error } = validatePassword({ password: req.body.password });
  if (error) return res.status(403).send(error.details[0].message);

  // Find User
  let user = await User.findById(req.user._id);
  if (!user) unAuthorize(res, "Invalid User");

  // Save new password
  user.password = req.body.password;
  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(user.password, salt);
  await user.save();

  res.send("Password has been changed");
});

function validatePassword(req) {
  const schema = Joi.object({
    password: Joi.string().min(5).max(255).required(),
  });
  return schema.validate(req);
}

function validate(req) {
  const schema = Joi.object({
    email: Joi.string().min(5).max(255).required().email(),
    password: Joi.string().min(5).max(255).required(),
  });
  return schema.validate(req);
}

module.exports = router;
