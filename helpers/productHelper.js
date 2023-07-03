// const { Reject } = require("twilio/lib/twiml/VoiceResponse");
const collections = require("../config/collections");

const mongoose = require("mongoose");
const multer = require("multer");
const categorySchema = require("../models/categorySchema");
const userSchema = require("../models/userSchema");
const productsSchema = require("../models/productSchema");
const cartSchema = require("../models/cartSchema");
const userAddressSchema = require("../models/userAddressSchema");
const orderSchema = require("../models/orderSchema");
const couponSchema = require("../models/couponSchema");
const Inventory = require("../models/inventorySchema");
const sharp = require("sharp");
require('dotenv').config({path:"./.env"})
// const { productView } = require("../controllers/userController");

// const ObjectId = mongoose.Types.ObjectId

module.exports = {

  addCategories: async (req, res) => {
    const storage = multer.diskStorage({
      destination: function (req, file, cb) {
        cb(null, "./public/thumbnails");
      },
      filename: function (req, file, cb) {
        cb(null, `${Date.now()}-${file.originalname}`);
      },
    });
    const upload = multer({ storage }).single("coverPhoto");
    upload(req, res, async (err) => {
      if (err) {
        console.log(err);
        req.session.message = {
          type: "error",
          message: "Failed to upload profile photo",
        };
        return res.redirect("/admin/addCategories");
      }

      const category = req.body.category_name.toUpperCase();

      const categoryExists = await categorySchema.exists({
        category_name: category,
      });

      if (categoryExists) {
        req.session.message = {
          type: "error",
          message: "Category already exists",
        };
        return res.redirect("/admin/addCategories");
      }
      console.log(req.file, "<+++++++++++file images");

      const newCategory = new categorySchema({
        category_name: category,
        thumbnail: req.file.filename,
      });

      await categorySchema.create(newCategory);

      return res.redirect("/admin/addCategories");
    });
  },
  //  add product ###################

  addProduct: (req, res, next) => {
    const storage = multer.diskStorage({
      destination: function (req, file, cb) {
        cb(null, "./public/uploads");
      },
      filename: function (req, file, cb) {
        cb(null, `${Date.now()}-${file.originalname}`);
      },
    });
    const upload = multer({ storage });

    upload.fields([
      { name: "image", maxCount: 5 },
      { name: "cover_photo", maxCount: 1 },
    ])(req, res, async (err) => {
      if (err) {
        console.log(err);
        return next(err);
      }
      try {
        const category = await categorySchema.findOne({
          category_name: req.body.category,
        });
        if (!category) {
          console.log("Category not found");
          // Handle the case where the category is not found
          return;
        }
        const newProduct = new productsSchema({
          product_name: req.body.product_name,
          product_brand: req.body.product_brand,
          product_description: req.body.product_description,
          category: category._id,
          product_price: req.body.regular_price,
          deal_price: req.body.promotional_price,
          in_stock: req.body.product_stock,
          product_image: Array.isArray(req.files.image)
            ? req.files.image.map((file) => file.filename)
            : [],
          cover_photo: req.files.cover_photo
            ? req.files.cover_photo[0].filename
            : null,
        });

        const createdProduct = await productsSchema.create(newProduct);

        const inventoryEntry = new Inventory({
          productId: createdProduct._id,
          quantity: req.body.product_stock,
        });
        await Inventory.create(inventoryEntry);

        res.redirect("/admin/page-products");
      } catch (error) {
        console.log(error);
      }
    });
  },

  productEdit: async (req, res) => {
    const storage = multer.diskStorage({
      destination: function (req, file, cb) {
        cb(null, "./public/uploads");
      },
      filename: function (req, file, cb) {
        cb(null, `${Date.now()}-${file.originalname}`);
      },
    });
    const upload = multer({ storage });

    upload.fields([
      { name: "image", maxCount: 5 },
      { name: "cover_photo", maxCount: 1 },
    ])(req, res, async (err) => {
      try {
        const productId = req.query.id;
        console.log(productId);
        const productExist = await productsSchema.findById(productId);
        console.log(productId);
        console.log(productExist);
        if (!productExist) {
          req.session.message = {
            type: "error",
            message: "Product not found",
          };
          res.redirect("/admin/page-products");
          return;
        }
        console.log(req.files);
        console.log(req.body);

        console.log("Checking for images");
        if (req.files && req.files.length > 0) {
          const croppedImages = [];
          console.log("With images");

          for (const key in req.files) {
            const file = req.files[key][0];
            // Perform image cropping using Sharp
            const croppedImage = await sharp(file.path)
              .extract({ left: 10, top: 10, width: 200, height: 200 }) // Specify the crop region
              .toBuffer();
            croppedImages.push({
              filename: file.filename,
              mimetype: file.mimetype,
              buffer: croppedImage,
            });
          }

          await productsSchema.findOneAndUpdate(
            { _id: productId },
            {
              product_name: req.body.product_name,
              product_brand: req.body.product_brand,
              product_description: req.body.product_description,
              category: req.body.category,
              product_price: req.body.regular_price,
              deal_price: req.body.promotional_price,
              in_stock: req.body.product_stock,
              product_image: req.files["image"].map((file) => file.filename),
              cover_photo: req.files["cover_photo"][0].filename,
            }
          );
        } else {
          console.log("Without images");
          console.log(req.body);
          await productsSchema.findOneAndUpdate(
            { _id: productId },
            {
              product_name: req.body.product_name,
              product_brand: req.body.product_brand,
              product_description: req.body.product_description,
              category: req.body.category,
              product_price: req.body.regular_price,
              deal_price: req.body.promotional_price,
              in_stock: req.body.product_stock,
            }
          );
        }

        if (productExist.in_stock !== req.body.product_stock) {
          await Inventory.findOneAndUpdate(
            { productId },
            { quantity: req.body.product_stock }
          );
        }

        req.session.message = {
          type: "success",
          message: "Product updated successfully!",
        };
        res.redirect("/admin/page-products");
      } catch (error) {
        console.log(error);
      }
    });
  },
  productDelete: async (req, res) => {
    try {
      const productId = req.query.id;
      const deletedProduct = await productsSchema.findOneAndUpdate(
        { _id: productId },
        { deleted: true }
      );

      if (!deletedProduct) {
        req.session.message = {
          type: "error",
          message: " Product is not found ",
        };
        res.redirect("/admin/page-products");
        return;
      }
      req.session.message = {
        type: "success",
        message: " Product deleted succesfully!",
      };
      res.redirect("/admin/page-products");
    } catch (err) {
      console.log(err);
    }
  },
  deleteCategory: async (req, res) => {
    try {
      const categoryId = req.query.id;
      console.log(categoryId, "<= category id");

      let output = await categorySchema.findByIdAndUpdate(categoryId, {
        deleted: true,
      });

      console.log(output, "<= output");
      console.log(output, "<= output");
      req.session.message = {
        type: "success",
        message: "category deleted succesfully!",
      };
      res.redirect("/admin/addCategories");
    } catch (err) {
      console.log(err);
    }
  },
  getAllCategory: async () => {
    try {
      let categories = await categorySchema.find({ deleted: false });
      return categories;
    } catch (error) {
      throw error;
    }
  }
  ,

  getAllProduct: () => {
    return new Promise(async (resolve, Reject) => {
      let products = await productsSchema.find({
        deleted: false,
      });
      if (products) {
        resolve(products);
      } else {
        console.log("no product");
      }
    });
  },
  addToCart: async (proId, userId) => {
    return new Promise(async (resolve, reject) => {
      proId = new mongoose.Types.ObjectId(proId);
      userId = new mongoose.Types.ObjectId(userId); // not sure
      try {
        let product = await productsSchema.findOne({
          _id: proId,
        });
        let proObj = {
          item: proId,
          product_name: product.product_name,
          cover_photo: product.cover_photo,
          deal_price: product.deal_price,
          order_status: "processing",
          quantity: 1,
        };
        let userCart = await cartSchema.findOne({
          user_Id: userId,
        });
        if (userCart) {
          let prodExit = userCart.products.findIndex(
            (products) => products.item.toString() == proId.toString()
          );
          console.log(prodExit);
          if (prodExit !== -1) {
            await cartSchema.updateOne(
              { user_Id: userId, "products.item": proId },
              { $inc: { "products.$.quantity": 1 } }
            );
          } else {
            await cartSchema.updateOne(
              { user_Id: userId },
              { $push: { products: [proObj] } }
            );
          }
        } else {
          const cartObj = {
            user_Id: userId,
            products: [proObj], // Wrap the product ID in an array
          };
          await cartSchema.create(cartObj);
        }
        console.log("product added to the cart")
        resolve();
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
        resolve(total[0].total);
      } catch (error) {
        reject(error);
      }
    });
  },

  getAllOrders: async () => {
    try {
      let orders = await orderSchema
        .find()
        .populate({
          path: "user_Id",
          model: "user",
          select: "name userName phoneNumber", // select the fields you want to include from the User document
        })
        .populate({
          path: "products.$.item",
          model: "product",
        })
        .exec();
      return orders;
    } catch (e) {
      console.log(e);
    }
  },
  getOrderDetails: (str) => {
    return new Promise(async (resolve, reject) => {
      try {
        const orderId = new mongoose.Types.ObjectId(str);
        let orderInfo = await orderSchema.aggregate([
          {
            $match: { _id: orderId },
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
  changeOrderStatus: (details) => {
    return new Promise(async (resolve, reject) => {
      try {
        let orderId = details.orderId;
        let productId = new mongoose.Types.ObjectId(details.productId);
        let status = details.statusValue;
        console.log(status);
        await orderSchema.updateOne(
          { _id: orderId, products: { $elemMatch: { item: productId } } },
          {
            $set: { "products.$.order_status": status },
          }
        );
        const order = await orderSchema.findOne({ _id: orderId });
        const allProductsStatus = order.products.every((product) => {
          return product.order_status === status;
        });
        if (allProductsStatus) {
          await orderSchema.updateOne(
            { _id: orderId },
            {
              $push: {
                order_status: {
                  status: status,
                  timestamp: new Date(),
                },
              },
            }
          );
        }

        if (status === "Delivered") {
          await orderSchema.updateOne(
            { _id: orderId },
            {
              $set: { deliveryDate: Date.now() },
            }
          );
        }

        resolve();
      } catch (error) {
        console.log(error);
      }
    });
  },

  addCoupon: async (req, res) => {
    try {
      // console.log(req.body);
      const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      let couponCode = "";

      for (let i = 0; i < 8; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        couponCode += characters.charAt(randomIndex);
      }
      console.log(couponCode, `<==== this is coupon code `);
      let {
        discountPercentage,
        expiryDate,
        minimumPurchaseAmount,
        maxDiscount,
        userLimitation,
      } = req.body;

      let couponData = {
        couponCode: couponCode,
        discountPercentage: discountPercentage,
        expiryDate: expiryDate,
        minimumPurchaseAmount: minimumPurchaseAmount,
        maxDiscount,maxDiscount,
        userLimitation: userLimitation,
      };
      await couponSchema.create(couponData);
      console.log(couponData);
      req.session.message = {
        type: "success",
        message: "Coupon added succesfully",
      };
      // res.redirect("/admin/addCoupon");
      res.json({ status: true });
    } catch (error) {
      console.log(error);
      res.json({ status: false });
    }
  },
  getCoupons: () => {
    return new Promise(async (resovle, reject) => {
      try {
        let coupons = await couponSchema.find({deleted:false});
        resovle(coupons);
      } catch (error) {
        reject(error);
      }
    });
  },
  getCategoryNameAndId: async (id) => {
    try {
      let product = await productsSchema.findById(id).populate({
        path: "category",
        model: "Category",
        select: "_id category_name",
      });
      console.log(product);
      return product;
    } catch (e) {
      console.log(e);
    }
  },
};
