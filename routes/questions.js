const express = require('express');
const Question = require('../models/question');
const Answer = require('../models/answer'); 
const catchErrors = require('../lib/async-error');

// 추가 - multer middleware
const multer = require('multer');
const fs = require('fs-extra');
const path = require('path');


module.exports = io => {
  const router = express.Router();
  
  // 동일한 코드가 users.js에도 있습니다. 이것은 나중에 수정합시다.
  function needAuth(req, res, next) {
    if (req.isAuthenticated()) {
      next();
    } else {
      req.flash('danger', 'Please signin first.');
      res.redirect('/signin');
    }
  }

  /* GET questions listing. */
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
    const questions = await Question.paginate(query, {
      sort: {createdAt: -1}, 
      populate: 'author', 
      page: page, limit: limit
    });
    res.render('questions/index', {questions: questions, term: term, query: req.query});
  }));

  router.get('/new', needAuth, (req, res, next) => {
    res.render('questions/new', {question: {}});
  });

  router.get('/:id/edit', needAuth, catchErrors(async (req, res, next) => {
    const question = await Question.findById(req.params.id);
    res.render('questions/edit', {question: question});
  }));

  router.get('/:id', catchErrors(async (req, res, next) => {
    const question = await Question.findById(req.params.id).populate('author');
    const answers = await Answer.find({question: question.id}).populate('author');
    question.numReads++;    // TODO: 동일한 사람이 본 경우에 Read가 증가하지 않도록???

    await question.save();
    res.render('questions/show', {question: question, answers: answers});
  }));

  router.put('/:id', catchErrors(async (req, res, next) => {
    const question = await Question.findById(req.params.id);

    if (!question) {
      req.flash('danger', 'Not exist question');
      return res.redirect('back');
    }
    question.title = req.body.title;
    question.content = req.body.content;

    // 추가
    question.sponser = req.body.sponser;
    question.field = req.body.field;
    question.applicant = req.body.applicant;
    question.period = req.body.period;
    question.manager = req.body.manager;
    question.tel = req.body.tel;

    // // 옵션 선택
    // question.radio = req.body.radio;

    // 포스터 등록 
    // question.poster = req.body.poster;

    question.tags = req.body.tags.split(" ").map(e => e.trim());

    await question.save();
    req.flash('success', 'Successfully updated');
    res.redirect('/questions');
  }));

  router.delete('/:id', needAuth, catchErrors(async (req, res, next) => {
    await Question.findOneAndRemove({_id: req.params.id});
    req.flash('success', 'Successfully deleted');
    res.redirect('/questions');
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
      var question = new Question({
        title: req.body.title,
        author: req.user._id,
        content: req.body.content,

        // 추가
        sponser : req.body.sponser,
        field : req.body.field,
        applicant : req.body.applicant,
        period : req.body.period,
        manager : req.body.manager,
        tel : req.body.tel,

        // 옵션 추가
        radio : req.body.radio,

        tags: req.body.tags.split(" ").map(e => e.trim()),
      });
      if(req.file) {
        const dest = path.join(__dirname, '../public/images/uploads');
        console.log("File ->", req.file); // multer 의 output 
        const filename = req.file.filename + "." + mimetypes[req.file.mimetype];
        await fs.move(req.file.path, dest + filename);
        question.img = "/images/uploads" + filename;
      }
      await question.save();
      req.flash('success', 'Successfully posted');
      res.redirect('/questions');
    }));


  /*
  router.post('/', needAuth, catchErrors(async (req, res, next) => {
    const user = req.user;
    var question = new Question({
      title: req.body.title,
      author: user._id,
      content: req.body.content,

      // 추가
      sponser : req.body.sponser,
      field : req.body.field,
      applicant : req.body.applicant,
      period : req.body.period,
      manager : req.body.manager,
      tel : req.body.tel,

      // 옵션 추가
      radio : req.body.radio,

      // 포스터 등록
      // poster: req.body.poster,

      tags: req.body.tags.split(" ").map(e => e.trim()),
    });
    await question.save();
    req.flash('success', 'Successfully posted');
    res.redirect('/questions');
  }));*/

  router.post('/:id/answers', needAuth, catchErrors(async (req, res, next) => {
    const user = req.user;
    const question = await Question.findById(req.params.id);

    if (!question) {
      req.flash('danger', 'Not exist question');
      return res.redirect('back');
    }

    var answer = new Answer({
      author: user._id,
      question: question._id,
      content: req.body.content
    });
    await answer.save();
    question.numAnswers++;
    await question.save();

    const url = `/questions/${question._id}#${answer._id}`;
    io.to(question.author.toString())
      .emit('answered', {url: url, question: question});
    console.log('SOCKET EMIT', question.author.toString(), 'answered', {url: url, question: question})
    req.flash('success', 'Successfully answered');
    res.redirect(`/questions/${req.params.id}`);
  }));

  return router;
}