const express = require('express');
const Post = require('../models/post');
// const User = require('../models/user'); 
const Answer = require('../models/answer'); 
const catchErrors = require('../lib/async-error');

const router = express.Router();

// 동일한 코드가 users.js에도 있습니다. 이것은 나중에 수정합시다.
function needAuth(req, res, next) {
  if (req.session.user) {
    next();
  } else {
    req.flash('danger', '회원가입을 먼저 해주세요.');
    res.redirect('/signin');
  }
}

/* GET Posts listing. */
router.get('/', catchErrors(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  var query = {};
  const term = req.query.term;
  if (term) {
    query = {$or: [
      {title: {'$regex': term, '$options': 'i'}},
      {content: {'$regex': term, '$options': 'i'}}
    ]};
  }
  const posts = await Post.paginate(query, {
    sort: {createdAt: -1}, 
    populate: 'author', 
    page: page, limit: limit
  });
  res.render('posts/index', {posts: posts, query: req.query});
}));

router.get('/new', needAuth, (req, res, next) => {
  res.render('posts/new', {post: {}});
});

router.get('/:id/edit', needAuth, catchErrors(async (req, res, next) => {
  const post = await Post.findById(req.params.id);
  res.render('posts/edit', {post: post});
}));

router.get('/:id', catchErrors(async (req, res, next) => {
  const post = await Post.findById(req.params.id).populate('author');
  const answers = await Answer.find({post: post.id}).populate('author');
  post.numReads++;    // TODO: 동일한 사람이 본 경우에 Read가 증가하지 않도록???
  await post.save();
  res.render('posts/show', {post: post, answers: answers});
}));

router.put('/:id', catchErrors(async (req, res, next) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    req.flash('danger', '게시글이 존재하지않습니다.');
    return res.redirect('back');
  }
  post.title = req.body.title;
  post.content = req.body.content;
  post.tags = req.body.tags.split(" ").map(e => e.trim());

  await post.save();
  req.flash('success', '성공적으로 수정되었습니다.');
  res.redirect('/posts');
}));

router.delete('/:id', needAuth, catchErrors(async (req, res, next) => {
  await Post.findOneAndRemove({_id: req.params.id});
  req.flash('success', '성공적으로 삭제되었습니다.');
  res.redirect('/posts');
}));

router.post('/', needAuth, catchErrors(async (req, res, next) => {
  const user = req.session.user;
  var post = new Post({
    title: req.body.title,
    author: user._id,
    content: req.body.content,
    tags: req.body.tags.split(" ").map(e => e.trim()),
  });
  await post.save();
  req.flash('success', '성공적으로 게시되었습니다.');
  res.redirect('/posts');
}));

router.post('/:id/answers', needAuth, catchErrors(async (req, res, next) => {
  const user = req.session.user;
  const post = await Post.findById(req.params.id);

  if (!post) {
    req.flash('danger', '게시글이 존재하지않습니다.');
    return res.redirect('back');
  }

  var answer = new Answer({
    author: user._id,
    post: post._id,
    content: req.body.content
  });
  await answer.save();
  post.numAnswers++;
  await post.save();

  req.flash('success', '성공적으로 댓글을 달았습니다.');
  res.redirect(`/posts/${req.params.id}`);
}));


module.exports = router;


