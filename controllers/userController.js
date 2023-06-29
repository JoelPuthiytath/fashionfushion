var express = require("express");

require('dotenv').config({path:"./.env"})

const accountSid=process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const verifySid=process.env.TWILIO_SERVICE_SSID
console.log(authToken,"authToken")
console.log(accountSid,"accountSSid")
console.log(verifySid,"serviceSid")
const client = require("twilio")(accountSid, authToken);
const bcrypt = require("bcryptjs");
const { check, validationResult } = require("express-validator");
const app = express();
//  schemaaa models >>>>>>>>>>>

const userSchema = require("../models/userSchema");
const productsSchema = require("../models/productSchema");
const categorySchema = require("../models/categorySchema");
const cartSchema = require("../models/cartSchema");
const userAddressSchema = require("../models/userAddressSchema");
const orderSchema = require("../models/orderSchema");
const couponSchema = require("../models/couponSchema");
const walletSchema = require("../models/walletSchema");
// <<<<<<<<<<<<<<<<<<<<<<<<<< end
//  HELPERSSS >>>>>>>>

const userHelper = require("../helpers/userHelper");
const productHelper = require("../helpers/productHelper");
const adminHelper = require("../helpers/adminHelper");

//  end <<<<<<<<<<<<<<
const { default: mongoose } = require("mongoose");
const { json } = require("body-parser");
// const { AwsInstance } = require("twilio/lib/rest/accounts/v1/credential/aws");
// const {
//   CompositionHookContextImpl,
// } = require("twilio/lib/rest/video/v1/compositionHook");
const productSchmea = require("../models/productSchema");
// const { EsimProfilePage } = require("twilio/lib/rest/supersim/v1/esimProfile");

const generateReport = require("../public/javascripts/generateReport");

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const signupPage = (req, res) => {
  res.render("../views/user/page-login-register.hbs");
};
const signupPagePost = (req, res) => {
  userHelper.userSignUP(req, res);
};

const loginPage = (req, res) => {
  if (req.session.user) {
    res.redirect("/");
  } else {
    res.render("../views/user/page-login.hbs");
  }
};
const otpPage = (req, res) => {
  if (req.session.user) {
    res.redirect("/");
  } else {
    res.render("../views/user/otp-verfication.hbs");
  }
};

const otpPagePost = (req, res) => {
  userHelper.otpVerification(req, res);
};

const verifyOtpPage = (req, res) => {
  let mobile = req.body.mobile;
  res.render("../views/user/otp-varification-2.hbs", { mobile });
};
const verifyOtpPagePost = (req, res) => {
  console.log(req.session.mobile, "<= session mobile");
  let mobile =
    req.session.mobile !== undefined || null
      ? req.session.mobile
      : req.session.signUPTemp.phoneNumber;
  console.log(mobile, "<= final selection");
  const enteredCode = req.body.code;

  if (enteredCode.length === 4 && mobile) {
    client.verify.v2
      .services(verifySid)
      .verificationChecks.create({
        to: `+91${mobile}`,
        code: enteredCode,
      })
      .then(async (verificationCheck) => {
        if (verificationCheck.status === "approved") {
          if (req.session.signUPTemp) {
            await userSchema.create(req.session.signUPTemp);
            res.redirect("/user-login");
          } else {
            let userData = await userSchema.findOne({
              phoneNumber: req.session.mobile,
            });
            console.log(userData);
            if (userData) {
              req.session.user = userData;
              res.redirect("/");
            }
          }
        } else {
          res.status(400).send({
            message: "Wrong verification code :(",
          });
        }
      })
      .catch((error) => {
        console.error(error);
        res.status(500).send({
          message: "Error occurred during verification",
        });
      });
  } else {
    res.status(400).send({
      message: "Invalid phone number or verification code :(",
    });
  }
};

const userLogout = (req, res) => {
  req.session.user = null;
  req.session.otp = null;
  res.redirect("/");
};

