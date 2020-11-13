const express = require("express");
const path = require("path");
const hbs = require("hbs");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
// const multer = require("multer");
// const session = require("express-session");
const infoRouter = require("./routers/info");
const indexRouter = require("./routers/index");
const userRouter = require("./routers/user");
const postRouter = require("./routers/post");
const commentRouter = require("./routers/comment");
const likeRouter = require("./routers/like");
const User = require("./models/user");

require("./db/connector"); // Connects to db
const app = express();

const staticFolder = path.join(__dirname, "../static");
const viewsFolder = path.join(__dirname, "../templates/views");
const partialsFolder = path.join(__dirname, "../templates/partials");

const sessionSecret = "sjdkhs73unj*&$Bkjsd%^(Hj)(S^&%bhjsdkd";

// View setup
app.set("view engine", "hbs");
app.set("views", viewsFolder);
hbs.registerPartials(partialsFolder);
hbs.registerHelper("toDateString", function (dateString) {
  const date = new Date(dateString);
  const differenceInMs = Math.abs(new Date() - date);
  const sec = Math.floor(differenceInMs / 1000);
  if (sec <= 60) {
    return "just now";
  }
  const min = Math.floor(sec / 60);
  if (min < 60) {
    return `${min} minute${min <= 1 ? "" : "s"} ago`;
  }
  const hr = Math.floor(min / 60);
  if (hr < 24) {
    return `${hr} hour${hr <= 1 ? "" : "s"} ago`;
  }
  return "on " + date.toDateString();
});
hbs.registerHelper("if_notEqual", function (var1, var2, opts) {
  return String(var1) === String(var2) ? opts.inverse(this) : opts.fn(this); // excute the main block
});
hbs.registerHelper("if_Equal", function (arg1, arg2, options) {
  return String(arg1) === String(arg2)
    ? options.fn(this)
    : options.inverse(this);
});
hbs.registerHelper("if_notAll", function (obj, opts) {
  // this check if the values in an object are all empty strings
  const dataKeys = Object.keys(obj);
  const isEveryValueEmpty = dataKeys.every((key) => {
    if (key !== "$init") {
      return obj[key] === "" || obj[key] === undefined;
    }
    return true;
  });
  if (isEveryValueEmpty) {
    return opts.fn(this);
  }
  return opts.inverse(this);
});

hbs.registerHelper("if_in", function (array, item, opts) {
  if (array.includes(item)) {
    return opts.fn(this);
  }
  return opts.inverse(this);
});
hbs.registerHelper("include", function (options) {
  var context = {},
    mergeContext = function (obj) {
      for (var k in obj) context[k] = obj[k];
    };
  mergeContext(this);
  mergeContext(options.hash);
  return options.fn(context);
});

// Static files
app.use(express.static(staticFolder));

// register body parser middleware to get all post data
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());

app.use(function (req, res, next) {
  res.renderWithData = function (view, model, data) {
    res.render(view, model, function (err, viewString) {
      // the template is compiled and sent as json thru the view key along with the object passed
      res.json({ ...data, view: viewString });
    });
  };
  next();
});

// register session
// app.use(
//   session({ secret: sessionSecret, resave: false, saveUninitialized: false })
// );

app.use(cookieParser());
// Routers
app.use(indexRouter);
app.use(infoRouter);
app.use(userRouter);
app.use(postRouter);
app.use(commentRouter);
app.use(likeRouter);

app.get("**", (req, res) => {
  res.status(404).render("400html", { url: req.path });
});

module.exports = app;
