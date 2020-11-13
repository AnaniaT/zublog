const express = require("express");
const multer = require("multer");
const sharp = require("sharp");
const validator = require("validator");
const pr = console.log;

const cookieAuth = require("../middlewares/cookieAuth");
const User = require("../models/user");
const Post = require("../models/post");

const router = new express.Router();

const findPosts = (searchObj, limit, skip) => {
  return Post.find(searchObj)
    .sort({ createdAt: -1 }) // desc
    .limit(limit) // yield the first 4
    .skip(skip) // docs to jump without selecting from top
    .populate({
      path: "author",
      select: "username avatar hasTick _id",
    })
    .populate("comments");
  // .execPopulate();
  // .exec()
};

router.get("/home", cookieAuth, async (req, res) => {
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

  const searchObj = req.query.q ? { title: new RegExp(req.query.q, "i") } : {};

  let postCount;
  await Post.countDocuments(searchObj, (err, count) => {
    if (err) {
      return console.log("Something went wrong");
    }
    postCount = count;
  });

  let publicPosts, paginationData;
  if (postCount > 0) {
    const limit = 4;
    let minPage = 1;
    let maxPage = Math.ceil(postCount / limit);
    let page = Math.floor(Math.abs(+req.query.page)) || 1;
    if (page < minPage) {
      page = minPage;
    } else if (page > maxPage) {
      page = maxPage;
    }
    // You could do something special to make the best blogs up first
    const skip = (page - 1) * limit;

    publicPosts = await findPosts(searchObj, limit, skip);
    let nextPage;
    if (page >= minPage && page < maxPage) {
      nextPage = page + 1;
    }
    let prevPage;
    if (page > minPage && page <= maxPage) {
      prevPage = page - 1;
    }
    paginationData = {
      page,
      minPage,
      maxPage,
      nextPage,
      prevPage,
      searchInfo: req.query.q,
    };
  }

  let context = {
    user: req.user.getPublicData(),
    userPosts: req.user.posts,
    publicPosts,
    paginationData,
  };

  if (req.query.q) {
    context["searchpage"] = "active";
  } else {
    context["homepage"] = "active";
  }
  res.render("home", context);
});

router.get("/account/setting", cookieAuth, (req, res) => {
  // res.clearCookie("signal");
  res.render("acc_setting", {
    user: req.user.getPublicData(),
  });
});

router.post("/account/setting", cookieAuth, async (req, res) => {
  const allowedFields = ["username", "email"];
  const updateKeys = Object.keys(req.body);
  const isValidOpration = updateKeys.every((key) =>
    allowedFields.includes(key)
  );
  if (!isValidOpration) {
    return res.status(400).render("400html", { url: req.path });
  }

  updateKeys.forEach((key) => (req.user[key] = req.body[key]));
  await req.user.save();
  res.send();
});

router.post("/account/setting/social", cookieAuth, async (req, res) => {
  const allowedFields = ["telegram", "instagram", "facebook"];
  const updateKeys = Object.keys(req.body);
  const isValidOpration = updateKeys.every((key) =>
    allowedFields.includes(key)
  );
  if (!isValidOpration) {
    return res.status(400).render("400html", { url: req.path });
  }
  updateKeys.forEach((key) => (req.user.social[key] = req.body[key]));
  await req.user.save();
  res.send();
});

router.post("/account/setting/resetpassword", cookieAuth, async (req, res) => {
  const allowedFields = ["password", "newPassword", "confirmPassword"];
  const updateKeys = Object.keys(req.body);
  const isValidOpration = updateKeys.every((key) =>
    allowedFields.includes(key)
  );
  if (!isValidOpration) {
    return res.status(400).render("400html", { url: req.path });
  }

  if (!req.body.newPassword === req.body.confirmPassword) {
    return res.status(400).send({ error: "Passwords do not match" });
  }

  let user;
  try {
    user = await User.findByCredentials(req.user.username, req.body.password);
  } catch {
    return res.status(400).send({ error: "Incorrect Old password" });
  }
  user.password = req.body.newPassword;
  await user.save();
  res.send();
});

router.post("/account/checkup", cookieAuth, async (req, res) => {
  const username = req.body.username;
  const email = req.body.email;
  const password = req.body.password;
  let user;
  if (username || email) {
    if (username) {
      if (!/^[A-Za-z][A-Za-z0-9_.]{6,20}$/.test(username.trim())) {
        return res.status(400).send();
      }
      user = await User.findOne({ username });
    } else {
      if (!validator.isEmail(email)) {
        return res.status(400).send();
      }
      user = await User.findOne({ email });
    }
    if (!user) {
      return res.send();
    }
    return res.status(400).send();
  }
  if (password) {
    try {
      user = await User.findByCredentials(req.user.username, password);
    } catch {
      return res.status(400).send();
    }
    return res.send();
  }
  return res.status(400).send("400html", { url: req.path });
});

const avatar = multer({
  limits: {
    fileSize: 2500000, // about < 2.5 MB
  },
  fileFilter(req, file, callback) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return callback(new Error("File not supported"));
    }
    callback(undefined, true);
  },
});

router.post(
  "/account/avatar",
  cookieAuth,
  avatar.single("avatar"),
  async (req, res) => {
    const buffer = await sharp(req.file.buffer)
      .resize({
        width: 300,
        height: 300,
        withoutEnlargement: true,
        background: { r: 255, g: 255, b: 255, alpha: 0.5 },
      })
      .png()
      .toBuffer();
    req.user.avatar = buffer;
    await req.user.save();
    res.send(req.user.avatar);
  },
  (error, req, res, next) => {
    res.status(400).send({ error: error.message });
  }
);

router.get("/account/avatar", cookieAuth, async (req, res) => {
  if (req.user.avatar) {
    res.set("Content-Type", "image/png");
    return res.send(req.user.avatar);
  }
  res.status(404).send("No Avatar");
});

router.delete("/account/avatar", cookieAuth, async (req, res) => {
  if (req.user.avatar) {
    req.user.avatar = undefined;
    await req.user.save();
    return res.send("Avatar Deleted");
  }
  res.status(404).send("No Avatar");
});

router.get("/account/avatar/:id", cookieAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      throw new Error();
    }
    res.set("Content-Type", "image/png");
    return res.send(user.avatar);
  } catch {
    res.status(400).render("400html", { url: req.path });
  }
});

module.exports = router;
