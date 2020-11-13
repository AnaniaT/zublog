const Post = require("../models/post");

const postResolver = async (req, res, next) => {
  try {
    let postId = req.body.postId;
    if (postId === undefined) {
      postId = req.params.id;
    }
    const post = await Post.findById(postId);
    if (!post) {
      throw new Error("No such post");
    }
    req.post = post;
    next();
  } catch (e) {
    res.status(400).send();
  }
};

module.exports = postResolver;
