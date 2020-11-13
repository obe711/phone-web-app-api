const express = require("express");
const router = express.Router();
const { User } = require("../models/User");
const Joi = require("joi");

// GET USER PROFILE - Returns Profile
router.get("/", async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select({
      name: 1,
      last: 1,
      email: 1,
      status: 1,
      created_on: 1,
      updated_on: 1,
      _id: 0,
    });

    // Return user profile
    res.json(user);

    // Error - Server
  } catch (ex) {
    return res.status(500).send("Connection Error");
  }
});

// EDIT USER PROFILE - Returns Updated Profile
router.put("/", async (req, res) => {
  try {
    // Error - Validation
    const { error } = validate(req.body);
    if (error) return res.status(403).send(error.details[0].message);

    // Find and update user
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        name: req.body.name,
        last: req.body.last,
        email: req.body.email,
      },
      { new: true }
    );

    // Create new User token cookie
    const token = user.generateAuthToken();
    res.cookie("token", token, {
      httpOnly: true,
    });

    // Return updated user profile
    const { name, last, email, status, created_on, updated_on } = user;
    res.json({ name, last, email, status, created_on, updated_on });

    // Error - Server
  } catch (ex) {
    return res.status(500).send("Connection Error");
  }
});

function validate(req) {
  const schema = Joi.object({
    name: Joi.string().min(3).max(50).required(),
    last: Joi.string().min(2).max(50).required(),
    email: Joi.string().min(5).max(255).required().email(),
  });
  return schema.validate(req);
}

module.exports = router;
