var passport = require('passport'),
    GithubStrategy = require('passport-github').Strategy,
    express = require('express'),
    path = require('path'),
    favicon = require('serve-favicon'),
    logger = require('morgan'),
    cookieParser = require('cookie-parser'),
    bodyParser = require('body-parser'),
    settings = require('./settings'),
    routes = require('./routes/index'),
    session = require('express-session'),
    MongoStore = require('connect-mongo')(session),
    flash = require('connect-flash'),
    multer = require('multer'),
    fs = require('fs');

var accessLog = fs.createWriteStream('access.log', {flags: 'a'});
var errorLog = fs.createWriteStream('error.log', {flags: 'a'});

var app = express();

app.set('port',process.env.PORT || 3333);
// 设置views文件夹为项目存储模板文件的地方  __dirname是当前执行的脚本所在的文件夹
app.set('views', path.join(__dirname, 'views'));
//设置视图模板引擎为ejs
app.set('view engine', 'ejs'); 

//The flash is a special area of the session used for storing messages.
//flash是一个session用于存储信息的特定区域
//Messages are written to the flash and cleared after being displayed to the user. 
//messages全部被写进flash，在向用户展示之后就会被清除
app.use(flash());
// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
//加载日志中间件
app.use(logger('dev'));
app.use(logger({stream: accessLog}));
//加载解析json的中间件
app.use(bodyParser.json());
//加载解析urlencoded请求体的中间件
app.use(bodyParser.urlencoded({ extended: false }));
//加载解析cookie的中间件
app.use(cookieParser());
//设置public为存放项目静态文件的目录
app.use(express.static(path.join(__dirname, 'public')));
app.use(function(err,req,res,next){
    var meta = '[' + new Date() + '] ' + req.url + '\n';
    errorLog.write(meta + err.stack + '\n');
    next();
})

//使用 express-session 和 connect-mongo 模块实现了将会话信息存储到mongoldb中
app.use(session({
  secret : settings.cookieSecret,
  key : settings.db,
  cookie : {maxAge : 1000 * 60 * 60 * 24 * 30},
  store : new MongoStore({
    // db : settings.db,
    // host : settings.host,
    // port : settings.port
     url: 'mongodb://localhost/'+settings.db
  })
}))

//上传文件模块
var storage = multer.diskStorage({
  destination : function(req,file,cb){
    cb(null,'./public/images');
  },
  filename : function(req,file,cb){
    cb(null,file.originalname);
  }
})
var upload = multer({storage : storage});
var cpUpload = upload.any();
app.use(cpUpload);

app.use(passport.initialize());
//路由控制
// app.use('/', routes);
// app.use('/users', users);
routes(app);
app.listen(app.get('port'),function(){
  console.log("listened on port" + app.get('port'));
})

// //捕捉404错误并转发到错误处理器
// app.use(function(req, res, next) {
//   var err = new Error('Not Found');
//   err.status = 404;
//   next(err);
// });

// // 错误处理
// // 开发环境下的错误处理
// // 将错误信息渲染到error模板并显示到浏览器
// if (app.get('env') === 'development') {
//   app.use(function(err, req, res, next) {
//     res.status(err.status || 500);
//     res.render('error', {
//       message: err.message,
//       error: err
//     });
//   });
// }

// // 生产环境下的错误处理器，将错误信息渲染error模版并显示到浏览器中。
// app.use(function(err, req, res, next) {
//   res.status(err.status || 500);
//   res.render('error', {
//     message: err.message,
//     error: {}
//   });
// });


// module.exports = app;
