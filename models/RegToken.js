require("dotenv").config();
const mongoose = require("mongoose");

const registrationSchema = new mongoose.Schema(
  {
    ip: { type: String },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "Users" },
    regToken: { type: String },
  },
  { timestamps: true }
);

// Delete reg token after 30 minute
registrationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 1800 });

const RegToken = mongoose.model("RegTokens", registrationSchema);
exports.RegToken = RegToken;