const homePage = async (req, res) => {
  try {
    const categories = await productHelper.getAllCategory();
    const topSoldProducts = await adminHelper.monthlyBestSoldProducts();
    const newArrivals = await userHelper.getNewArrivals();
    let products;

    if (req.query.search) {
      products = await userHelper.searchResult(req, res);
    }

    if (req.session.user) {
      const user = await userSchema.findOne(
        { _id: req.session.user._id },
        { blocked: false }
      );

      if (user) {
        const cartCount = await userHelper.getCartCount(req.session.user._id);

        res.render("../views/user/index.hbs", {
          userlogged: true,
          products,
          header: true,
          topSoldProducts,
          categories,
          user,
          newArrivals,
          cartCount,
          userId: req.session.user_id,
        });
      } else {
        req.session.message = {
          type: "error",
          message: "you are restricted to visit",
        };
        res.redirect("/user-login");
      }
    } else {
      res.render("../views/user/index.hbs", {
        topSoldProducts,
        products,
        header: true,
        newArrivals,
        categories,
      });
    }
  } catch (error) {
    console.log(error);
    throw error;
    // Handle the error appropriately
  }
};
const shopPage = async (req, res) => {
  try {
    const resultsHTML = await userHelper.listProducts(req, res);
    const categories = await productHelper.getAllCategory();
    let user;
    let cartCount = 0;
    if (req.session.user) {
      user = await userSchema.findOne(
        { _id: req.session.user._id },
        { blocked: false }
      );
      cartCount = await userHelper.getCartCount(req.session.user._id);
    }

    res.render("../views/user/shop.hbs", {
      userlogged: req.session.user !== undefined ? true : false,
      cartCount,
      header: true,
      user,
      // resultsHTML,
      categories,
      listedItems: resultsHTML,
    });
  } catch (error) {
    res.render("../views/error.hbs", { error: error });
  }
};

const productView = async (req, res) => {
  const productId = req.query.id;
  if (req.session.user) {
    const product = await productsSchema.findOne({ _id: productId }).exec();
    const products = await adminHelper.monthlyBestSoldProducts();
    const user = await userSchema.findOne(
      { _id: req.session.user._id },
      { blocked: false }
    );
    const cartCount = await userHelper.getCartCount(req.session.user._id);
    res.render("../views/user/shop-product-view.hbs", {
      userlogged: true,
      product,
      user,
      header: true,  
      cartCount,
      products,
    });
  } else {
    const product = await productsSchema.findOne({ _id: productId }).exec();
    const products = await adminHelper.monthlyBestSoldProducts();
    res.render("../views/user/shop-product-view.hbs", {
      product,
      products,
      header: true,
    });
  }
};

const addToCart = (req, res) => {
  productHelper.addToCart(req.query.id, req.session.user._id).then(() => {
    res.json({ status: true });
  });
};

const addToWishList = (req, res) => {
  userHelper.addToWishList(req.query.id, req.session.user._id).then(() => {
    res.json({ status: true });
  });
};

const wishListPage = async (req, res) => {
  let wishlistItems = await userHelper.wishListItems(req.session.user._id);
  console.log(wishlistItems);
  const user = await userSchema.findOne(
    { _id: req.session.user._id },
    { blocked: false }
  );
  const cartCount = await userHelper.getCartCount(req.session.user._id);
  res.render("../views/user/shop-wishlist.hbs", {
    wishlistItems,
    user,
    cartCount,
    header: true,
    userlogged: true,
  });
};
const changeQuantity = (req, res, next) => {
  if (req.session.user) {
    userHelper.getProductQuantity(req.body).then(async (resp) => {
      resp.total = await userHelper.getTotal(req.session.user._id);
      res.json(resp);
    });
  } else {
    res.redirect("/user-login");
  }
};

const cartView = async (req, res) => {
  let cartProducts = await userHelper.getCartProducts(req.session.user._id);
  let userId = req.session.user._id;
  let total = 0;
  const user = await userSchema.findOne({ _id: userId }, { blocked: false });
  // const cartCount = await userHelper.getCartCount(req.session.user._id);
  if (cartProducts.length > 0) {
    total = await userHelper.getTotal(req.session.user._id);
  }
  res.render("../views/user/shop-cart.hbs", {
    userlogged: true,
    cartProducts,
    total,
    header: true,
    user,
    userId,
  });
};
const cartProductRemove = (req, res) => {
  userHelper.removeCartProduct(req.body).then(() => {
    res.json({ status: true });
  });
};

const removeFromWishlist = (req, res) => {
  userHelper.removeWishlistItem(req.body).then(() => {
    res.json({ status: true });
  });
};

const checkOutPage = async (req, res) => {
  if (req.session.user) {
    let cartProducts = await userHelper.getCartProducts(req.session.user._id);
    let total = await userHelper.getTotal(req.session.user._id);
    let shippingAddress = await userAddressSchema.findOne({
      user_Id: req.session.user._id,
    });
    // const user = await userSchema.findOne({ blocked: false });
    let user = req.session.user;
    res.render("../views/user/shop-checkout.hbs", {
      userlogged: true,
      cartProducts,
      user,
      header: true,
      shippingAddress,
      total,
    });
  } else {
    res.redirect("/user-login");
  }
};

const orderSuccessPage = (req, res) => {
  if (req.session.user) {
    let orderId = req.query.id;
    console.log(orderId, "<== this is ################");
    res.render("../views/user/orderSuccessful.hbs", { orderId });
  } else {
    res.redirect("/user-login");
  }
};

