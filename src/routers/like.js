const express = require("express");

const cookieAuth = require("../middlewares/cookieAuth");
const postResolver = require("../middlewares/postResolver");

const router = new express.Router();

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

  // Emit socket update
  const io = req.app.get("socketio");
  io.emit("numsChanged", {
    type: "like",
    postId: req.post._id,
    countNum: req.post.likes.length,
  });

  res.send({
    likes: req.post.likes.length,
    hasLiked: req.post.likes.includes(id),
  });
});

module.exports = router;
