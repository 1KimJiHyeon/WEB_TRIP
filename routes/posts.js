const express = require('express');
const Post = require('../models/post');
const Answer = require('../models/answer'); 
const catchErrors = require('../lib/async-error');

// 추가 - multer middleware
const multer = require('multer');
const fs = require('fs-extra');
const path = require('path');


module.exports = io => {
  const router = express.Router();
  
  // // 동일한 코드가 users.js에도 있습니다. 이것은 나중에 수정합시다.
  // function needAuth(req, res, next) {
  //   if (req.isAuthenticated()) {
  //     next();
  //   } else {
  //     req.flash('danger', 'Please signin first.');
  //     res.redirect('/signin');
  //   }
  // }

async function needAuth(req, res, next) {
  try {
    if (req.isAuthenticated()) {
      console.log(req.user)
      if(req.user.userMode == "가이드"){
        req.flash('success', 'welcome!');
        next();
      } else {
        req.flash('danger', '가이드 모드로 다시 로그인해주세요');
        res.redirect('/signin');
      }
    } else {
      req.flash('danger', '로그인이 필요한 서비스입니다');
      res.redirect('/signin');
    }
  } catch(err){
    console.log(err);
  }
}


  /* GET posts listing. */
  router.get('/',catchErrors(async (req, res, next) => {
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
    res.render('posts/index', {posts: posts, term: term, query: req.query});
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
      req.flash('danger', 'Not exist post');
      return res.redirect('back');
    }
    post.title = req.body.title;
    post.content = req.body.content;

    // 추가
    
    post.field = req.body.field;
    post.price = req.body.price;
    post.course1 = req.body.course1;
    post.course2 = req.body.course2;
    post.course3 = req.body.course3;
    post.manager = req.body.manager;
    

    // 옵션 선택
    post.radio = req.body.radio;

    // 포스터 등록 
    post.poster = req.body.poster;

    post.tags = req.body.tags.split(" ").map(e => e.trim());

    await post.save();
    req.flash('success', 'Successfully updated');
    res.redirect('/posts');
  }));

  router.delete('/:id', needAuth, catchErrors(async (req, res, next) => {
    await Post.findOneAndRemove({_id: req.params.id});
    req.flash('success', 'Successfully deleted');
    res.redirect('/posts');
  }));


  // 추가 - multer middleware 
  const mimetypes = {
    "image/jpeg" : "jpg",
    "image/gif" : "gif",
    "image/png" : "png"
  };
  const upload = multer({
    dest:'tmp',
    fileFilter:(req, file, cb) => {
      var ext = mimetypes[file.mimetype];
      if(!ext) {
        return cb(new Error('Only image files are allowed!'), false);
      }
      cb(null, true);
    }
  });


 


  // 추가 - 이미지 등록 
  router.post('/', needAuth, 
        upload.single('img'), // img 라는 필드를 req.file 로 저장
        catchErrors(async (req, res, next) => {
      var post = new Post({
        title: req.body.title,
        author: req.user._id,
        content: req.body.content,

        // 추가
        
        field : req.body.field,
        price : req.body.price,
        course1 : req.body.course1,
        course2 : req.body.course2,
        course3 : req.body.course3,
        manager : req.body.manager,
        

        // 옵션 추가
        radio : req.body.radio,

        tags: req.body.tags.split(" ").map(e => e.trim()),
      });
      if(req.file) {
        const dest = path.join(__dirname, '../public/images/uploads');
        console.log("File ->", req.file); // multer 의 output 
        const filename = req.file.filename + "." + mimetypes[req.file.mimetype];
        await fs.move(req.file.path, dest + filename);
        post.img = "/images/uploads" + filename;
      }
      await post.save();
      req.flash('success', 'Successfully posted');
      res.redirect('/posts');
    }));


  /*
  router.post('/', needAuth, catchErrors(async (req, res, next) => {
    const user = req.user;
    var post = new Post({
      title: req.body.title,
      author: user._id,
      content: req.body.content,

      // 추가
      
      field : req.body.field,
      price : req.body.price,
      
      manager : req.body.manager,
      

      // 옵션 추가
      

      // 포스터 등록
      // poster: req.body.poster,

      tags: req.body.tags.split(" ").map(e => e.trim()),
    });
    await post.save();
    req.flash('success', 'Successfully posted');
    res.redirect('/posts');
  }));*/

  router.post('/:id/answers', catchErrors(async (req, res, next) => {
    const user = req.user;
    const post = await Post.findById(req.params.id);

    if (!post) {
      req.flash('danger', 'Not exist post');
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

    const url = `/posts/${post._id}#${answer._id}`;
    io.to(post.author.toString())
      .emit('answered', {url: url, post: post});
    console.log('SOCKET EMIT', post.author.toString(), 'answered', {url: url, post: post})
    req.flash('success', 'Successfully answered');
    res.redirect(`/posts/${req.params.id}`);
  }));

  return router;
}