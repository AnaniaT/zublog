const mongoose = require("mongoose");
const commentSchema = new mongoose.Schema(
  {
    body: {
      type: String,
      required: [true, "Comment can't be empty"],
      trim: true,
      maxlength: [743, "Comment too long"],
    },
    post: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Post",
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

const Comment = mongoose.model("Comment", commentSchema);
module.exports = Comment;
