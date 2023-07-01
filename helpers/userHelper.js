const collections = require("../config/collections");

const mongoose = require("mongoose");
const productHelper = require("./productHelper");
var express = require("express");
const { check, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
//  schemaaa models >>>>>>>>>>>
const userSchema = require("../models/userSchema");
const categorySchema = require("../models/categorySchema");
const productsSchema = require("../models/productSchema");
const cartSchema = require("../models/cartSchema");
const userAddressSchema = require("../models/userAddressSchema");
const orderSchema = require("../models/orderSchema");
const couponSchema = require("../models/couponSchema");
const walletSchema= require("../models/walletSchema")
const Inventory= require("../models/inventorySchema")
require('dotenv').config({path:"./.env"})
// <<<<<<<<<<<<<<<<<<<<<<<<<< end
const accountSide = process.env.TWILIO_ACCOUNT_SID;

// const authToken = process.env.TWILIO_AUTH_TOKEN;
// const verifySid = process.env.TWILIO_SERVICE_SSID;
const accountSid=process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const verifySid=process.env.TWILIO_SERVICE_SSID

const client = require("twilio")(accountSid, authToken);

const multer = require("multer");
const path = require("path");
const Razorpay = require("razorpay");
const Wallet = require("../models/walletSchema");
const Wishlist = require("../models/wishList");
const couponData = require("../models/couponSchema");


// const {
//   EndUserTypeContextImpl,
// } = require("twilio/lib/rest/trusthub/v1/endUserType");
// console.log(process.env.RAZOR_SECRET_KEY)
var instance = new Razorpay({
  key_id: process.env.RAZOR_KEY_ID,
  key_secret:process.env.RAZOR_SECRET_KEY,
});

// Set storage for profile images
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/profileimages");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });


const generateResultsHTML = (items) => {
  let html = '';
  items.forEach((item) => {
    html += `<div class="col-lg-3 col-md-4 col-12 col-sm-6">
              <div class="product-cart-wrap mb-30">
                  <div class="product-img-action-wrap">
                      <div class="product-img product-img-zoom">
                          <a href="/product-view?id=${item._id}">
                              <img class="default-img" src="/uploads/${item.product_image[0]}">
                              <img class="hover-img" src="/uploads/${item.product_image[1]}">
                          </a>
                      </div>
                      <div class="product-action-1">
                          <a aria-label="Add To Wishlist" class="action-btn hover-up"
                              onclick="addToWishList('${item._id}')"><i class="fi-rs-heart"></i></a>
                      </div>
                  </div>
                  <div class="product-content-wrap">
                      <h2><a href="/product-view?id=${item._id}">${item.product_name}</a></h2>
                      <div class="rating-result" title="${item.rating}%">
                          <span></span>
                      </div>
                      <div class="product-price">
                          <span>₹${item.deal_price}</span>
                          <span class="old-price">${item.product_price}</span>
                      </div>
                      <div class="product-action-1 show">
                          <button onclick="addToCart('${item._id}')" aria-label="Add To Cart"
                              class="action-btn hover-up"><i class="fi-rs-shopping-bag-add"></i></button>
                      </div>
                  </div>
              </div>
          </div>`;
  });
  return html;
};

module.exports = {
  userSignUP: async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const alert = errors.array();
      res.render("../views/user/page-login-register.hbs", { alert });
    } else {
      let { username, phoneNumber, email, password, confirmPassword } =
        req.body;

      try {
        const userExist = await userSchema.findOne({
          $or: [{ userName: email }, { phoneNumber: phoneNumber }],
        });
        // console.log(userExist);

        if (userExist) {
          req.session.message = {
            type: "error",
            message: "Already registered Email Id",
          };
          return;
        }
        console.log(password, "<= password");
        console.log(confirmPassword, "<= confirm password");

        if (password === confirmPassword) {
          bcrypt.genSalt(10, function (err, salt) {
            bcrypt.hash(password, salt, async function (err, hash) {
              if (phoneNumber) {
                try {
                  const verification = await client.verify.v2
                    .services(verifySid)
                    .verifications.create({
                      to: `+91${phoneNumber}`,
                      channel: "sms",
                    });

                  const data = {
                    name: username,
                    phoneNumber: phoneNumber,
                    userName: email,
                    password: hash,
                    verificationSid: verification.sid,
                  };
                  req.session.signUPTemp = data;
                  console.log(req.session.signUPTemp.phoneNumber);

                  res.redirect("/verification-page");
                } catch (error) {
                  console.log(error);
                  res.status(400).send({
                    message: "Error occurred while sending verification code",
                    phoneNumber: phoneNumber,
                  });
                }
              } else {
                res.status(400).send({
                  message: "Wrong phone number :(",
                  phoneNumber: phoneNumber,
                });
              }
            });
          });
        } else {
          req.session.message = {
            type: "error",
            message: "Password dosen't match",
          };
          res.redirect("/user-signup");
        }
      } catch (err) {
        console.log(err.message);
        req.session.message = {
          type: "error",
          message: "An error occurred while adding the user",
        };
        res.redirect("/user-signup");
      }
    }
  },

  otpVerification: async (req, res) => {
    try {
      let userExit = await userSchema.findOne({
        phoneNumber: req.body.phoneNumber,
      });
      if (userExit) {
        if (req.body.phoneNumber) {
          client.verify.v2
            .services(verifySid)
            .verifications.create({
              to: `+91${req.body.phoneNumber}`,
              channel: "sms",
            })
            .then((data) => {
              entry = true;
              req.session.mobile = req.body.phoneNumber;
              res.redirect("/verification-page");
            });
        } else {
          res.status(400).send({
            message: "Wrong phone number :(",
            phoneNumber: req.body.phoneNumber,
          });
        }
      } else {
        req.session.message = {
          type: "error",
          message: "Please register your account before login ",
        };
        res.redirect("/user-login");
      }
    } catch (error) {
      console.log(error);
    }
  },

  userLogin: async (req, res) => {
    if (req.session.user) {
      res.redirect("/");
      return;
    }
    const errors = validationResult(req);
    // console.log(`the error det is ${errors}`);
    if (!errors.isEmpty()) {
      const alert = errors.array();
      res.render("../views/user/page-login.hbs", { alert });
    } else {
      // const response={};
      let user = await userSchema.findOne({
        userName: req.body.email,
      });
      if (!user) {
        req.session.message = {
          type: "error",
          message: "invalid Email id or password",
        };
        res.redirect("/user-login");
        return;
      }

      const validPassword = await bcrypt.compare(
        req.body.password,
        user.password
      );
      if (!validPassword) {
        req.session.message = {
          type: "error",
          message: "Invalid Password",
        };
        res.redirect("/user-login");
        return;
      } else {
        if (user.blocked === true) {
          req.session.message = {
            type: "error",
            message: "you are restricted to visit",
          };
          res.redirect("/user-login");
          return;
        }
        req.session.user = user;
        console.log(req.session.user);
        res.redirect("/");
      }
    }
  },

  getNewArrivals:async()=>{
    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate()-7);
    
  
      const newArrivals= await productsSchema.find({
        created_at:{
          $gte:startDate
        },
      }).sort({created_at:-1}).limit(7)

      return newArrivals


    } catch (error) {
      throw error
    }

  },

  addToWishList: async (proId, userId) => {
    try {
      const productId =new mongoose.Types.ObjectId(proId);
      const wishlist = await Wishlist.findOne({ userId: userId });
  
      if (wishlist) {
        await Wishlist.updateOne({ userId: userId }, {
          $addToSet: { productId: productId }
        });
      } else {
        const data = {
          userId: userId,
          productId: [productId]
        };
        await Wishlist.create(data);
      }
    } catch (error) {
      throw error;
    }
  },
  wishListItems: (id) => {
    return new Promise(async (resolve, reject) => {
      try {
        const userId = new mongoose.Types.ObjectId(id);
        const items = await Wishlist.findOne({ userId })
          .populate('productId')
          .exec();
        resolve(items);
      } catch (error) {
        reject(error);
      }
    });
  },
  getCartCount: (userId) => {
    userId = new mongoose.Types.ObjectId(userId);
    return new Promise(async (resolve, reject) => {
      let count = 0;
      let cart = await cartSchema.findOne({
        user_Id: userId,
      });
      if (cart) {
        count = cart.products.length;
      }
      resolve(count);
    });
  },
  getProductQuantity: (details) => {
    return new Promise(async (resolve, reject) => {
      let resp = {};
      details.count = parseInt(details.count);
      details.quantity = parseInt(details.quantity);
      let proId = new mongoose.Types.ObjectId(details.product);
      let cartId = new mongoose.Types.ObjectId(details.cart);

      try {
        if (details.count == -1 && details.quantity === 1) {
          await cartSchema.updateOne(
            { _id: cartId },
            { $pull: { products: { item: proId } } }
          );
          resp.minus = true;
          resolve(resp);
        } else {
          if (details.count != -1) {
            let product = await productsSchema.findById(proId);
            if (details.quantity >= product.in_stock) {
              resp.outOfStock = true;
              resolve(resp);
            } else {
              await cartSchema.updateOne(
                { _id: cartId, "products.item": proId },
                { $inc: { "products.$.quantity": details.count } }
              );
              resp.outOfStock = false;
              resolve(resp);
            }
          } else {
            await cartSchema.updateOne(
              { _id: cartId, "products.item": proId },
              { $inc: { "products.$.quantity": details.count } }
            );
            resp.outOfStock = false;
            resolve(resp);
          }
        }
      } catch (error) {
        reject(error);
      }
    });
  },
  getCartProducts: (str) => {
    return new Promise(async (resolve, reject) => {
      try {
        const userId = new mongoose.Types.ObjectId(str);
        let cartItems = await cartSchema.aggregate([
          {
            $match: { user_Id: userId },
          },
          {
            $unwind: "$products",
          },
          {
            $project: {
              item: "$products.item",
              quantity: "$products.quantity",
            },
          },
          {
            $lookup: {
              from: "products",
              localField: "item",
              foreignField: "_id",
              as: "product",
            },
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              product: { $arrayElemAt: ["$product", 0] },
            },
          },
        ]);
        // console.log(cartItems)
        if (cartItems.length > 0) {
          resolve(cartItems);
        } else {
          resolve([]); // If no cart items found, resolve with an empty array
        }
      } catch (error) {
        reject(error);
      }
    });
  },

  getTotal: (str) => {
    return new Promise(async (resolve, reject) => {
      try {
        const userId = new mongoose.Types.ObjectId(str);
        let total = await cartSchema.aggregate([
          {
            $match: { user_Id: userId },
          },
          {
            $unwind: "$products",
          },
          {
            $project: {
              item: "$products.item",
              quantity: "$products.quantity",
            },
          },
          {
            $lookup: {
              from: "products",
              localField: "item",
              foreignField: "_id",
              as: "product",
            },
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              product: { $arrayElemAt: ["$product", 0] },
            },
          },
          {
            $group: {
              _id: null,
              total: {
                $sum: { $multiply: ["$quantity", "$product.deal_price"] },
              },
            },
          },
        ]);
        console.log(total);
        if (total.length > 0) {
          resolve(total[0].total);
        } else {
          resolve();
        }
      } catch (error) {
        reject(error);
      }
    });
  },

  getCartProductsList: (userId) => {
    return new Promise(async (resolve, reject) => {
      let cart = await cartSchema.findOne({
        user_Id: userId,
      });
      if (cart) {
        resolve(cart.products);
      }
    });
  },

  placeOrder: (order, products, total) => {
    return new Promise(async (resolve, reject) => {
      let addressId = new mongoose.Types.ObjectId(order.selectedAddress);
      let paymentStatus = order.payment_option === "COD" ? "Pending" : "Placed";
  
      let address = await userAddressSchema.findOne(
        { user_Id: order.userId, "address._id": addressId },
        { "address.$": 1 }
      );
        console.log("find the userAddresss")
      let couponCode = order.coupon;
      const couponData = await couponSchema.findOne({ couponCode: couponCode });
      let amountDiscounted = 0;
      if (couponData) {
        let discountPercentage = couponData.discountPercentage;
        let today = Date.now();
        let expiryDate = Date.parse(couponData.expiryDate); 
        if (total >= couponData.minimumPurchaseAmount && today <= expiryDate ) {
          amountDiscounted = Math.floor((total * discountPercentage) / 100);
          total -= amountDiscounted <=couponData.maxDiscount? amountDiscounted:couponData.maxDiscount;
        }
      }
      console.log("added coupon if any")
  
      let orderDetails = {
        deliveryAddress: {
          name: address.address[0].name,
          email: address.address[0].email,
          phoneNumber: address.address[0].phoneNumber,
          state: address.address[0].state,
          street_address: address.address[0].street_address,
          town: address.address[0].town,
        },
        user_Id: order.userId,
        payment_method: order.payment_option,
        products: products,
        discountAmount: amountDiscounted,
        totalAmount: total,
        order_status: [
          {
            status: "Confirmed",
            timestamp: new Date(),
          },
        ],
        payment_status: paymentStatus,
      };
  
      try {
        // Check inventory and deduct quantities
        for (let i = 0; i < products.length; i++) {
          const product = products[i];
          const inventory = await Inventory.findOne({ productId: product.item });
          console.log(inventory);
          console.log(product.quantity, "this is product quantity")
          console.log("this is inventory quantity",inventory.quantity);
          if (!inventory || inventory.quantity < product.quantity) {
            return reject(false)
          }
          inventory.quantity -= product.quantity;
          await inventory.save();
        }
        console.log("reduce the quantity form inventory")
        // Create the order
        const createdOrder = await orderSchema.create(orderDetails);
        console.log(createdOrder,"created order")
        // Delete the user's cart
        await cartSchema.deleteOne({ user_Id: order.userId });
        console.log("removed products from the cart")
  
        resolve(createdOrder);
      } catch (error) {
        reject(error);
      }
    });
  },
  removeCartProduct: (detials) => {
    return new Promise(async (resolve, reject) => {
      let proId = new mongoose.Types.ObjectId(detials.productId);
      let cartId = new mongoose.Types.ObjectId(detials.cartId);
      await cartSchema.updateOne(
        { _id: cartId },
        {
          $pull: {
            products: { item: proId },
          },
        }
      );
      resolve();
    });
  },
  removeWishlistItem:(details)=>{
    return new Promise(async(resolve,reject)=>{
      let proId = new mongoose.Types.ObjectId(details.productId)
      let wishLIstId= new mongoose.Types.ObjectId(details.wishListId)
      await Wishlist.updateOne({_id:wishLIstId},{
        $pull:{
          productId:proId
        }
      })
      resolve();
    })
  },

  getOrderDetailsForUser: (str) => {
    return new Promise(async (resolve, reject) => {
      try {
        const userId = new mongoose.Types.ObjectId(str);
        let orderInfo = await orderSchema.aggregate([
          {
            $match: { user_Id: userId },
          },
          // {
          //   $unwind: "$products",
          // },
          {
            $lookup: {
              from: "products",
              localField: "products.item",
              foreignField: "_id",
              as: "productInfo",
            },
          },
          {
            $project: {
              products: 1,
              // quantity: "$products.quantity",
              payment_method: 1,
              totalAmount: 1,
              order_status: 1,
              payment_status: 1,
              deliveryAddress: 1,
              createdAt: 1,
              productInfo: 1,
              productInfo: {
                $map: {
                  input: "$productInfo",
                  as: "p",
                  in: {
                    _id: "$$p._id",
                    product_name: "$$p.product_name",
                    images: "$$p.product_image",
                    quantity: {
                      $arrayElemAt: [
                        "$products.quantity",
                        {
                          $indexOfArray: ["$products.item", "$$p._id"],
                        },
                      ],
                    },

                    deal_price: {
                      $arrayElemAt: [
                        "$products.deal_price",
                        {
                          $indexOfArray: ["$products.item", "$$p._id"],
                        },
                      ],
                    },
                    order_status: {
                      $arrayElemAt: [
                        "$products.order_status",
                        {
                          $indexOfArray: ["$products.item", "$$p._id"],
                        },
                      ],
                    },
                  },
                },
              },
            },
          },
        ]);
        // console.log(orderInfo[0].productInfo);
        resolve(orderInfo);
        // resolve(total[0].total);
      } catch (error) {
        reject(error);
      }
    });
  },

  cancelOrder: (details,userId) => {
    // console.log(details);
    return new Promise(async (resolve, reject) => {
      try {
        let productId = new mongoose.Types.ObjectId(details.productId);
        let orderId = new mongoose.Types.ObjectId(details.orderId);
        let user_id= new mongoose.Types.ObjectId(userId);

        let price = parseInt(details.price)
        let quantity= parseInt(details.quantity);
        let totalAmount=parseInt(details.totalAmount);
        let discountAmount=parseInt(details.refundAmount)

        await orderSchema.updateOne(
          { _id: orderId, products: { $elemMatch: { item: productId } } },
          {
            $set: { "products.$.order_status": "Cancelled" },
          }
        );

        const order = await orderSchema.findOne({ _id: orderId });
        const allProductsCancelled = order.products.every((product) => {
          return product.order_status === "Cancelled";
        });
        if (allProductsCancelled) {
          await orderSchema.updateOne(
            { _id: orderId },
            {
              $push: {
                order_status: {
                  status: "Cancelled",
                  timestamp: new Date(),
                },
              },
            }
          );
          ;
        }

        const inventory = await Inventory.findOne({ productId: productId });
        if (inventory) {
          inventory.quantity += quantity;
          await inventory.save();
        }

        if (order.payment_status === "Placed") {
            let returnedAmount=0;
            if(discountAmount > 0){
              returnedAmount = Math.floor(price*quantity/totalAmount*[totalAmount-discountAmount])
            }else{
              returnedAmount= Math.floor(price*quantity)
            }

          await walletSchema.updateOne(
            { user: user_id },
            {
              $inc: { balance: returnedAmount },
              $push: {
                transactions: {
                  amount: returnedAmount,
                  type:"credit",
                  date: new Date()
                }
              }
            },{ upsert: true }
          ); 

      }
      resolve();

     } catch (error) {
        reject(error);
      }
    });
  },

  returnOrder: (details, userId) => {
    return new Promise(async (resolve, reject) => {
      try {
        let productId = new mongoose.Types.ObjectId(details.productId);
        let orderId = new mongoose.Types.ObjectId(details.orderId);
        let user_id = new mongoose.Types.ObjectId(userId);
        let price = parseInt(details.price);
        let quantity = parseInt(details.quantity);
        let totalAmount = parseInt(details.totalAmount);
        let discountAmount = parseInt(details.refundAmount);
  
        // Update product order status to "Returned"
        await orderSchema.updateOne(
          { _id: orderId, products: { $elemMatch: { item: productId } } },
          { $set: { "products.$.order_status": "Returned" } }
        );
  
        let order = await orderSchema.findById(orderId);
  
        // Check if all products in the order are returned
        const allProductsReturned = order.products.every((product) => {
          return product.order_status === "Returned";
        });
  
        if (allProductsReturned) {
          // Update overall order status to "Returned"
          await orderSchema.updateOne(
            { _id: orderId },
            {
              $push: {
                order_status: {
                  status: "Returned",
                  timestamp: new Date(),
                },
              },
            }
          );
        }
  
        const inventory = await Inventory.findOne({ productId: productId });
        if (inventory) {
          // Increase inventory quantity
          inventory.quantity += quantity;
          await inventory.save();
        }
  
        let returnedAmount = 0;
        if (discountAmount > 0) {
          returnedAmount = Math.floor((price * quantity * (totalAmount - discountAmount)) / totalAmount);
        } else {
          returnedAmount = Math.floor(price * quantity);
        }
  
        await walletSchema.updateOne(
          { user: user_id },
          {
            $inc: { balance: returnedAmount },
            $push: {
              transactions: {
                amount: returnedAmount,
                type:'credit',
                date: new Date(),
              },
            },
          },
          { upsert: true }
        );
  
        resolve();
      } catch (error) {
        console.log(error);
        reject(error);
      }
    });
  },

  changeProfilePhoto: async (req, res) => {
    try {
      let userId = req.session.user._id;
      upload.single("profilePhoto")(req, res, async (err) => {
        if (err) {
          console.log(err);
          req.session.message = {
            type: "error",
            message: "Failed to upload profile photo",
          };
          res.redirect("/profile-view");
          // return res.status(500).json({ error: 'Failed to upload profile photo' });
        }

        const filename = req.file.filename;

        await userSchema.findByIdAndUpdate(userId, {
          $set: { profilePhoto: filename },
        }).then(()=>{

        res.json({status:true});
        })
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: "Internal server error" });
    }
  },

  addshippingAddress: (req, res) => {
    return new Promise(async (resovle, reject) => {
      try {
        const userId = req.body.userId;
        const newAddress = {
          name: req.body.name,
          email: req.body.email,
          phoneNumber: req.body.phone,
          state: req.body.state,
          street_address: req.body.street_address,
          town: req.body.city,
        };
        await userAddressSchema.updateOne(
          { user_Id: userId },
          { $push: { address: [newAddress] } },
          { upsert: true }
        );
        resovle();
      } catch (error) {
        reject(error);
      }
    });
  },

  editShippingAddress: (req, res) => {
    return new Promise(async (resolve, reject) => {
      try {
        const { name, email, phoneNumber, state, streetAddress, town, addressId } = req.body;
  
        await userAddressSchema.findOneAndUpdate(
          { "address._id": addressId },
          {
            $set: {
              "address.$.name": name,
              "address.$.email": email,
              "address.$.phoneNumber": phoneNumber,
              "address.$.state": state,
              "address.$.street_address": streetAddress,
              "address.$.town": town,
            },
          }
        )
  
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  },
  
  deleteShippingAddress: async (req, res) => {
    try {
      let userId = req.body.userId;
      let addressId = req.body.addressId;
      await userAddressSchema.updateOne(
        { user_Id: userId },
        {
          $pull: {
            address: { _id: addressId },
          },
        }
      );
      res.json({ status: true });
    } catch (error) {
      console.log(error);
      res.json({ status: false });
    }
  },

  selectCoupon: (req, total) => {
    return new Promise(async (resolve, reject) => {
      try {
        let couponCode = req.body.selectedCoupon;
        console.log(couponCode, "<=== soupon");
        const coupon = await couponSchema.findOne({
          couponCode,
        });
        console.log(coupon);
        let resp = {};
        if (!coupon) {
          resp.message = " Invalid Coupon Code";
          resp.icon = "error";
          resp.status = false;
        } else if (total < coupon.minimumPurchaseAmount) {
          console.log(coupon.discountPercentage);
          resp.message = "The required Purchase Amouont is not satisefied";
          resp.minimumPurchase = coupon.minimumPurchaseAmount;
          resp.icon = "error";
          resp.status = false;
        } else {
          resp.couponDiscount = Math.floor(
            (total * coupon.discountPercentage) / 100
          );
          resp.totalAmount = Math.floor(
            total - (total * coupon.discountPercentage) / 100
          );
          resp.message = "Coupon Applied Succesfully";
          resp.icon = "success";
          resp.status = true;
        }
        resolve(resp);
      } catch (error) {
        reject(error);
      }
    });
  },
  appyCoupon: async (req, total) => {
    try {
      let couponCode = req.body.coupon;
      let coupon = await couponSchema.findOne({
        couponCode,
      });
      if (coupon) {
        let today = Date.now();
        let expiryDate = Date.parse(coupon.expiryDate); 
        if (total >= coupon.minimumPurchaseAmount && expiryDate > today) {
          let discountAmount = Math.floor((total * coupon.discountPercentage) / 100);
          
          return total - discountAmount<=coupon.maxDiscount?discountAmount:coupon.maxDiscount;
        }
      }
      return total;
    } catch (error) {
      console.log(error);
    }
  }
  ,

  generateRazorPay: (orderId, total) => {
    return new Promise((resolve, reject) => {
      console.log(orderId);
      console.log("generateRazorPay =====> ")
      instance.orders.create(
        {
          amount: Math.floor(total * 100),
          currency: "INR",
          receipt: "" + orderId,
        },
        (err, order) => {
          console.log(order, "< === this is the order ");
          resolve(order);
        }
      );
    });
  },
  paymentVerify: (details) => {
    return new Promise(async (resolve, reject) => {
      console.log("paymentVerify ======== >")
      const { createHmac } = await import("node:crypto");

      const secret = "abcdefg";
      const hash = createHmac("sha256",process.env.RAZOR_SECRET_KEY)
        .update(
          details["payment[razorpay_order_id]"] +
            "|" +
            details["payment[razorpay_payment_id]"]
        )
        .digest("hex");
      if (hash == details["payment[razorpay_signature]"]) {
        resolve();
      } else {
        reject();
      }
    });
  },
  changePaymentStatus: (orderId) => {
    return new Promise(async (resolve, reject) => {
      orderId = new mongoose.Types.ObjectId(orderId);
      console.log(orderId);
      await orderSchema.updateOne(
        { _id: orderId },
        {
          $set: { payment_status: "Placed" },
        }
      );
      resolve(orderId);
    });
  },

  orderDetialView: (orderId) => {
    return new Promise(async (resolve, reject) => {
      let orderInfo = await orderSchema.findOne({ _id: orderId });
      if (orderInfo) {
        resolve(orderInfo);
      } else {
        console.log("there isn't any order on this id ");
        reject();
      }
    });
  },

  searchResult: async (req, res) => {
    try {
      let searchValue = req.query.search;
      if(req.query.search){
        let searchVal =
        searchValue.charAt(0).toUpperCase() + searchValue.slice(1);
      let searchResult = await productsSchema
        .find({
          $text: {
            $search: searchVal,
          },
          deleted: false,
        })
        .exec();

        if(searchResult.length <1){
          req.session.message={
            type:'error',
            message:"There is no product available in that name"
          }
          res.redirect("/")
        }
        console.log(searchResult)
      return searchResult;
      }

    } catch (error) {
      res.status(500).json({ error: "An error occurred" });
    }
  },


  listProducts: (req, res) => {
    return new Promise(async (resolve, reject) => {
      console.log(req.query);
      console.log("up");
      try {
        let query = [
          {
            $lookup: {
              from: "categories",
              localField: "category",
              foreignField: "_id",
              as: "categories"
            }
          },
          { $unwind: "$categories" }
        ];
  
        console.log(query);
  
        if (req.query.searchKeyword && req.query.searchKeyword !== "") {
          query.push({
            $match: {
              $or: [
                {
                  product_name: { $regex: req.query.searchKeyword, $options: "i" }
                }
              ]
            }
          });
        }
  
        if (req.query.category && req.query.category !== "") {
          query.push({
            $match: { "categories.category_name": req.query.category }
          });
        }
  
        let sortField = req.query.sortBy;
        let sortQuery = {};
  
        if (sortField === "product_name") {
          sortQuery = { "categories.category_name": 1, product_name: 1 };
        } else if (sortField === "product_price") {
          sortQuery = { "categories.category_name": 1, product_price: 1 };
        }
  
        if (Object.keys(sortQuery).length > 0) {
          query.push({ $sort: sortQuery });
        }
  
        let shopItems = await productsSchema.aggregate(query);
  
        if (shopItems.length < 1) {
          req.session.message = {
            type: 'error',
            message: "Oops! We couldn't find any products matching the identifier you provided"
          };
          res.redirect('/');
        }
  
        console.log("Entered into the shop page", shopItems);
        let resultsHTML = generateResultsHTML(shopItems);
        resolve(resultsHTML);
      } catch (error) {
        reject(error);
      }
    });
  },

  walletPayment: async (req, res, totalAmount) => {
    let userId = req.session.user._id;
    try {


      let wallet = await walletSchema.findOne({ user: userId });
      let response={}
      if(!wallet){
        response.message = `You dont have money in wallet`
        response.wallet = false;
      }else if(wallet.balance < totalAmount){
        let amount = totalAmount-wallet.balance
        response.message = `you need ₹ ${amount} more to proceed wallet transaction`
        response.wallet = false;
      }else{
      await walletSchema.updateOne(
        { user: userId },
        {
          $inc: { balance: -totalAmount },
          $push: {
            transactions: { amount: totalAmount, type: 'debit', date: new Date() }
          }
        });
      response.wallet=true;
      }
      return response
    } catch (error) {
      throw error;
    }
  }
  ,
  
};
