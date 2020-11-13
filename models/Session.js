require("dotenv").config();
const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema(
  {
    ip: { type: String },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "Users" },
    sid: { type: String },
  },
  { timestamps: true }
);

// Delete session after 24 hours
sessionSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

const Sid = mongoose.model("Sids", sessionSchema);
exports.Sid = Sid;
