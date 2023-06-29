var express = require("express");
var router = express.Router();
const bcrypt = require("bcryptjs");
require('dotenv').config({path:"./.env"})


const productHelper = require("../helpers/productHelper");
let adminHelper = require("../helpers/adminHelper");
const productController = require("../helpers/productController");
const { check, validationResult } = require("express-validator");
//  schemaa models >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
const userSchema = require("../models/userSchema");
const categorySchema = require("../models/categorySchema");
const productsSchema = require("../models/productSchema");
const cartSchema = require("../models/cartSchema");
const userAddressSchema = require("../models/userAddressSchema");
const couponSchema = require("../models/couponSchema");
const userHelper = require("../helpers/userHelper");

// <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< end
const login = (req, res) => {
  res.render("admin/page-account-login",{admin:true}); // Remove the leading slash ("/views")
};

const loginPost = (req, res) => {
  try {
    const user = {
      username: "admin060@gmail.com",
      password: "admin",
    };
    const { username, password } = req.body;
    if (user.username === username) {
      console.log("logged ");

      if (user.password === password) {
        console.log("logged in");

        req.session.admin = username;
        console.log("logged in");
        res.redirect("/admin");
      } else {
        // res.json("Invalid password")
        req.session.message = {
          type: "error",
          message: "Invalid Password",
        };
        res.redirect("/admin/login");
      }
    } else {
      req.session.message = {
        type: "error",
        message: "Invalid Email",
      };
      res.redirect("/admin/login");
    }
    // res.json("Invalid email")
  } catch (error) {
    res.json(error);
  }
};

const adminHomePage = async (req, res) => {
  if (req.session.admin) {
    let user = await userSchema.find().exec();
    let totalRevenue = await adminHelper.findRevenue();
    let totalOrders = await adminHelper.ordersCount();
    let monthlyOrders= await adminHelper.monthlyOrders()
    let totalProducts = await adminHelper.productsCount();
    let totalCategories = await adminHelper.categoriesCount();
    let monthlyRevenue = await adminHelper.monthlySales();
    let cancelledOrders= await adminHelper.cancelledOrders();
    let keralaOrders= await adminHelper.orderFromKerala();
    let karnatakaOrders= await adminHelper.orderFromKarnataka();
    let tamilnaduOrders= await adminHelper.orderFromTamilNadu();
    let usersCount= await adminHelper.totalUsers();
    let categoryWise= await adminHelper.categoryWise()
    var catVal = Object.values(categoryWise)
    let catKey = Object.keys(categoryWise);

    
    res.render("../views/admin/index.hbs", {
      user,
      totalRevenue,
      totalOrders,
      totalProducts,
      monthlyOrders,
      totalCategories,
      monthlyRevenue,
      cancelledOrders,
      keralaOrders,
      karnatakaOrders,
      catVal,
      catKey,
      tamilnaduOrders,
      usersCount,
      admin: true,
    });
  } else {
    req.session.message = {
      type: "error",
      message: "Invalid Email",
    };
    res.redirect("/admin/login");
  }
};

// const signOut = (req, res) => {
//   req.session.destroy((err) => {
//     if (err) res.send("There is an error in logout");
//     else res.redirect("/");
//   });
// };

const addCategories = (req, res) => {
  productHelper.getAllCategory().then((category) => {
    res.render("../views/admin/addCategories.hbs", { admin: true, category });
  });
};

const addCategoriesPost = (req, res) => {
  productHelper.addCategories(req, res);
};

const addCouponPage = (req, res) => {
  productHelper.getCoupons().then((coupons) => {
    console.log(coupons);
    res.render("../views/admin/addCoupon.hbs", { admin: true, coupons });
  });
};

const addCouponPost = (req, res) => {
  productHelper.addCoupon(req, res);
};

const addProductPage = async (req, res) => {
  try {
    const category = await productHelper.getAllCategory();

    res.render("../views/admin/AddProduct.hbs", {
      admin: true,
      category,
    });
  } catch (error) {
    console.log(error);
    res.redirect("/error");
  }
};

const addProductPost = (req, res, next) => {
  productHelper.addProduct(req, res, next);
};

const usersPage = async (req, res) => {
  let user = await userSchema.find().exec();
  res.render("../views/admin/page-users-list.hbs", { user, admin: true });
};

const editProduct = async (req, res) => {
  try {
    let productId = req.query.id;
    // let product = await productsSchema.findOne({ _id: productId }).exec();
    let product=await productHelper.getCategoryNameAndId(productId);

    productHelper.getAllCategory().then((category) => {
      res.render("../views/admin/page-product-edit.hbs", {
        product,
        category,
        admin: true,
      });
    });
  } catch (error) {
    console.log(error);
  }
};

const editProductPost = (req, res) => {
  productHelper.productEdit(req, res);
};

const deleteProduct = (req, res) => {
  productHelper.productDelete(req, res);
};

const deleteCategory = async (req, res) => {
  productHelper.deleteCategory(req, res);
};

const addUserPage = (req, res) => {
  res.render("../views/admin/page-add-user.hbs", { admin: true });
};