const orderHistory = async (req, res) => {
  if (req.session.user) {
    let userId = req.session.user._id;
    let proData = await userHelper.getOrderDetailsForUser(userId);
    res.render("../views/user/order-details.hbs", {
      userlogged: true,
      proData,
      header: true,

      // products,
    });
  } else {
    res.redirect("/user-login");
  }
};
const viewOrderPage = async (req, res) => {
  try {
    let orderId = new mongoose.Types.ObjectId(req.query.id);
    let orderInfo = await orderSchema.findById(orderId);
    let user = await userSchema.findById(req.session.user._id);
    let subTotal = 0;
    if (orderInfo) {
      let { products } = orderInfo;
      console.log(products, "< ====== order INfo");

      products.forEach((product) => {
        subTotal += product.quantity * product.deal_price;
      });
      console.log(subTotal);
    } else {
      console.log("there is not order with this id");
    }
    userHelper.orderDetialView(orderId).then((order) => {
      res.render("../views/user/order-details.hbs", {
        order,
        userlogged: true,
        user,
        subTotal,
        header: true,
      });
    });
  } catch (error) {
    console.log(error);
  }
};

const orderCancel = (req, res) => {
  let userId = req.session.user._id;
  userHelper.cancelOrder(req.body, userId).then(() => {
    res.json({ status: true });
  });
};

const orderReturn = (req, res) => {
  let userId = req.session.user._id;
  userHelper.returnOrder(req.body, userId).then(() => {
    res.json({ status: true });
  });
};

const profileView = async (req, res) => {
  if (req.session.user) {
    let userInfo = await userSchema.findOne({
      _id: req.session.user._id,
    });
    console.log(req.session.user._id);

    let shippingAddress = await userAddressSchema.findOne({
      user_Id: req.session.user._id,
    });
    let orderedProduct = await orderSchema.find({
      user_Id: req.session.user._id,
    });
    let userId = new mongoose.Types.ObjectId(req.session.user._id);
    const wallet = await walletSchema.findOne({ user: userId });
    const walletAmount = wallet ? wallet.balance : 0;
    console.log(orderedProduct);
    let user = await userSchema.findById(req.session.user._id);
    console.log(user, "this is user data");
    res.render("../views/user/page-profile.hbs", {
      userInfo,
      shippingAddress,
      header: true,
      user,
      wallet,
      walletAmount,
      orderedProduct,
      userlogged: true,
    });
  } else {
    res.redirect("user-login");
  }
};

const shoppingAddress = (req, res) => {
  userHelper.addshippingAddress(req, res).then(() => {
    let resp = {};
    resp.status = true;
    res.json(resp);
  });
};

const editShippingAddress = async (req, res) => {
  let addressId = req.query.id;
  console.log(addressId);
  try {
    let addressbild = await userAddressSchema.findOne(
      { "address._id": addressId },
      { "address.$": 1 }
    );
    let billingAddress = addressbild.address;
    console.log(billingAddress);
    let user = await userSchema.findById(req.session.user._id);

    res.render("../views/user/userAddressEdit.hbs", {
      billingAddress,
      user,
      userlogged: true,
      header: true,
    });
  } catch (error) {
    throw error;
  }
};

const editshippingAddressPost = async (req, res) => {
  try {
    await userHelper.editShippingAddress(req, res).then(() => {
      res.json({ status: true });
    });
  } catch (error) {
    throw error;
  }
};

const couponSelect = async (req, res) => {
  if (req.session.user) {
    let total = await userHelper.getTotal(req.session.user._id);
    userHelper.selectCoupon(req, total).then((response) => {
      res.json(response);
    });
  }
};

const orderPlace = async (req, res) => {
  let products = await userHelper.getCartProductsList(req.body.userId);
  let totalPrice = await userHelper.getTotal(req.body.userId);
  console.log(req.body);
  if (req.body.payment_option == "wallet") {
    console.log("i am inside the order method")
    let totalAmount = await userHelper.appyCoupon(req, totalPrice);
    console.log("added coupon if any")
    let response = await userHelper.walletPayment(req, res, totalAmount);

    if (!response.wallet) {
      message = response.message;
      res.json({ wallet: false, message });
      return
    }
  console.log("checked if any wallet is there or not ")
  }

  userHelper
    .placeOrder(req.body, products, totalPrice)
    .then(async (response) => {
      if (response.payment_method === "COD") {
        res.json({ orderId: response._id, COD: true });
      }else if(response.payment_method === "wallet"){
        res.json({ orderId: response._id, wallet: true })
      }
       else {
        console.log("selected method is razorPay")
        let totalAmount = await userHelper.appyCoupon(req, totalPrice);
        console.log("applied coupon if any",totalAmount)
        userHelper
          .generateRazorPay(response._id, totalAmount)
          .then((response) => {
            console.log(response,"it is response")
            res.json(response);
          });
      }
    });
};

