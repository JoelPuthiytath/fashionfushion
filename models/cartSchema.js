const mongoose = require("mongoose");
const collectionName = require("../config/collections");

const cartItemSchema = new mongoose.Schema(
  {
    user_Id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    products: [
      {
        item: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "product",
          required: true,
        },
        product_name: {
          type: String,
          required: true,
        },
        deal_price: {
          type: Number,
          required: true,
        },
        cover_photo: {
          type: String,
          required: true,
        },
        order_status: {
          type: String,
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
        },
      },
    ],
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "modified_at" },
  }
);
const cart_collection = mongoose.model(
  collectionName.CART_COLLECTIONS,
  cartItemSchema
);

module.exports = cart_collection;
