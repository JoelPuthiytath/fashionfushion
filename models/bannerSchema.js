const collectionName = require("../config/collections");
const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  image: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  link: {
    type: String,
    required: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Banner = mongoose.model(collectionName.BANNER_COLLECTION, bannerSchema);

module.exports = Banner;
