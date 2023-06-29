const mongoose = require("mongoose");
const collectionName = require("../config/collections");

const orderDetialsSechema = new mongoose.Schema(
  {
    deliveryAddress: {
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
    user_Id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    payment_method: {
      type: String,
      required: true,
    },
    products: {
      type: Array,
      required: true,
    },
    discountAmount: {
      type: Number,
      default: null,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    order_status: [
      {
        status: {
          type: String,
          required: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        additionalInfo: {
          type: String,
          default: null,
        },
      },
    ],
    payment_status: {
      type: String,
      required: true,
    },
    deliveryDate:{
      type:Date
    }
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "modified_at" },
  }
);

const orderDetialsModel = mongoose.model(
  collectionName.ORDER_COLLECTION,
  orderDetialsSechema
);

module.exports = orderDetialsModel;
