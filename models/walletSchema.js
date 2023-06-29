const mongoose = require('mongoose');
const collectionName = require("../config/collections");

const walletSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  balance: {
    type: Number,
    default: 0
  },
  transactions: [{
   amount:{
    type:Number,
    required:true,
   },
   type: {
    type: String,
    enum: ['debit', 'credit'],
    required: true
  },
   date:{type:Date,required:true}

  }]
},{
    timestamps: { createdAt: "created_at", updatedAt: "modified_at" },
}
);

const Wallet = mongoose.model(collectionName.WALLET_COLLECTION, walletSchema);

module.exports = Wallet;
