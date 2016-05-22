var crypto = require('crypto'),
    async = require('async'),
    mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/blog');

var userSchema = new mongoose.Schema({
  name:String,
  password:String,
  email:String,
  head:String
})

var userModel = mongoose.model('User',userSchema);

function User(user) {
  this.name = user.name;
  this.password = user.password;
  this.email = user.email;
};

module.exports = User;

//存储用户信息
User.prototype.save = function(callback) {
  var md5 = crypto.createHash('md5'),
      email_MD5 = md5.update(this.email.toLowerCase()).digest('hex'),
      head = "http://www.gravatar.com/avatar/"+email_MD5+'?s=48';
  var user = {
      name: this.name,
      password: this.password,
      email: this.email,
      head : head
  };
  var newUser = new userModel(user);
  newUser.save(function(err,user){
    if(err){
      return callback(err);
    }
    callback(null,user);
  })
}
//cb中第一个参数为err，如果err不为空，就会直接调用callback
//如果callback为空，则cb中剩余的参数就会向下传递，作为下一个函数的前几项参数
//注意  callback中的参数和最后一个task中的相同
User.get = function(name,callback){
   userModel.findOne({name : name},function(err,user){
    if(err){
      callback(err);
    }
    callback(null,user);
   })
}
// var Db = require('./db'),
//     markdown = require('markdown').markdown,
//     poolModule = require('generic-pool');
// var pool = poolModule.Pool({
//   name : "mongoPool",
//   create : function(callback){
//     var mongodb = Db();
//     mongodb.open(function (err, db) {
//         callback(err, db);
//       })
//   },
//   destroy : function(mongodb){
//     mongodb.close();
//   },
//   max : 100,
//   min : 5,
//   idleTimeoutMillis : 30000,
//   log : true
// })
// User.prototype.save = function(callback) {
//   var md5 = crypto.createHash('md5'),
//       email_MD5 = md5.update(this.email.toLowerCase()).digest('hex'),
//       head = "http://www.gravatar.com/avatar/"+email_MD5+'?s=48';
//   var user = {
//       name: this.name,
//       password: this.password,
//       email: this.email,
//       head : head
//   };
//   async.waterfall([
//     function(cb){
//      pool.acquire(function (err, db) {
//         cb(err,db);
//       });
//     },
//     function(db,cb){
//       db.collection('users',function(err,collection){
//         cb(err,collection,db);
//       });
//     },
//     function(collection,db,cb){
//       collection.insert(user,{safe:true},function(err,user){
//         cb(err,user,db);
//       });
//     }
//   ],function(err,user,db){
//     pool.release(db);
//     callback(err,user.ops[0]);
//   })
// }
// User.get = function(name,callback){
//   async.waterfall([
//     function(cb){
//       pool.acquire(function (err, db) {
//         cb(err,db);
//       });
//     },
//     function (db, cb) {
//       db.collection('users', function (err, collection) {
//         cb(err,collection,db);
//       });
//     },
//     function (collection,db,cb) {
//       collection.findOne({
//         name: name
//       }, function (err, user) {
//         cb(err,user,db);
//       });
//     }
//   ], function(err,user,db){
//     pool.release(db);
//     callback(err,user);
//   })
// }

