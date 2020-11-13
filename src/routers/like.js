const express = require("express");

const cookieAuth = require("../middlewares/cookieAuth");
const Post = require("../models/post");
const postResolver = require("../middlewares/postResolver");

const router = new express.Router();

// router.get("/:id/likes", cookieAuth, postResolver, async (req, res) => {
//   res.send({ likes: req.post.likes.length });
// });

router.post("/:id/likes", cookieAuth, postResolver, async (req, res) => {
  const id = req.user._id.toString();
  const isAlreadyLiked = req.post.likes.includes(id);
  if (isAlreadyLiked) {
    req.post.likes = req.post.likes.filter((_id) => _id !== id);
  } else {
    req.post.likes.push(id);
  }
  // wont update the timestamp since this aint edited by the owner
  await req.post.save({ timestamps: false });
  res.send({
    likes: req.post.likes.length,
    hasLiked: req.post.likes.includes(id),
  });
});

// router.delete("/:id/likes", cookieAuth, postResolver, async (req, res) => {
//   await req.post.save()
//   res.send();
// });

module.exports = router;