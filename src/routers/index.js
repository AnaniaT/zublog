const express = require("express");
const jwt = require("jsonwebtoken");

const User = require("../models/user");
const cookieAuth = require("../middlewares/cookieAuth");
const autoLogger = require("../middlewares/autoLogger");
const {
  sendVerificationEmail,
  sendWelcomeEmail,
} = require("../emails/account");
const pr = console.log;

const router = new express.Router();

router.get("/", autoLogger, (req, res) => {
  if (req.cookies.failedSignUpRedirect) {
    const { userData, errMsg } = req.cookies.failData;
    res.clearCookie("failData");
    res.clearCookie("failedSignUpRedirect");
    return res.render("index", {
      activeForm: "right-panel-active",
      signupMsg: errMsg,
      newUser: userData,
      loginmsgClass: "invisible",
    });
  }

  if (req.cookies.goodSignUpRedirect) {
    const { email } = req.cookies.goodData;
    res.clearCookie("goodData");
    res.clearCookie("goodSignUpRedirect");
    return res.render("index", {
      activeForm: "right-panel-active",
      signupMsg: "Account created successfuly",
      modalDisplay: "checked",
      email,
      signupmsgClass: "good",
      loginmsgClass: "invisible",
    });
  }

  if (req.cookies.failedLoginRedirect) {
    const { userData, errMsg } = req.cookies.failData;
    res.clearCookie("failData");
    res.clearCookie("failedLoginRedirect");
    return res.render("index", {
      loginMsg: errMsg,
      user: userData,
      signupmsgClass: "invisible",
    });
  }
  res.render("index", {
    loginmsgClass: "invisible",
    signupmsgClass: "invisible",
  });
});

router.post("/signup", async (req, res) => {
  const allowedFields = ["username", "email", "password", "confirmPassword"];

  // make sure all fields exist
  for (let field of allowedFields) {
    if (req.body[field] === undefined) {
      return res.status(400).render("400html", { url: req.path });
    }
  }
  // prevent additional data from comming in
  const dataKeys = Object.keys(req.body);
  const isValidOpration = dataKeys.every((key) => allowedFields.includes(key));
  if (!isValidOpration) {
    return res.status(400).render("400html", {
      url: req.path,
    });
  }

  // check if password is confirmed
  if (req.body.confirmPassword === "") {
    res.cookie("failedSignUpRedirect", true);
    res.cookie("failData", {
      userData: req.body,
      errMsg: "Please confirm your password",
    });
    return res.redirect("/");
  }
  if (req.body.password !== req.body.confirmPassword) {
    res.cookie("failedSignUpRedirect", true);
    res.cookie("failData", {
      userData: req.body,
      errMsg: "Passwords do not match",
    });
    return res.redirect("/");
  }

  const user = new User({ ...req.body, active: false, social: {} });
  let error;
  await user.save().catch((err) => {
    if (err.errors !== undefined) {
      // other validation errors go here
      const firstErrField = Object.keys(err.errors)[0];
      error = err.errors[firstErrField].message;
    } else {
      // unique errors go here
      error = err.message;
    }
  });

  if (error) {
    res.cookie("failedSignUpRedirect", true);
    res.cookie("failData", {
      userData: req.body,
      errMsg: error,
    });
    return res.redirect("/");
  }

  // toggle a modal popup
  res.cookie("goodSignUpRedirect", true);
  res.cookie("goodData", { email: user.email });

  // send email with some identification
  const token = jwt.sign({ id: user._id }, "thisIsAJWTSecret");
  const verifyLink =
    req.protocol + "://" + req.get("host") + "/account/verify/email/" + token;
  // sendVerificationEmail(user.email, user.username, verifyLink);
  return res.redirect("/");
});

router.post("/login", async (req, res) => {
  let user;
  try {
    user = await User.findByCredentials(req.body.username, req.body.password);
  } catch (err) {
    res.cookie("failedLoginRedirect", true);
    res.cookie("failData", {
      userData: req.body,
      errMsg: err.message,
    });
    return res.redirect("/");
  }
  const token = await user.generateAuthToken();
  res.cookie("_Oth", token);
  res.redirect("/home");
});

router.get("/logout", cookieAuth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter(
      (tokenObj) => tokenObj.token !== req.token
    );
    await req.user.save();
  } catch {}
  res.clearCookie("_Oth");
  res.redirect("/");
});

router.get("/logoutAll", cookieAuth, async (req, res) => {
  try {
    req.user.tokens = [];
    await req.user.save();
  } catch {}
  res.redirect("/");
});

router.get("/account/verify/email/:token", async (req, res) => {
  const token = req.params.token;
  try {
    const decoded = jwt.verify(token, "thisIsAJWTSecret");
    const user = await User.findOne({
      _id: decoded.id,
      active: false,
    });
    user.active = true;
    await user.save();
    const tok = await user.generateAuthToken();
    // sendWelcomeEmail(user.email, user.username);
    res.cookie("_Oth", tok);
    res.redirect("/home");
  } catch (e) {
    res.status(400).send();
  }
});

router.get("/forgotpassword", async (req, res) => {
  let data = {
    displayClass: "invisible",
  };
  if (req.cookies.failData) {
    data["user"] = req.cookies.failData;
    data["msg"] = req.cookies.failMsg;
    data["displayClass"] = "";
    res.clearCookie("failData");
    res.clearCookie("failMsg");
  } else if (req.cookies.goodData) {
    data["user"] = req.cookies.goodData;
    data["msg"] = req.cookies.goodMsg;
    data["displayClass"] = "good";
    res.clearCookie("goodData");
    res.clearCookie("goodMsg");
  }
  res.render("forgotpassword", data);
});

// router.post("/forgotpassword", async (req, res) => {
//   const allowedFields = ["username", "email"];
//   const updateFields = Object.keys(req.body);
//   const isValidOpration = updateFields.every((key) =>
//     allowedFields.includes(key)
//   );

//   if (!isValidOpration) {
//     return res.status(400).render("400html", { url: req.path });
//   }

//   const user = await User.findOne({
//     username: req.body.username,
//     email: req.body.email,
//   });
//   if (!user) {
//     res.cookie("failData", req.body);
//     res.cookie("failMsg", "Couldn't find you");
//     return res.redirect("/forgotpassword");
//   }

//   res.cookie("goodData", req.body);
//   res.cookie("goodMsg", "I gotcha, " + user.username);
//   res.redirect("/forgotpassword");
// });

module.exports = router;
