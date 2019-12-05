const express = require('express');
const Post = require('../../models/post');
const catchErrors = require('../../lib/async-error');

const router = express.Router();



// Index
router.get('/', catchErrors(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  const posts = await Post.paginate({}, {
    sort: {createdAt: -1}, 
    populate: 'author',
    page: page, limit: limit
  });
  res.json({posts: posts.docs, page: posts.page, pages: posts.pages});   
}));

// Read
router.get('/:id', catchErrors(async (req, res, next) => {
  const post = await Post.findById(req.params.id).populate('author');
  res.json(post);
}));

// Create
router.post('', catchErrors(async (req, res, next) => {
  var post = new Post({
    title: req.body.title,
    author: req.user._id,
    content: req.body.content,
    
  });
  await post.save();
  res.json(post)
}));

// Put
router.put('/:id', catchErrors(async (req, res, next) => {
  const post = await Post.findById(req.params.id);
  if (!post) {
    return next({status: 404, msg: 'Not exist trip'});
  }
  if (post.author && post.author._id != req.user._id) {
    return next({status: 403, msg: 'Cannot update'});
  }
  post.title = req.body.title;
  post.content = req.body.content;
 
  await post.save();
  res.json(post);
}));

// Delete
router.delete('/:id', catchErrors(async (req, res, next) => {
  const post = await Post.findById(req.params.id);
  if (!post) {
    return next({status: 404, msg: 'Not exist trip'});
  }
  if (post.author && post.author._id != req.user._id) {
    return next({status: 403, msg: 'Cannot update'});
  }
  await Post.findOneAndRemove({_id: req.params.id});
  res.json({msg: 'deleted'});
}));



module.exports = router;