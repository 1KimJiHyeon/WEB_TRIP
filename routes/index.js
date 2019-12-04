var express = require('express');
var router = express.Router();

/* GET home page. */


// 관리자 권한 확인 

router.get('/', function(req, res, next) {
  res.render('index');
});


module.exports = router;
