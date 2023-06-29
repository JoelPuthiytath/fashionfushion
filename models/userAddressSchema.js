const mongoose = require("mongoose");
const collectionName = require("../config/collections");

const userAddressSchema = new mongoose.Schema(
  {
    user_Id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    address: [
      {
        name: {
          type: String,
          required: true,
        },
        email: {
          type: String,
          required: true,
        },
        phoneNumber: {
          type: Number,
          required: true,
        },
        state: {
          type: String,
          required: true,
        },
        street_address: {
          type: String,
          required: true,
        },
        town: {
          type: String,
          required: true,
        },
      },
    ],
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "modified_at" },
  }
);
const UserAddress = mongoose.model(
  collectionName.USER_ADDRESS,
  userAddressSchema
);

module.exports = UserAddress;
