const mongoose = require("mongoose");
const collectionName = require("../config/collections");

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    userName: {
      type: String,
      required: true,
    },
    phoneNumber: {
      type: Number,
      required: true,
    },
    profilePhoto: {
      type: String,
      required: false,
    },
    password: {
      type: String,
      required: true,
    },
    blocked: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "modified_at" },
  }
);
const user_schema = mongoose.model(collectionName.USER_COLLECTIONS, UserSchema);

module.exports = user_schema;
