const express = require('express');
const Post = require('../../models/post');
const catchErrors = require('../../lib/async-error');


const router = express.Router();

// 동일한 코드가 users.js에도 있습니다. 이것은 나중에 수정합시다.
function needAuth(req, res, next) {
  if (req.session.user) {
    next();
  } else {
    req.flash('danger', 'Please signin first.');
    res.redirect('/signin');
  }
}

router.get('/new', needAuth, (req, res, next) => {
  res.render('posts/new', {post: {}});
});

router.get('/:id/edit', needAuth, catchErrors(async (req, res, next) => {
  const post = await Post.findById(req.params.id);
  res.render('posts/edit', {post: post});
}));

router.get('/:id', catchErrors(async (req, res, next) => {
  const post = await Post.findById(req.params.id);
  const comments = await Comment.find({post: post.id});
  await post.save();
  res.render('posts/show', {post: post, comments: comments});
}));

router.put('/:id', catchErrors(async (req, res, next) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    req.flash('danger', 'Not exist post');
    return res.redirect('back');
  }
  post.postName = req.body.postName;
  post.intro = req.body.intro;

  await post.save();
  req.flash('success', 'Successfully updated');
  res.redirect('/');
}));

router.delete('/:id', needAuth, catchErrors(async (req, res, next) => {
  await Post.findOneAndRemove({_id: req.params.id});
  req.flash('success', 'Successfully deleted');
  res.redirect('/');
}));

router.post('/', needAuth, catchErrors(async (req, res, next) => {
  const user = req.session.user;
  var post = new Post({
    postName: req.body.postName,
    intro: req.body.intro
  });
  await post.save();
  req.flash('success', 'Successfully posted');
  res.redirect('/');
}));



module.exports = router;