const paymentVerifycation = (req, res) => {
  console.log(req.body);
  userHelper
    .paymentVerify(req.body)
    .then(() => {
      userHelper
        .changePaymentStatus(req.body["order[receipt]"])
        .then((orderId) => {
          res.json({ orderId, status: true });
        });
    })
    .catch((err) => {
      res.json({ status: false, errMsg: "Payment Faild" });
    });
};

// const searchOperation = async (req, res) => {
//   let products = await userHelper.searchResult(req, res);
//   // console.log("these are the products > >> > ", { products });
//   res.render("../views/user/index.hbs", { products });
// };

// const createInvoice=async(req,res)=>{
//   const orderId = req.query.orderId;
//   const { format } = req.body;
//   if (!format) {
//     req.session.message={
//       type:'error',
//       message:"there isn't any format field"
//     }
//     return res.status(400).send('Format field is required');
//   }
//   // Generate the sales report using your e-commerce data
//   let orderData = []
//   console.log("haiii")
//   try {
//     // error heree
//      orderData.push(await userHelper.orderDetialView(orderId));
//     console.log(orderData)
//   } catch (err) {
//     console.log("this is an error ")
//   }
//   //    console.log('Error calculating sales data:', err);
//   //    req.session.message={
//   //     type:'error',
//   //     message:"Error calculating sales data"
//   //    }
//   //    return res.status(500).send('Error calculating sales data');
//   // }
//   // try {
//   //    // Convert the report into the selected file format and get the name of the generated file
//   //    const reportFile = await generateReport(format, orderData);
//   //    // Set content type and file extension based on format
//   //    let contentType, fileExtension;
//   //    if (format === 'pdf') {
//   //       contentType = 'application/pdf';
//   //       fileExtension = 'pdf';
//   //    } else if (format === 'excel') {
//   //       console.log('proper format');
//   //       contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
//   //       fileExtension = 'xlsx';
//   //    } else {
//   //       return res.status(400).send('Invalid format specified');
//   //    }
//   //    // Send the report back to the client and download it
//   //    res.setHeader('Content-Disposition', `attachment; filename=sales-report.${fileExtension}`);
//   //    res.setHeader('Content-Type', contentType);
//   //    const fileStream = fs.createReadStream(reportFile);
//   //    fileStream.pipe(res);
//   //    fileStream.on('end', () => {
//   //       console.log('File sent successfully!')
//   //       // Remove the file from the server
//   //       fs.unlink(reportFile, (err) => {
//   //          if (err) {
//   //             console.log('Error deleting file:', err);
//   //          } else {
//   //             console.log('File deleted successfully!');
//   //          }
//   //       })
//   //    })
//   // } catch (err) {
//   //    console.log('Error generating report:', err);
//   //    return res.status(500).send('Error generating report');
//   // }

// }

const orderTracking = async (req, res) => {
  let orderId = req.body["order-id"];
  console.log(orderId);
  try {
    let order = await orderSchema.findById(orderId);
    let user = await userSchema.findById(req.session.user._id);
    res.render("../views/user/orderTracking.hbs", {
      order,
      userlogged: true,
      header: true,
      user,
    });
  } catch (error) {
    throw error;
  }
};

// const addToWallet = async (req, res) => {
//   let userId = req.session.user._id;
//   console.log(userId);
//   let amount = parseInt(req.body.amount);
//   console.log(amount);

//   try {
//     const wallet = await walletSchema.findOne({ user: userId });

//     if (!wallet) {
//       const newWallet = new walletSchema({
//         user: userId,
//         balance: amount,
//         transactions: [{ amount, Date: new Date() }],
//       });
//       await newWallet.save();
//     } else {
//       wallet.balance += amount;
//       wallet.transactions.push({ amount, Date: new Date() });
//       await wallet.save();
//     }

//     res.json({ amount });
//   } catch (error) {
//     console.error(error);
//     throw error;
//   }
// };

module.exports = {
  signupPage,
  signupPagePost,
  loginPage,
  otpPage,
  otpPagePost,
  verifyOtpPage,
  verifyOtpPagePost,
  userLogout,
  homePage,
  productView,
  addToCart,
  changeQuantity,
  cartView,
  cartProductRemove,
  checkOutPage,
  orderSuccessPage,
  orderHistory,
  orderCancel,
  orderReturn,
  profileView,
  shoppingAddress,
  editShippingAddress,
  editshippingAddressPost,
  couponSelect,
  orderPlace,
  paymentVerifycation,
  viewOrderPage,
  addToWishList,
  wishListPage,
  removeFromWishlist,
  shopPage,
  // createInvoice,
  orderTracking,
  // addToWallet,
  // searchOperation,
};
