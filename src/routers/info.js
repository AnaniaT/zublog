const express = require("express");
const cookieAuth = require("../middlewares/cookieAuth");

const router = new express.Router();

router.get("/about", cookieAuth, (req, res) => {
  res.render("about", { username: req.user.username, aboutpage: "active" });
});

module.exports = router;
