const { User, validate } = require("../models/User");
const { Sid } = require("../models/Session");
const { RegToken } = require("../models/RegToken");
const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");
const { verifyEmail } = require("../helpers/mailer");
const { unAuthorize } = require("../helpers/errors");
const Joi = require("joi");

// REGISTRATION & FORGOT PASSWORD - Email Verification
router.post("/", async (req, res) => {
  try {
    // Check if user exists (no user = Registration, user = Forgot Password)
    let user = await User.findOne({ email: req.body.email });

    // REGISTRATION
    if (!user) {
      // Error - Validation
      const { error } = validate(req.body);
      if (error) return res.status(403).send(error.details[0].message);

      // Set status
      req.body.status = "Pending";

      // Set level
      req.body.level = "User";
      req.body.isAdmin = false;

      // Create new User
      user = await new User(req.body).save();
    }

    // Create new Reg Token
    const regToken = uuidv4();

    // Save new Reg Token
    await new RegToken({ user: user._id, ip: req.ip, regToken }).save();

    // Send Verification Email
    await verifyEmail(user.email, user._id, regToken);

    res.send("Verification Email Sent");
  } catch (ex) {
    res.send("Verification Email Sent");
  }
});

// VERIFICATION
router.post("/:id/:regToken", async (req, res) => {
  // Error - Non matching new passwords
  if (req.body.password !== req.body.repeatPassword)
    return res.status(403).send("Passwords do not match");

  // Error - Validation
  const { error } = validatePassword({ password: req.body.password });
  if (error) return res.status(403).send(error.details[0].message);

  // Verify registration token
  const regToken = await RegToken.findOneAndDelete({
    regToken: req.params.regToken,
  });

  // Verify user matches token
  if (regToken && regToken.user == req.params.id) {
    let user = await User.findById(regToken.user);

    // Error - User not found
    if (!user) return res.status(403).send("No user");

    // Encrypt password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(req.body.password, salt);

    // Verify status
    user.status = user.status === "Pending" ? "Active" : user.status;

    // Save updated user
    await user.save();

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

    // Clear users Reg Tokens
    await RegToken.find({ user: user._id }).deleteMany();

    res.send("Authorized");
  } else unAuthorize(res, "Invalid Link");
});

function validatePassword(req) {
  const schema = Joi.object({
    password: Joi.string().min(5).max(255).required(),
  });
  return schema.validate(req);
}
module.exports = router;
