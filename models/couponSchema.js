const mongoose = require("mongoose");
const collectionName = require("../config/collections");

const couponSchema = new mongoose.Schema(
  {
    couponCode: {
      type: String,
      required: true,
      unique: true,
    },
    discountPercentage: {
      type: Number,
      required: true,
    },
    expiryDate: {
      type: Date,
      required: true,
    },
    minimumPurchaseAmount: {
      type: Number,
      required: true,
      default: 0,
    },
    maxDiscount:{
      type:Number,
      default:0
    },
    userLimitation: {
      type: Number,
      required: true,
      default: 1,
    },
    redemptionStatus: {
      type: String,
      enum: ["Not Redeemed", "Redeemed", "Expired"],
      default: "Not Redeemed",
    },
    deleted: {
      type: Boolean,
      default: false,
    }
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "modified_at" },
  }
);

const couponData = mongoose.model(collectionName.COUPON, couponSchema);
module.exports = couponData;
