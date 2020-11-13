const express = require("express");

const cookieAuth = require("../middlewares/cookieAuth");
const Post = require("../models/post");

const router = new express.Router();

router.get("/posts", cookieAuth, async (req, res) => {
  const postId = req.query.post;
  let post = {};
  if (postId) {
    try {
      post = await Post.findById(postId);
      if (!post) {
        throw new Error();
      }
    } catch (e) {
      return res.status(400).render("400html", { url: req.path });
    }
  }
  res.render("add_post", post);
});

router.post("/posts", cookieAuth, async (req, res) => {
  const allowedFields = ["title", "body", "postId"];
  const updateKeys = Object.keys(req.body);
  const isValidOpration = updateKeys.every((key) =>
    allowedFields.includes(key)
  );

  if (!isValidOpration) {
    return res.status(400).render("400html", { url: req.path });
  }

  if (req.body.postId) {
    try {
      const post = await Post.findById(req.body.postId);
      if (!post) {
        throw new Error();
      }
      // updateKeys.forEach((key) => (post[key] = req.body[key]));
      post.title = req.body.title;
      post.body = req.body.body;
      let error;
      await post.save().catch((err) => {
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
        return res.render("add_post", {
          ...req.body,
          msg: { text: error, cls: "bad" },
        });
      }
      return res.redirect("/");
    } catch (e) {
      return res.status(400).render("400html", { url: req.path });
    }
  }

  const post = new Post({
    ...req.body,
    author: req.user._id,
  });

  let error;
  await post.save().catch((err) => {
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
    return res.render("add_post", {
      ...req.body,
      msg: { text: error, cls: "bad" },
    });
  }

  return res.status(201).redirect("/");
});

router.delete("/posts", cookieAuth, async (req, res) => {
  try {
    const post = await Post.findByIdAndDelete(req.body.id);
    if (!post) {
      throw new Error();
    }
    res.send({ title: post.title });
  } catch (e) {
    res.status(400).send();
  }
});

router.get("/posts/:id", cookieAuth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      throw new Error();
    }
    await post
      .populate({
        path: "author",
        select: "_id username avatar hasTick social",
      })
      .populate({
        path: "comments",
        populate: [
          {
            path: "author",
            select: "_id username avatar hasTick",
          },
          {
            path: "post",
            select: "_id author",
          },
        ],
        options: {
          sort: {
            createdAt: -1, // desc
          },
        },
      })
      .execPopulate();
    res.render("view_post", { post, user: req.user.getPublicData() });
  } catch (e) {
    res.render("400html", { url: req.path });
  }
});

module.exports = router;