const addUserPost = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const alert = errors.array();
    res.render("../views/admin/page-add-user.hbs", { alert, admin: true });
  } else {
    const { username, phoneNumber, email, password } = req.body;

    try {
      const userExist = await userSchema.findOne({
        userName: email,
      });
      if (userExist) {
        req.session.message = {
          type: "error",
          message: "Already registered Email Id",
        };
        res.redirect("/admin/page-users");
        return;
      }
      const user = new userSchema({
        username,
        phoneNumber,
        email,
        password,
      });
      bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(user.password, salt, async (err, hash) => {
          user.name = username;
          user.password = hash;
          user.userName = email;
          await user.save();
          req.session.message = {
            type: "succes",
            message: "User added successfully",
          };

          res.redirect("/admin/page-users");
        });
      });
    } catch (err) {
      console.log(err.message);
      req.session.message = {
        type: "error",
        message: "An error occured while adding the user",
      };
      res.redirect("/admin");
    }
  }
};

const blockUser = async (req, res) => {
  const userId = req.query.id;
  try {
    const user = await userSchema.findById(userId);

    if (user) {
      user.blocked = true;
      await user.save();
      console.log(user);

      req.session.message = {
        type: "succes",
        message: "User blocked successfully",
      };
    } else {
      console.log(`User not found.`);
    }
  } catch (err) {
    console.log(err);
  }
  res.redirect("/admin/page-users");
};

const unblockUser = async (req, res) => {
  const userId = req.query.id;

  try {
    const user = await userSchema.findById(userId);
    if (user) {
      user.blocked = false;
      await user.save();
      req.session.message = {
        type: "succes",
        message: "User unblocked successfully",
      };
    } else {
      req.session.message = {
        type: "error",
        message: "User not found",
      };
    }
  } catch (err) {
    console.log(err);
  }
  res.redirect("/admin/page-users");
};

const orderPage = async (req, res) => {
  const orderdProduct = await productHelper.getAllOrders();
  let color = "";
  if (orderdProduct.length > 1) {
    let color =
      orderdProduct[0].payment_status === "Placed"
        ? "badge-success"
        : "badge-warning";
  }

  res.render("../views/admin/page-orders.hbs", {
    admin: true,
    orderdProduct,
    color,
  });
};

const orderDetails = async (req, res) => {
  try {
    let cartId = req.query.id;
    let orderProData = await productHelper.getOrderDetails(cartId);
    let customerAddress = [];
    let products = [];
    let orderId = "";

    if (orderProData) {
      customerAddress = orderProData[0].deliveryAddress;
      products = orderProData[0].productInfo;
      orderId = orderProData[0]._id;
    }

    res.render("../views/admin/page-orders-detail.hbs", {
      admin: true,
      orderProData,
      customerAddress,
      products,
      orderId,
    });
  } catch (error) {
    console.log(error);
    res.send(error);
  }
};

const changeOrderStatus = (req, res) => {
  try {
    productHelper.changeOrderStatus(req.body).then(() => {
      res.json({ status: true });
    });
  } catch (error) {
    console.log(error);
  }
};

const signOut = (req, res) => {
  if (req.session.admin) {
    req.session.admin = null;
    res.redirect("/admin/login");
  } else {
    res.send("Access denied");
  }
};



const salesReport = async(req,res)=>{
  let render = false;
  let weeklyReport = await adminHelper.weeklySales();
  let weekTotal = await adminHelper.weekTotal();
  let monthlySales = await adminHelper.monthleySalesDetails()
  let monthTotal = await adminHelper.monthTotal()
  let yearlySales =await adminHelper.yearlySales()
  let yearTotal = await adminHelper.yearTotal()
  // console.log(weeklyReport);

  if(weeklyReport.length > 0){
      render = true;
  }
  res.render('../views/admin/salesReport.hbs',
     {admin:true,
      weeklyReport,
      weekTotal,
      monthlySales,
      monthTotal,
      yearlySales,
      yearTotal,
      render
    })

}

const bannerPage =(req,res)=>{
  res.render("../views/admin/addBanner.hbs",{admin:true})
}

const bannerCreation= async ( req, res) => {
  try {
    await adminHelper.createBanner(req,res)
  } catch (error) {
    throw error
  }
}

const editCoupon=async(req,res)=>{
  try {
    let couponId= req.query.id
  let couponData= await couponSchema.findById(couponId)
  console.log(couponData);
  res.render("../views/admin/EditCoupon.hbs",{couponData,admin:true})
  } catch (error) {
    throw error
  }
}
const editCouponPost = (req, res) => {
  try {
    adminHelper.couponEdit(req,res).then(()=>{
      res.json({status:true})
    })

  } catch (error) {
    throw error
  }
};

const couponDelete=async(req,res)=>{
  try {
    let couponId= req.query.id
    console.log(couponId)
    await couponSchema.findOneAndUpdate({_id:couponId},{$set:{deleted:true}})
    req.session.message={
      type:"success",
      message:"Couopon Deleted Successfully"
    }
    res.redirect("/admin/addCoupon")
    
  } catch (error) {
    console.log(error)
    throw error
  }
}

module.exports = {
  login,
  loginPost,
  adminHomePage,
  addCategories,
  addCategoriesPost,
  addCouponPage,
  addCouponPost,
  addProductPage,
  addProductPost,
  usersPage,
  editProduct,
  editCoupon,
  editCouponPost,
  editProductPost,
  deleteProduct,
  deleteCategory,
  addUserPage,
  addUserPost,
  blockUser,
  unblockUser,
  orderPage,
  orderDetails,
  bannerPage,
  bannerCreation,
  changeOrderStatus,
  salesReport,
  signOut,
  couponDelete,
};
