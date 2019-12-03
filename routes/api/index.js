const express = require('express');
const Post = require('../../models/post'); 
const Answer = require('../../models/answer'); 
const LikeLog = require('../../models/like-log'); 
const catchErrors = require('../../lib/async-error');

const router = express.Router();

router.use(catchErrors(async (req, res, next) => {
  if (req.isAuthenticated()) {
    next();
  } else {
    next({status: 401, msg: 'Unauthorized'});
  }
}));

router.use('/posts', require('./posts'));

// Like for Post
router.post('/posts/:id/like', catchErrors(async (req, res, next) => {
  const post = await Post.findById(req.params.id);
  if (!post) {
    return next({status: 404, msg: 'Not exist trip'});
  }
  var likeLog = await LikeLog.findOne({author: req.user._id, post: post._id});
  if (!likeLog) {
    post.numLikes++;
    await Promise.all([
      post.save(),
      LikeLog.create({author: req.user._id, post: post._id})
    ]);
  }
  return res.json(post);
}));

// Like for Answer
router.post('/answers/:id/like', catchErrors(async (req, res, next) => {
  const answer = await Answer.findById(req.params.id);
  answer.numLikes++;
  await answer.save();
  return res.json(answer);
}));

router.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.json({
    status: err.status,
    msg: err.msg || err
  });
});

module.exports = router;
