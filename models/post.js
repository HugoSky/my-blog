var ObjectID = require('mongodb').ObjectID,
	async = require('async');	

var Db = require('./db'),
	markdown = require('markdown').markdown,
	poolModule = require('generic-pool');
var pool = poolModule.Pool({
	name : "mongoPool",
	create : function(callback){
		var mongodb = Db();
		mongodb.open(function (err, db) {
	      callback(err, db);
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

function Post(name,head,title,tags,post){
	this.name = name;
	this.head = head;	
	this.title = title;
	this.post = post;
	this.tags = tags;
}

module.exports = Post;

Post.prototype.save = function(callback){
	var date = new Date();
	var time = {
		date : date,
		year : date.getFullYear(),
		month : date.getFullYear() + "-" + (date.getMonth() + 1),
		day : date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate(),
		minute : date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + "  " + date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes())
	};
	var post = {
		name : this.name,
		time : time,
		title : this.title,
		head : this.head,
		post : this.post,
		comments : [],
		tags : this.tags,
		reprint_info: {},
		pv : 0
	};
	async.waterfall([
		function(cb){
			pool.acquire(function(err,db){
				cb(err,db);
			})
		},
		function(db,cb){
			db.collection('posts',function(err,collection){
				cb(err,collection,db);
			})
		},
		function(collection,db,cb){
			collection.insert(post,{safe:true},function(err){
				cb(err,db);
			})
		}
	], function(err,db){
		pool.release(db);
		callback(err);
	})
}
Post.getTen = function(name,page,callback){
	var query = {};
	if(name){
		query.name = name;
	}
	async.waterfall([
		function(cb){
			pool.acquire(function(err,db){
				cb(err,db);
			})
		},
		function(db,cb){
			db.collection('posts',function(err,collection){
				cb(err,collection,db);
			})
		},
		function(collection,db,cb){
			collection.count(query,function(err,total){
				cb(err,total,db,collection);
			})
		},
		function(total,db,collection,cb){
			var docs = collection.find(query,{skip : (page-1)*10,limit : 10}).sort({time : -1}).toArray(function(err,docs){
				cb(err,db,docs,total);
			});
		}
	], function(err,db,docs,total){
		pool.release(db);
		docs.forEach(function(doc){
			console.log(doc.name);
			doc.post = markdown.toHTML(doc.post);
		})
		callback(null,docs,total);
	})
}
Post.getOne = function(_id,callback){
	 var query = {
		 "_id" : new ObjectID(_id)
	 };
	 async.waterfall([
		function(cb){
			pool.acquire(function(err,db){
				cb(err,db);
			})
		},
		function(db,cb){
			db.collection('posts',function(err,collection){
				cb(err,collection,db);
			})
		},
		function(collection,db,cb){
			collection.findOne(query,function(err,doc){
				 cb(err,collection,db,doc);
			});
		},
		function(collection,db,doc,cb){
			collection.update(query, {$inc: {"pv": 1}}, function (err) {
		        cb(err,db,doc);
		    });
		}
	], function(err,db,doc){
		pool.release(db);
		callback(err,doc);
	})
}
Post.edit = function(_id,callback){
	 var query = {
        "_id": new ObjectID(_id)
	 };
	 async.waterfall([
		function(cb){
			pool.acquire(function(err,db){
				cb(err,db);
			})
		},
		function(db,cb){
			db.collection('posts',function(err,collection){
				cb(err,collection,db);
			})
		},
		function(collection,db,cb){
			collection.findOne(query,function(err,doc){
				 cb(err,db,doc);
			});
		},
	], function(err,db,doc){
		pool.release(db);
		callback(null,doc);
	})
}
Post.update = function(_id,post,callback){
	var query = {
		"_id" : new ObjectID(_id)
	}
	async.waterfall([
		function(cb){
			pool.acquire(function(err,db){
				cb(err,db);
			})
		},
		function(db,cb){
			db.collection('posts',function(err,collection){
				cb(err,collection,db);
			})
		},
		function(collection,db,cb){
			collection.update(query,{$set : {post : post}},function(err,doc){
				 cb(err,db,doc);
			});
		},
	], function(err,db,doc){
		pool.release(db);
		callback(null,doc);
	})
}
Post.remove = function(_id,callback){
	var query = {
		"_id" : new ObjectID(_id)
	}
	async.waterfall([
		function(cb){
			pool.acquire(function(err,db){
				cb(err,db);
			})
		},
		function(db,cb){
			db.collection('posts',function(err,collection){
				cb(err,collection,db);
			})
		},
		function(collection,db,cb){
			collection.findOne(query,function(err,doc){
				cb(err,doc,db,collection);
			})
		},
		//删除被转载文章中的被转记录
		function(doc,db,collection,cb){
			if(doc.reprint_info.reprint_from){
				var reprint_from = doc.reprint_info.reprint_from;
				collection.update({
        			"_id": new ObjectID(reprint_from._id)
				},{$pull : {"reprint_info.reprint_to":{
	                "_id": new ObjectID(_id)
				}}},function(err){
					cb(err,db,collection);
				})
			}
		},
		//删除文章
		function(db,collection,cb){
			collection.remove(query,{w : 1},function(err){
				cb(err,db);
			})
		}
	],function(err,db){
		pool.release(db);
		callback(null);
	});
}
Post.getArchive = function(callback){
	async.waterfall([
		function(cb){
			pool.acquire(function(err,db){
				cb(err,db);
			})
		},
		function(db,cb){
			db.collection('posts',function(err,collection){
				cb(err,collection,db);
			})
		},
		function(collection,db,cb){
			collection.find({},{"name":1,"title":1,"time":1}).sort({time:-1}).toArray(function(err,docs){
				 cb(err,db,docs);
			});
		},
	], function(err,db,docs){
		pool.release(db);
		callback(null,docs);
	})
}
Post.getTags = function(callback){
	async.waterfall([
		function(cb){
			pool.acquire(function(err,db){
				cb(err,db);
			})
		},
		function(db,cb){
			db.collection('posts',function(err,collection){
				cb(err,collection,db);
			})
		},
		function(collection,db,cb){
			collection.distinct("tags",function(err,docs){
				 cb(err,db,docs);
			});
		},
	], function(err,db,docs){
		pool.release(db);
		callback(null,docs);
	})
}
Post.getTag = function(tag, callback) {
	async.waterfall([
		function(cb){
			pool.acquire(function(err,db){
				cb(err,db);
			})
		},
		function(db,cb){
			db.collection('posts',function(err,collection){
				cb(err,collection,db);
			})
		},
		function(collection,db,cb){
			collection.find({"tags":tag},{"name":1,"title":1,"time":1}).sort({time:-1}).toArray(function(err,docs){
				 cb(err,db,docs);
			});
		},
	], function(err,db,docs){
		pool.release(db);
		callback(null,docs);
	})
}
Post.search = function(keyword,callback){
	async.waterfall([
		function(cb){
			pool.acquire(function(err,db){
				cb(err,db);
			})
		},
		function(db,cb){
			db.collection('posts',function(err,collection){
				cb(err,collection,db);
			})
		},
		function(collection,db,cb){
			var pattern = new RegExp(keyword, "i");
			collection.find({title : pattern},{"name": 1,"time": 1,"title": 1,"_id" : 1}).sort({time : -1}).toArray(function(err,docs){
				cb(err,docs,db);
			})
		},
	], function(err,docs,db){
		pool.release(db);
		callback(err,docs);
	})
}
Post.reprint = function(_id,reprint_to,callback){
	var query = {
		"_id" : new ObjectID(_id)
	}
	async.waterfall([
		function(cb){
			pool.acquire(function(err,db){
				cb(err,db);
			})
		},
		function(db,cb){
			db.collection('posts',function(err,collection){
				cb(err,collection,db);
			})
		},
		function(collection,db,cb){
			collection.findOne(query,function(err,doc){
				cb(err,doc,db,collection);
			})
		},
		function(post,db,collection,cb){
			var date = new Date();
	        var time = {
	            date: date,
	            year : date.getFullYear(),
	            month : date.getFullYear() + "-" + (date.getMonth() + 1),
	            day : date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate(),
	            minute : date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " + 
	            date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes())
	        }
	        var doc = post;
	        delete doc._id;
	        doc.name = reprint_to.name;
	        doc.head = reprint_to.head;
        	doc.time = time;
        	//是否本身是被转载的
        	doc.title = (doc.title.search(/[转载]/) > -1) ? doc.title : "[转载]" + doc.title;
        	doc.comments = [];
	        doc.reprint_info = {"reprint_from": {"_id": _id}};
	        doc.pv = 0;
			collection.insert(doc,{safe : true},function(err,newDoc){
				cb(err,newDoc.ops[0],db,collection);
			})
		},
		function(doc,db,collection,cb){
			 collection.update(query, {$push : {"reprint_info.reprint_to": {"_id": doc._id}}},function(err){
	        	cb(err,db,doc);
	        })
		}
	], function(err,db,doc){
		pool.release(db);
		callback(err,doc);
	})
}