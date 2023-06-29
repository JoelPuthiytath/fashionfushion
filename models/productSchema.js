const mongoose = require("mongoose");
const collectionName = require("../config/collections");

const ProductSchemaModel = new mongoose.Schema(
  {
    product_name: {
      type: String,
      required: true,
    },
    product_brand: {
      type: String,
      required: true,
    },
    product_description: {
      type: String,
      required: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    product_price: {
      type: Number,
      required: true,
    },
    deal_price: {
      type: Number,
    },
    in_stock: {
      type: Number,
      required: true,
    },
    product_image: [
      {
        type: String,
        required: true,
      },
    ],
    cover_photo: {
      type: String,
      default: null,
    },
    deleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "modified_at" },
  }
);
ProductSchemaModel.index({ product_name: "text" });
const productSchmea = mongoose.model(
  collectionName.PRODUCT_COLLECTIONS,
  ProductSchemaModel
);
module.exports = productSchmea;
