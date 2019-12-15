const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate');
const Schema = mongoose.Schema;

var schema = new Schema({
  
  author: { type: Schema.Types.ObjectId, ref: 'User' },
  title: {type: String, trim: true, required: false},
  content: {type: String, trim: true, required: false},
  radio : {type:String, trim: true, required:false},
  field : {type:String, trim:true, required:false},
  price : {type:Number, trim:true, required:false},
  course1 : {type:String, trim:true, required:false},
  course2 : {type:String, trim:true, required:false},
  course3 : {type:String, trim:true, required:false},
  img:{type:String}, // 이미지 path 저장하기 위해 추가
  numLikes: {type: Number, default: 0},
  numAnswers: {type: Number, default: 0},
  numReads: {type: Number, default: 0},
  createdAt: {type: Date, default: Date.now}
}, {
  toJSON: { virtuals: true},
  toObject: {virtuals: true}
});
schema.plugin(mongoosePaginate);
var Post = mongoose.model('Post', schema);

module.exports = Post;
