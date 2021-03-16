var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var bodyParser = require('body-parser');
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;


var teacherRouter = require('./routes/teacher');
var studentRouter = require('./routes/student');
var paytmVerifyRouter=require('./routes/paytmVerify');
var hbs =require('express-handlebars')

var app = express();
app.io = require('socket.io')(); 
var http =require("http")

//const socketio = require('socket.io');
//const server = http.createServer(app);
//const io = socketio(server);

///var socket=app.io();

// Run when client connects

 



var fileupload =require('express-fileupload');
var db=require('./config/connection')
var session = require('express-session')
var MongoDBStore = require('connect-mongodb-session')(session);
var moment = require('moment-timezone');
moment().tz("America/Los_Angeles").format();

db.connect((err)=>{
  if(err) 
  console.log("connection failed" + err)
  else
  console.log("database connected successfully")
})

var store = new MongoDBStore({
  //  uri: 'mongodb://localhost:27017',
   uri:'mongodb+srv://eclass:krhrttj5PZ@3.@a@elearning.b3fkm.mongodb.net/classroom?retryWrites=true&w=majority',
  databaseName:'classroom',
  collection: 'mySessions'
});
store.on('error', function(error) {
  console.log(error);
});
app.use(require('express-session')({
  secret: 'This is a secret',
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week
  },
  store: store,
  // Boilerplate options, see:
  // * https://www.npmjs.com/package/express-session#resave
  // * https://www.npmjs.com/package/express-session#saveuninitialized
  resave: true,
  saveUninitialized: true
}));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.engine('hbs',hbs({extname:'hbs',
defaultLayout:'layout',layoutsDir:path.join(__dirname,'views','layout'),partialsDir:path.join(__dirname,'views','partials')}))


app.use(logger('dev'));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(fileupload())
app.use(bodyParser.json());
app.use(session({secret:"key",resave: false,
saveUninitialized: true,cookie:{maxAge:6000000}}))



app.use('/', teacherRouter);
app.use('/student', studentRouter);
app.use('/callback',paytmVerifyRouter);

app.io.on('connection', function(socket){
  console.log('a user connected');
  socket.on("sendnotification",function(details){
    console.log(details)
    socket.broadcast.emit("sendnotification",details);
  })
}) 

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});



module.exports = app;
