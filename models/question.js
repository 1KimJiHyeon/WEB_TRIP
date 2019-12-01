const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate');
const Schema = mongoose.Schema;

var schema = new Schema({
  author: { type: Schema.Types.ObjectId, ref: 'User' },
  title: {type: String, trim: true, required: true},
  content: {type: String, trim: true, required: true},
  
  // 추가
  sponser : {type:String, trim:true, required:true},
  field : {type:String, trim:true, required:true},
  applicant : {type:String, trim:true, required:true},
  period : {type:String, trim:true, required:true},
  manager : {type:String, trim:true, required:true},
  tel : {type:String, trim:true, required:true},

  // 옵션 선택
  radio : {type:String, trim: true, required:true},

  // 공모전 포스터 등록 
  // poster : {type:String, required:true},
  
  img:{type:String}, // 이미지 path 저장하기 위해 추가
  
  tags: [String],
  numLikes: {type: Number, default: 0},
  numAnswers: {type: Number, default: 0},
  numReads: {type: Number, default: 0},
  createdAt: {type: Date, default: Date.now}
}, {
  toJSON: { virtuals: true},
  toObject: {virtuals: true}
});
schema.plugin(mongoosePaginate);
var Question = mongoose.model('Question', schema);

module.exports = Question;
