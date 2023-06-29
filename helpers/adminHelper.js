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
const productSchmea = require("../models/productSchema");
const bannerSchema= require("../models/bannerSchema");
require('dotenv').config({path:"./.env"})
module.exports = {
  findRevenue: async () => {
    try {
      const result = await orderSchema
        .aggregate([
          {
            $group: {
              _id: null,
              totalRevenue: { $sum: "$totalAmount" },
            },
          },
        ])
        .exec();

      if (result.length > 0) {
        return result[0].totalRevenue;
      } else {
        console.log("No orders found.");
        return 0;
      }
    } catch (error) {
      console.log(error);
      throw error;
    }
  },

  ordersCount: async () => {
    try {
      let totalCount = orderSchema.countDocuments();
      return totalCount;
    } catch (error) {
      throw error;
    }
  },
  productsCount: () => {
    try {
      let totalCount = productsSchema.countDocuments();
      return totalCount;
    } catch (error) {
      throw error;
    }
  },
  categoriesCount: () => {
    try {
      let totalCount = categorySchema.countDocuments();
      return totalCount;
    } catch (error) {
      throw error;
    }
  },

  monthlySales: async () => {
    try {
      const monthlyRevenue = [];

      for (let month = 0; month < 12; month++) {
        const startDate = new Date(2023, month, 1);
        const endDate = new Date(2023, month + 1, 0);

        const orders = await orderSchema.find({
          created_at: { $gte: startDate, $lte: endDate },
        });

        const revenue = orders.reduce((total, order) => {
          return total + order.totalAmount;
        }, 0);

        monthlyRevenue.push(revenue);
      }
      console.log(monthlyRevenue, "this is monthlyyyy");

      return monthlyRevenue;
    } catch (err) {
      console.log("Error calculating monthly revenue:", err);
      throw err;
    }
  },
  monthlyOrders: async () => {
    try {
      const monthlyOrders = [];

      for (let month = 0; month < 12; month++) {
        const startDate = new Date(2023, month, 1);
        const endDate = new Date(2023, month + 1, 0);
        const orders = await orderSchema.find({
          created_at: { $gte: startDate, $lte: endDate },
        });
        monthlyOrders.push(orders.length);
      }
      console.log(monthlyOrders, "this is monthly count");
      return monthlyOrders;
    } catch (error) {
      throw error;
    }
  },

  monthlyBestSoldProducts: async () => {
    try {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);

      const endOfMonth = new Date();
      endOfMonth.setMonth(endOfMonth.getMonth() + 1, 0);
      let bestSoldProducts = await orderSchema.aggregate([
        {
          $match: {
            created_at: {
              $gte: startOfMonth,
              $lt: endOfMonth,
            },
            order_status: "confirmed",
          },
        },
        {
          $unwind: "$products",
        },
        {
          $group: {
            _id: "$products.item",
            totalQuantity: {
              $sum: "$products.quantity",
            },
          },
        },
        {
          $sort: {
            totalQuantity: -1,
          },
        },
        {
          $limit: 5,
        },
        {
          $lookup: {
            from: "products",
            localField: "_id",
            foreignField: "_id",
            as: "proData",
          },
        },
        {
          $unwind: "$proData",
        },
        {
          $lookup: {
            from: "categories",
            localField: "proData.category",
            foreignField: "_id",
            as: "categoryData",
          },
        },
        {
          $project: {
            _id: "$proData._id",
            name: "$proData.product_name",
            image1: { $arrayElemAt: ["$proData.product_image", 0] },
            image2: { $arrayElemAt: ["$proData.product_image", 1] },
            brand: "$proData.product_brand",
            category: "$categoryData.category_name",
            oldPrice: "$proData.product_price",
            newPrice: "$proData.deal_price",
          },
        },
      ]);
      return bestSoldProducts;
    } catch (error) {
      throw error;
    }
  },
  cancelledOrders: async () => {
    try {
      let cancelledOrders = [];
      for (let month = 0; month < 12; month++) {
        const startDate = new Date(2023, month, 1);
        const endDate = new Date(2023, month + 1, 0);
        const orders = await orderSchema.find({
          created_at: { $gte: startDate, $lte: endDate },
          order_status:{
            status:"Cancelled"
          },
        });
        cancelledOrders.push(orders.length);
      }
      console.log(cancelledOrders);
      return cancelledOrders;
    } catch (error) {
      throw error;
    }
  },

  orderFromKerala: async () => {
    try {
      let orderFromKerala = [];
      for (let month = 0; month < 12; month++) {
        const startDate = new Date(2023, month, 1);
        const endDate = new Date(2023, month + 1, 0);
        const orders = await orderSchema.find({
          created_at: { $gte: startDate, $lte: endDate },
          "deliveryAddress.state": "Kerala",
        });
        const revenue = orders.reduce((total, order) => {
          return total + order.totalAmount;
        }, 0);
        orderFromKerala.push(revenue);
      }
      console.log(orderFromKerala, "orders form kereala");
      return orderFromKerala;
    } catch (error) {
      throw error;
    }
  },
  orderFromKarnataka: async () => {
    try {
      let orderFromKarnataka = [];
      for (let month = 0; month < 12; month++) {
        const startDate = new Date(2023, month, 1);
        const endDate = new Date(2023, month + 1, 0);
        const orders = await orderSchema.find({
          created_at: { $gte: startDate, $lte: endDate },
          "deliveryAddress.state": "Karnataka",
        });
        const revenue = orders.reduce((total, order) => {
          return total + order.totalAmount;
        }, 0);
        orderFromKarnataka.push(revenue);
      }
      console.log(orderFromKarnataka, "orders from karanataka");
      return orderFromKarnataka;
    } catch (error) {
      throw error;
    }
  },
  orderFromTamilNadu: async () => {
    try {
      let orderFromTamilNadu = [];
      for (let month = 0; month < 12; month++) {
        const startDate = new Date(2023, month, 1);
        const endDate = new Date(2023, month + 1, 0);
        const orders = await orderSchema.find({
          created_at: { $gte: startDate, $lte: endDate },
          "deliveryAddress.state": "Tamilnadu",
        });
        const revenue = orders.reduce((total, order) => {
          return total + order.totalAmount;
        }, 0);
        orderFromTamilNadu.push(revenue);
      }
      console.log(orderFromTamilNadu, "tamilnadu orders");
      return orderFromTamilNadu;
    } catch (error) {
      throw error;
    }
  },
  categoryWise: async () => {
    try {
      const result = await productsSchema.aggregate([
        {
          $lookup: {
            from: "categories",
            localField: "category",
            foreignField: "_id",
            as: "categoryData",
          },
        },
        {
          $group: {
            _id: "$categoryData.category_name",
            count: { $sum: 1 },
            // categoryName: { $first:  }
          },
        },
      ]);

      const countByCategory = {};

      result.forEach((item) => {
        countByCategory[item._id] = item.count;
      });

      console.log(countByCategory, "This is the count of products by category");

      return countByCategory;
    } catch (err) {
      console.log(err);
      return err;
    }
  },

  totalUsers: async () => {
    try {
      let usersCount = await userSchema.countDocuments();
      return usersCount;
    } catch (error) {
      throw error;
    }
  },

  weeklySales: async () => {
    try {
      const weeklyReport = await orderSchema.aggregate([
        { $unwind: "$products" },
        {
          $match: {
            "products.order_status": { $nin: ["Cancelled", "Returned"] },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: "%m-%d-%Y", date: "$created_at" } },
            userId: { $first: "$user_Id" },
            total: { $sum: "$totalAmount" },
            paymentMethod: { $first: "$payment_method" },
          },
        },
        { $sort: { _id: 1 } },
        { $limit: 7 },
      ]);

      const formattedReport = weeklyReport.map((document) => ({
        date: document._id,
        userId: document.userId,
        total: document.total,
        paymentMethod: document.paymentMethod,
      }));

      console.log(formattedReport, "weekly report");
      return formattedReport;
    } catch (error) {
      console.error(error);
      throw new Error("Failed to generate weekly sales report");
    }
  },
  weekTotal: async () => {
    let weekTotal = await orderSchema.aggregate([
      {
        $unwind: "$products",
      },
      {
        $match: {
          "products.order_status": {
            $nin: ["Cancelled", "Returned"],
          },
        },
      },
      {
        $group: {
          _id: "$created_at",
          total: {
            $sum: "$totalAmount",
          },
        },
      },
      {
        $sort: {
          _id: -1,
        },
      },
      {
        $limit: 7,
      },
      {
        $sort: {
          _id: 1,
        },
      },
      {
        $group: {
          _id: null,
          totalAmount: {
            $sum: "$total",
          },
        },
      },
    ]);
    console.log(weekTotal, "weekly total");
    return weekTotal;
  },

  monthTotal: async () => {
    let monthTotal = await orderSchema.aggregate([
      {
        $unwind: "$products",
      },
      {
        $match: {
          "products.order_status": {
            $nin: ["Cancelled", "Returned"],
          },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$created_at" } },
          total: { $sum: "$totalAmount" },
        },
      },
      {
        $group: {
          _id: null,
          totalAmount: {
            $sum: "$total",
          },
        },
      },
    ]);

    console.log(monthTotal, "monthly total");
    return monthTotal;
  },
  yearTotal: async () => {
    try {
      let yearlyTotal = orderSchema.aggregate([
        { $unwind: "$products" },
        {
          $match: {
            "products.order_status": { $nin: ["Cancelled", "Returned"] },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y", date: "$created_at" } },
            total: { $sum: "$totalAmount" },
          },
        },
        {
          $group: {
            _id: null,
            totalAmount: {
              $sum: "$total",
            },
          },
        },
      ]);
      console.log(yearlyTotal);
      return yearlyTotal;
    } catch (error) {
      throw error;
    }
  },

  couponEdit: (req, res) => {
    return new Promise(async (resolve, reject) => {
      try {
        let couponId = req.body.couponId;
        console.log("just checking")
        console.log(req.body)
  
        await couponSchema.updateOne({ _id: couponId }, { 
          $set: {
            couponCode:req.body.couponCode,
            discountPercentage:req.body.discountPercentage,
            expiryDate:req.body.expiryDate,
            minimumPurchaseAmount:req.body.minimumPurchaseAmount,
            userLimitation:req.body.userLimitation,
          } 
        })
        resolve();
      } catch (error) {
        reject(error)
      }
    
    });
  },

  monthleySalesDetails: async () => {
    try {
      let monthlyReport = await orderSchema.aggregate([
        {
          $unwind: "$products",
        },
        {
          $match: {
            "products.order_status": { $nin: ["Cancelled", "Returned"] },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: "%m-%Y", date: "$created_at" } },
            userId: { $first: "$user_Id" },
            total: { $sum: "$totalAmount" },
            paymentMethod: { $first: "$payment_method" },
          },
        },
        {
          $sort: { _id: 1 },
        },
        { $limit: 7 },
      ]);

      const report = monthlyReport.map((document) => ({
        date: document._id,
        userId: document.userId,
        total: document.total,
        paymentMethod: document.paymentMethod,
      }));

      return report;
    } catch (error) {
      throw error;
    }
  },
  yearlySales: async () => {
    try {
      let yearlySales = await orderSchema.aggregate([
        { $unwind: "$products" },
        {
          $match: {
            "products.order_status": { $nin: ["Cancelled", "Returned"] },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y", date: "$created_at" } },
            userId: { $first: "$user_Id" },
            total: { $sum: "$totalAmount" },
            paymentMethod: { $first: "$payment_method" },
          },
        },
        {
          $sort: { _id: 1 },
        },
        { $limit: 7 },
      ]);

      let report = yearlySales.map((document) => ({
        date: document._id,
        userId: document.userId,
        total: document.total,
        paymentMethod: document.paymentMethod,
      }));

      return report;
    } catch (error) {
      throw error;
    }
  },
  createBanner: (req, res) => {
    try {
      const storage = multer.diskStorage({
        destination: function (req, file, cb) {
          cb(null, "./public/uploads/banner");
        },
        filename: function (req, file, cb) {
          cb(null, `${Date.now()}-${file.originalname}`);
        },
      });
      const upload = multer({ storage });

      upload.single("banner-image")(req, res, async (err) => {
        if (err) {
          console.log(err);
          req.session.message = {
            type: "error",
            message: "Failed to upload banner photo",
          };
          res.redirect("/banner-creation");
        }
        console.log(req.file);
        const formData = req.body;
        const bannerData = new bannerSchema({
          title: formData["banner-title"],
          image: req.file.filename,
          description: formData["banner-description"],
          link: formData["banner-link"],
        });
        await bannerSchema.create(bannerData).then(() => {
          res.json({ status: true });
        });
      });
    } catch (error) {
      throw error;
    }
  },
};
