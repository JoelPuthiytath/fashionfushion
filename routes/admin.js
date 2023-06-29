var express = require("express");
var router = express.Router();
const bcrypt = require("bcryptjs");
const productHelper = require("../helpers/productHelper");
const productController = require("../helpers/productController");
const { check, validationResult } = require("express-validator");
const adminController = require("../controllers/adminController");
const middleware = require("../middleware/authentication");

//  admin login and logout

router
  .route("/login")
  .get(adminController.login)
  .post(adminController.loginPost);

router.get("/admin-logout", adminController.signOut);

// pages  in admin side

router.get("/", middleware.setNoCache, adminController.adminHomePage);

router.get(
  "/page-users",
  middleware.setNoCache,
  middleware.adminVerify,
  adminController.usersPage
);

router.get(
  "/order-page",
  middleware.setNoCache,
  middleware.adminVerify,
  adminController.orderPage
);

router.get(
  "/order-details-page",
  middleware.setNoCache,
  middleware.adminVerify,
  adminController.orderDetails
);

//   seach sort paginations filter in products

router.get(
  "/page-products",
  middleware.setNoCache,
  productController.paginateProducts
);

router.get(
  "/page-products/search",
  middleware.setNoCache,
  productController.searchProduct,
  productController.paginateProducts
);

router.get(
  "/page-products/sort",
  middleware.setNoCache,
  productController.sortProducts,
  productController.paginateProducts
);

//  add items like categories, coupon , banner etc. and do operations

router
  .route("/addCategories")
  .get(middleware.adminVerify, adminController.addCategories)
  .post(adminController.addCategoriesPost);

router
  .route("/addCoupon")
  .get(middleware.adminVerify, adminController.addCouponPage)
  .post(adminController.addCouponPost);

router
  .route("/edit-coupon")
  .get(
    middleware.setNoCache,
    middleware.adminVerify,
    adminController.editCoupon
  )
  .patch(
    middleware.setNoCache,
    middleware.adminVerify,
    adminController.editCouponPost
  );

router.get(
  "/delete-coupon",
  middleware.setNoCache,
  middleware.adminVerify,
  adminController.couponDelete
);
router
  .route("/add_product")
  .get(
    middleware.adminVerify,
    middleware.setNoCache,
    adminController.addProductPage
  )
  .post(adminController.addProductPost);

router
  .route("/edit-product")
  .get(
    middleware.setNoCache,
    middleware.adminVerify,
    adminController.editProduct
  )
  .post(middleware.adminVerify, adminController.editProductPost);

router.get(
  "/delete-product",
  middleware.adminVerify,
  adminController.deleteProduct
);

router.get(
  "/delete-category",
  middleware.adminVerify,
  adminController.deleteCategory
);

//  add users and do operations like block, unblock

router
  .route("/add-Users")
  .get(middleware.adminVerify, adminController.addUserPage)
  .post(
    [
      check("username").notEmpty().withMessage("Name is required"),
      check("phoneNumber")
        .isLength({ max: 10 })
        .withMessage("mobile number should not exceed 10 digits"),
      check("email").isEmail().withMessage("Invalid email address"),
      check("password")
        .isLength({ min: 8 })
        .withMessage("Password less than 8 character"),
    ],
    adminController.addUserPost
  );

router.get("/block-user", middleware.setNoCache, adminController.blockUser);

router.get("/unblock-user", middleware.setNoCache, adminController.unblockUser);

// other orperations

router.patch(
  "/changeOrderStatus",
  middleware.setNoCache,
  middleware.adminVerify,
  adminController.changeOrderStatus
);
router
  .route("/banner-creation")
  .get(
    middleware.setNoCache,
    middleware.adminVerify,
    adminController.bannerPage
  )
  .post(
    middleware.setNoCache,
    middleware.adminVerify,
    adminController.bannerCreation
  );

router.get(
  "/sales-report",
  middleware.setNoCache,
  middleware.adminVerify,
  adminController.salesReport
);

module.exports = router;
