const express = require("express");
const cookieAuth = require("../middlewares/cookieAuth");

const router = new express.Router();

router.get("/about", cookieAuth, (req, res) => {
  res.render("about", { username: req.user.username, aboutpage: "active" });
});

router.get("/account/me", cookieAuth, async (req, res) => {
  await req.user
    .populate({
      path: "posts",
      options: {
        sort: {
          createdAt: -1, // desc
        },
      },
    })
    .execPopulate();

  res.render("account", {
    user: req.user.getPublicData(),
    accountpage: "active",
    userPosts: req.user.posts,
  });
});
module.exports = router;
