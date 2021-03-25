const express = require('express');
const hbs = require('hbs');
const fs = require('fs');

const cookieAuth = require('../middlewares/cookieAuth');
const Comment = require('../models/comment');
const postResolver = require('../middlewares/postResolver');
const Post = require('../models/post');

const router = new express.Router();

const emitSocketData = async (req, postId) => {
  const post = await Post.findById(postId);
  await post.populate('comments').execPopulate();

  const io = req.app.get('socketio');
  io.emit('numsChanged-' + postId, {
    type: 'comment',
    countNum: post.toJSON().comments.length,
  });
};

const emitCommentsData = async (req, postInstance) => {
  const post = await postInstance
    .populate({
      path: 'comments',
      populate: [
        {
          path: 'author',
          select: '_id username avatar hasTick',
        },
        {
          path: 'post',
          select: '_id author',
        },
      ],
      options: {
        sort: {
          createdAt: -1, // desc
        },
      },
    })
    .execPopulate();
  const numOfLikes = postInstance.likes.length;
  const comments = post.toJSON().comments;
  const hbsString = fs.readFileSync('./templates/partials/comment_card.hbs');
  const template = hbs.handlebars.compile(hbsString.toString());
  let result = '';
  for (let comment of comments) {
    const data = template(
      {
        user: { _id: req.user._id },
        ...comment,
      },
      {
        allowProtoPropertiesByDefault: true,
      }
    );
    result += data;
  }
  const io = req.app.get('socketio');
  io.emit(`commentUpdate-${postInstance._id}`, {
    numOfLikes,
    numOfComments: comments.length,
    result,
  });
};

router.post('/write/comment', cookieAuth, postResolver, async (req, res) => {
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

  if (!error) {
    await emitSocketData(req, req.post._id);
    await emitCommentsData(req, req.post);
    res.send();
  }
  return res.status(400).send();
});

router.delete('/delete/comment', cookieAuth, async (req, res) => {
  try {
    const comment = await Comment.findById(req.body.commentId);
    await comment.populate('post').execPopulate();
    // Only allow post onwners and comment owner
    const allowedUsers = [
      comment.post.author.toString(),
      comment.author.toString(),
    ];
    if (allowedUsers.includes(req.user._id.toString())) {
      await comment.remove();
      await emitSocketData(req, comment.post._id);
      await emitCommentsData(req, comment.post);
      return res.send();
    }
    res.status(401).send();
  } catch (e) {
    console.log(e);
    res.status(400).send();
  }
});

router.get('/get/comments/:id', cookieAuth, postResolver, async (req, res) => {
  const post = await req.post
    .populate({
      path: 'comments',
      populate: [
        {
          path: 'author',
          select: '_id username avatar hasTick',
        },
        {
          path: 'post',
          select: '_id author',
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
    'component', // template
    { partial1: true, comments, user: { _id: req.user._id } }, // context for template
    {
      // the json data
      numOfLikes,
      numOfComments: comments.length,
    }
  );
});

module.exports = router;
