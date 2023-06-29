const mongoose = require("mongoose");
const collectionName = require("../config/collections");

const wishlistSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  productId: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'product',
    required: true
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Wishlist = mongoose.model(collectionName.WISHLIST_COLLECTION, wishlistSchema);

module.exports = Wishlist;
