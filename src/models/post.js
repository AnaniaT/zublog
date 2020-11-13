const mongoose = require("mongoose");
const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      // maxlength: #some Limit,
      required: [true, "Title should be provided"],
    },
    body: {
      type: String,
      trim: true,
      required: [true, "Posts must have a content"],
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    likes: [String],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    // toObject: { virtuals: true },
  }
);

postSchema.virtual("comments", {
  ref: "Comment",
  localField: "_id",
  foreignField: "post",
});
const Post = mongoose.model("Post", postSchema);

module.exports = Post;
