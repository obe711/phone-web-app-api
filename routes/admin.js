const express = require("express");
const router = express.Router();
const { User } = require("../models/User");
const Joi = require("joi");
const bcrypt = require("bcrypt");

router.get("/", async (req, res) => {
  res.send("ok");
});

// GET ALL USERS - Returns user list
router.get("/users", async (req, res) => {
  try {
    const users = await User.find({}).select({
      status: 1,
      name: 1,
      last: 1,
      email: 1,
      level: 1,
      created_on: 1,
      updated_on: 1,
    });

    // Error - No users found
    if (!users) return res.status(400).send("Users not found");

    // Return Users
    res.json(users);

    // Error - Server
  } catch (ex) {
    return res.status(500).send("Connection Error");
  }
});

// GET USER - Return user
router.get("/users/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select({
      status: 1,
      name: 1,
      last: 1,
      email: 1,
      level: 1,
      created_on: 1,
      updated_on: 1,
    });

    // Error - No user found
    if (!user) return res.status(400).send("User not found");

    // Return User
    res.json(user);

    // Error - Server
  } catch (ex) {
    return res.status(500).send("Connection Error");
  }
});

// EDIT USER - Return edited user
router.put("/users/:id", async (req, res) => {
  try {
    // Error - Validation
    const { error } = validateUserProfile(req.body);
    if (error) return res.status(403).send(error.details[0].message);

    // Error - Email in use
    const inUseEmail = await User.findOne({ email: req.body.email });
    if (inUseEmail) return res.status(403).send("Duplicate User Email");

    // Find and update user
    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        name: req.body.name,
        last: req.body.last,
        email: req.body.email,
        status: req.body.status,
        level: req.body.level,
        isAdmin: req.body.level === "Admin" ? true : false,
      },
      { new: true }
    );

    // Return updated user profile
    const { name, last, email, status, level, created_on, updated_on } = user;
    res.json({
      name,
      last,
      email,
      status,
      level,
      created_on,
      updated_on,
    });

    // Error - Server
  } catch (ex) {
    return res.status(400).send("User not found");
  }
});

// CREATE USER
router.post("/users", async (req, res) => {
  try {
    // Error - Validation
    const { error } = validateNewUser(req.body);
    if (error) return res.status(403).send(error.details[0].message);

    // Encrypt password
    const salt = await bcrypt.genSalt(10);
    req.body.password = await bcrypt.hash(req.body.password, salt);

    // Search if new user exists
    const newUser = await User.findOneAndUpdate(
      { email: req.body.email },
      req.body,
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.send(`User ${newUser.email} Created`);

    // Error - Server
  } catch (ex) {
    return res.status(500).send("Connection Error");
  }
});

// DELETE USER
router.delete("/users/:id", async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    res.send(`User ${user.email} deleted`);
    // Error - Server
  } catch (ex) {
    return res.status(400).send("User not found");
  }
});

function validateUserProfile(req) {
  const schema = Joi.object({
    name: Joi.string().min(3).max(50).required(),
    last: Joi.string().min(2).max(50).required(),
    email: Joi.string().min(5).max(255).required().email(),
    status: Joi.string().min(2).max(50).required(),
    level: Joi.string().min(2).max(50).required(),
  });
  return schema.validate(req);
}

function validateNewUser(req) {
  const schema = Joi.object({
    name: Joi.string().min(3).max(50).required(),
    last: Joi.string().min(2).max(50).required(),
    email: Joi.string().min(5).max(255).required().email(),
    password: Joi.string().min(5).max(255),
  });
  return schema.validate(req);
}

module.exports = router;
