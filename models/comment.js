var Db = require('./db');
    ObjectID = require('mongodb').ObjectID,
    poolModule = require('generic-pool'),
    async = require('async');
var pool = poolModule.Pool({
    name : "poolMongo",
    create : function(callback){
        var mongodb = new Db();
        mongodb.open(function(err,db){
            callback(err,db);
        })
    },
    destroy : function(mongodb){
        mongodb.close();
    },
    max : 100,
    min : 5,
    idleTimeoutMillis : 30000,
    log : true
})


function Comment(comment){
	  this.comment = comment;
}

module.exports = Comment;
Comment.prototype.save = function(callback){
    var _id = this.comment._id,
        comment = this.comment;
    async.waterfall([
        function(cb){
            pool.acquire(function(err,db){
                cb(err,db);
            })
        },
        function(db,cb){
            db.collection('posts',function(err,collection){
                cb(err,db,collection);
            })
        },
        function(db,collection,cb){
            collection.update({"_id" : new ObjectID(_id)},{$push: {"comments" : comment}},function(err){
                cb(err,db);
            })
        }
    ], function(err,db){
        pool.release(db);
        callback(err);
    })
}