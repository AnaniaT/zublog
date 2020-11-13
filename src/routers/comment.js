const express = require("express");

const cookieAuth = require("../middlewares/cookieAuth");
const Post = require("../models/post");
const Comment = require("../models/comment");
const postResolver = require("../middlewares/postResolver");

const router = new express.Router();

router.post("/write/comment", cookieAuth, postResolver, async (req, res) => {
  const comment = new Comment({
    body: req.body.comment,
    post: req.post._id,
    author: req.user._id,
  });

  let error;
  await comment.save().catch((err) => {
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
    return res.status(400).send();
  }
  res.send();
});

router.get("/get/comments/:id", cookieAuth, postResolver, async (req, res) => {
  const post = await req.post
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
  const numOfLikes = req.post.likes.length;
  const comments = post.toJSON().comments;
  // respose will be a json like { view: myHTML(after using its context), ...myOtherDatasToBeSent}
  res.renderWithData(
    "component", // template
    { partial1: true, comments, user: { _id: req.user._id } }, // context
    {
      numOfLikes,
      numOfComments: comments.length,
    }
  );
});

router.delete("/delete/comment", cookieAuth, async (req, res) => {
  try {
    const comment = await Comment.findById(req.body.commentId);
    await comment.populate("post").execPopulate();
    // Only allow post onwners and comment owner
    const allowedUsers = [
      comment.post.author.toString(),
      comment.author.toString(),
    ];
    if (allowedUsers.includes(req.user._id.toString())) {
      await comment.remove();
      return res.send();
    }
    res.status(401).send();
  } catch (e) {
    res.status(400).send();
  }
});

module.exports = router;
