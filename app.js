var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
const bcrypt = require("bcryptjs");
// const dotenv = require("dotenv")
const session = require("express-session");
var indexRouter = require("./routes/index");
var adminRouter = require("./routes/admin");
const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");
const hbs = require("hbs");
const app = express();
const dotenv=require('dotenv')
dotenv.config({path:'./.env'});

// var hbs = require('express-handlebars')
const multer = require("multer");

// const uri = require('./public/partials/uri');
const db = process.env.DATABASE_LOCAL;
mongoose
  .connect(db,
    {
      useNewUrlParser:true,
      useUnifiedTopology:true,
    })
  .then(() => {
    console.log("mongodb connected");
  })
  .catch(() => console.log("failed"));


  // Set the view engine
  app.set('view engine', 'hbs');
  
  // Set the views directory
  app.set('views', path.join(__dirname, 'views'));
  
  // Register the admin partials
  hbs.registerPartials(path.join(__dirname, 'views', 'admin', 'partials'));
  
  // Register the user partials
  hbs.registerPartials(path.join(__dirname, 'views', 'user', 'partials'));



// app.set("views", path.join(__dirname, "views"));
// app.set("partials", path.join(__dirname, "views", "partials"));
// app.set("view engine", "hbs");

// // Register partials directory
// hbs.registerPartials(path.join(__dirname, "views", "partials"));

hbs.registerHelper("range", function (start, end) {
  const result = [];
  for (let i = start; i <= end; i++) {
    result.push(i);
  }
  return result;
});

hbs.registerHelper("ifCond", function (v1, v2, options) {
  if (v1 === v2) {
    return options.fn(this);
  }
  return options.inverse(this);
});
hbs.registerHelper("ifAnyMatch", function (value, ...args) {
  const options = args.pop();
  if (args.includes(value)) {
    return options.fn(this);
  }
  return options.inverse(this);  
});
hbs.registerHelper("multiply", function (a, b) {
  return a * b;
});
hbs.registerHelper("dateFormat", function (timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  });
});
hbs.registerHelper("getStatusIcon", function(status) {
  // Return the corresponding icon class based on the status value
  if (status === "Confirmed") {
      return "check";
  } else if (status === "Shipped") {
      return "user";
  } else if (status === "Out for Delivery") {
      return "truck";
  } else if (status === "Delivered") {
      return "box";
  }
});


// Define the eq helper function
// hbs.handlebars.registerHelper("eq", function (a, b, options) {
//   return a === b ? options.fn(this) : options.inverse(this);
// });

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
// app.use('/connect',express.static(path.join(__dirname, 'public/partials')));

// app.use(('photos',express.static(path.join(__dirname,'/public/images'))))
app.use("/assets", express.static(path.join(__dirname, "public/user-assets/")));
// app.use('/assets-ad',express.static(path.join(__dirname,'public/admin-assets/')))

app.use(
  session({
    secret: uuidv4(),
    resave: false,
    saveUninitialized: true,
  })
);

app.use((req, res, next) => {
  res.locals.message = req.session.message;
  delete req.session.message;
  next();
});
app.use("/", indexRouter);
app.use("/admin", adminRouter);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/uploads");
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;