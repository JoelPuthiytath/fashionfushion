const { check, validationResult } = require("express-validator");

const userVerify = (req, res, next) => {
  if (req.session.user) {
    next();
  } else {
    res.redirect("/user-login");
  }
};
const adminVerify = (req, res, next) => {
  if (req.session.admin) {
    next();
  } else {
    res.redirect("/admin/login");
  }
};

const setNoCache = (req, res, next) => {
  res.setHeader("cache-control", "no-store");
  next();
};

module.exports = {
  userVerify,
  setNoCache,
  adminVerify,
};
