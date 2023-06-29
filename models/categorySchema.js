const mongoose = require("mongoose");
const categorySchema = new mongoose.Schema(
  {
    category_name: {
      type: String,
      required: true,
    },
    thumbnail: {
      type: String, 
      required: true,
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
const Category = mongoose.model("Category", categorySchema);

module.exports = Category;
