var express = require("express");
var router = express.Router();
const { check, validationResult } = require("express-validator");
const app = express();
const userHelper = require("../helpers/userHelper");
const { json } = require("body-parser");
const { AwInstsance } = require("twilio/lib/rest/accounts/v1/credential/aws");
const userController = require("../controllers/userController");
const middleware = require("../middleware/authentication");


//  user login , signUp and logout
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
router
  .route("/user-signup")
  .get(middleware.setNoCache, userController.signupPage)
  .post(
    middleware.setNoCache,
    [
      check("username").notEmpty().withMessage("Name is required"),
      check("phoneNumber")
        .isLength({ max: 10 })
        .withMessage("Mobile number should not exceed 10 digits"),
      check("email").isEmail().withMessage("Invalid email address"),
      check("password")
        .isLength({ min: 8 })
        .withMessage("Password must be at least 8 characters long."),
    ],
    userController.signupPagePost
  );

router
  .route("/user-login")
  .get(middleware.setNoCache, userController.loginPage)
  .post(
    middleware.setNoCache,
    [
      check("email")
        .notEmpty()
        .withMessage("Email is required")
        .isEmail()
        .withMessage("Invalid email address"),
      check("password")
        .isLength({ min: 8 })
        .withMessage("Password must be at least 8 characters long."),
    ],
    userHelper.userLogin
  );
  router.get("/user-logout", userController.userLogout);


  //  otp verification

router
  .route("/otp-verification")
  .get(middleware.setNoCache, userController.otpPage)
  .post(middleware.setNoCache, userController.otpPagePost);

router
  .route("/verification-page")
  .get(middleware.setNoCache, userController.verifyOtpPage)
  .post(middleware.setNoCache, userController.verifyOtpPagePost);


// Home page and other similar pages

router.get("/", middleware.setNoCache, userController.homePage);

router.get("/shop", middleware.setNoCache, userController.shopPage);

router.get("/product-view", middleware.setNoCache, userController.productView);


// add to cart and wishlist

router.put(
  "/add-to-cart",
  middleware.setNoCache,middleware.userVerify,
  userController.addToCart
);
router.post(
  "/add-to-wishList",
  middleware.setNoCache,
  middleware.userVerify,
  userController.addToWishList
);
router.get(
  "/wishlist-page",
  middleware.setNoCache,
  middleware.userVerify,
  userController.wishListPage
);

router.post(
  "/change-product-quantity",
  middleware.setNoCache,
  userController.changeQuantity
);

router.get(
  "/viewcart",
  middleware.setNoCache,
  middleware.userVerify,
  userController.cartView
);

router.post(
  "/cart-product-remove",
  middleware.userVerify,
  userController.cartProductRemove
);
router.post(
  "/wishlist-item-remove",
  middleware.userVerify,
  userController.removeFromWishlist
);




//  Order details and order operations

router.get(
  "/place-order",
  middleware.setNoCache,
  middleware.userVerify,
  userController.checkOutPage
);
router.post("/place-order", middleware.setNoCache, userController.orderPlace);

router.post(
  "/verify-payment",
  middleware.setNoCache,
  userController.paymentVerifycation
);

router.get(
  "/order-success-page",
  middleware.setNoCache,
  middleware.userVerify,
  userController.orderSuccessPage
);

router.get(
  "/order-history",
  middleware.setNoCache,
  middleware.userVerify,
  userController.orderHistory
);
router.get(
  "/view-order-details",
  middleware.setNoCache,
  middleware.userVerify,
  userController.viewOrderPage
);

router.patch("/cancel-order", userController.orderCancel);

router.patch("/return-order", userController.orderReturn);

// ######################################



// profile page settings and functionality

router.get(
  "/profile-view",
  middleware.setNoCache,
  middleware.userVerify,
  userController.profileView
);

router.post(
  "/upload-profile-photo",
  middleware.userVerify,
  userHelper.changeProfilePhoto
);

router.post(
  "/add-shopping-address",
  middleware.userVerify,
  middleware.setNoCache,
  userController.shoppingAddress
);

router
  .route("/edit-shipping-address")
  .get(
    middleware.setNoCache,
    middleware.userVerify,
    userController.editShippingAddress
  )
  .put(
    middleware.setNoCache,
    middleware.userVerify,
    userController.editshippingAddressPost
  );

  router.put(
    "/shipping-address-delete",
    middleware.userVerify,
    userHelper.deleteShippingAddress
  );
  
  router.post(
    "/track-order",
    middleware.setNoCache,
    middleware.userVerify,
    userController.orderTracking
  );


// select copon 

router.post(
  "/select-coupon",
  middleware.setNoCache,
  middleware.userVerify,
  userController.couponSelect
);



// router.get("/", middleware.userVerify, userController.searchOperation);

module.exports = router;
