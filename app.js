let _global = require('./global');
let config = require('./config');
let User = new require('./lib/user');

let DtabassQuery = require('./lib/databassQuery');

_global.dataBaseQuery = new DtabassQuery(config.dataBase);
_global.dataBaseQuery.connect();
_global.userManager = new User({database:config.dataBase, query: _global.dataBaseQuery});

setInterval(() => {
    _global.dataBaseQuery.connect();
}, 1800000);

let express = require('express');
let path = require('path');
let favicon = require('serve-favicon');
let logger = require('morgan');
let cookieParser = require('cookie-parser');
let bodyParser = require('body-parser');
let index = require('./routes/index');
let users = require('./routes/users');

let app = express();

app.all("*", function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With,Content-Type,Authorization");
    res.header("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");
    res.header("X-Powered-By",' 3.2.1');
    // res.header("Content-Type", "application/json;charset=utf-8");
    next();
});

app.all("*", function (req, res, next) {
    if (req.url.indexOf('/public/shop') > -1) {
        req.redirectPath = "http://47.104.190.150/public/shop/index.html";
    }
    next();
});

app.get("/public/shop/index.html", function (req, res) {
    res.header("Content-Type", "text/html");
    res.sendFile(__dirname + '/public/shop/index.html');
});


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json({limit:'50mb'}));
app.use(bodyParser.urlencoded({limit:'50mb',extended:true}));
app.use(cookieParser());
app.use('/public',express.static(path.join(__dirname, 'public')));
app.use(function (req, res, next) {
    if (req.method.toLocaleLowerCase() === 'options') {
        res.end ();
    } else {
        next()
    }
});
app.use('/', index);
app.use('/user', users);
app.use('/getData', require('./routes/getData/getData'));
app.use('/auth', require('./routes/auth'));
app.get('/test', function (req, res, next) {
    res.send('hello word');
});

app.post('/test', function (req, res, next) {
    res.send('hello word');
});


// catch 404 and forward to error handler

app.use(function(req, res, next) {
  let err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  if (req.redirectPath) {
      res.redirect(301, req.redirectPath);
  } else {
      res.locals.message = err.message;
      res.locals.error = req.app.get('env') === 'development' ? err : {};

      // render the error page
      res.status(err.status || 500);
      res.render('error');
  }
});

module.exports = app;
