require("dotenv").config();
const mongoose = require("mongoose");
const Joi = require("joi");
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      minlength: 3,
      maxlength: 50,
    },
    last: {
      type: String,
      required: true,
      minlength: 2,
      maxlength: 50,
    },
    level: {
      type: String,
      minlength: 4,
      maxlength: 50,
      default: "User",
    },
    email: {
      type: String,
      minlength: 5,
      maxlength: 255,
      unique: true,
    },
    password: {
      type: String,
      minlength: 5,
      maxlength: 1024,
    },
    isAdmin: { type: Boolean, default: false },
    created_on: { type: Date, default: Date.now },
    updated_on: { type: Date, default: Date.now },
    status: { type: String, default: "Pending" },
  },
  { timestamps: { createdAt: "created_on", updatedAt: "updated_on" } }
);

userSchema.methods.generateAuthToken = function () {
  const token = jwt.sign(
    {
      _id: this._id,
      name: this.name,
      last: this.last,
      email: this.email,
      level: this.level,
      isAdmin: this.isAdmin,
    },
    process.env.SECRET_KEY
  );
  return token;
};

const User = mongoose.model("Users", userSchema);

function validateUser(user) {
  const schema = Joi.object({
    name: Joi.string().min(3).max(50).required(),
    last: Joi.string().min(2).max(50),
    level: Joi.string().min(4).max(50),
    status: Joi.string().min(3).max(15),
    email: Joi.string().min(5).max(255).required().email(),
    password: Joi.string().min(5).max(255).required(),
    isAdmin: Joi.boolean(),
  });
  return schema.validate(user);
}

function validateRegistration(user) {
  const schema = Joi.object({
    name: Joi.string().min(3).max(50).required(),
    last: Joi.string().min(2).max(50),
    email: Joi.string().min(5).max(255).required().email(),
  });
  return schema.validate(user);
}
exports.User = User;
exports.validate = validateRegistration;
