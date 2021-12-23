const express  =  require('express'); 
const { books } = require('googleapis/build/src/apis/books');
const mongoose = require("mongoose");
const passport              =  require("passport"),
bodyParser            =  require("body-parser"),
LocalStrategy         =  require("passport-local"),
passportLocalMongoose =  require("passport-local-mongoose"),
User                  =  require("./models/user"),
Book                  =  require("./models/book")
var session
var app = express()
  mongoose.connect("mongodb+srv://Kavya:HelloKavya123@cluster0.ciu0z.mongodb.net/Database?retryWrites=true&w=majority")
.then(()=>{
  console.log("Connected to database");
})
.catch(err=>{
  console.log("Connection failed");
});
app.use(express.static(__dirname + '/static'));
app.use(require("express-session")({
  secret:"Any normal Word",//decode or encode session
      resave: false,          
      saveUninitialized:false    
  }));

  passport.serializeUser(User.serializeUser());       //session encoding
  passport.deserializeUser(User.deserializeUser());   //session decoding
  passport.use(new LocalStrategy(User.authenticate()));
  app.set("view engine","ejs");
  app.use(bodyParser.urlencoded(
        { extended:true }
  ))
  app.use(passport.initialize());
  
  app.use(passport.session());
  

//Listen On Server
app.set("view engine","ejs");
//=======================
//      R O U T E S
//=======================
// app.get("/", (req,res) =>{
//   res.render("home");
// })
var stores

app.get("/userprofile",isLoggedIn ,(req,res) =>{
    session=req.session
    console.log(session)
    console.log(stores)
    res.render("store",{user:req.user,mystore:req.user.store,store:stores});

})
//Auth Routes
app.get("/",(req,res)=>{
  User.find({}).select('store')
.then(st=>
  {
    console.log(st)
    stores=st
    res.render("login");
  })
  
});
app.post("/login",passport.authenticate("local",{
  successRedirect:"/userprofile",
  failureRedirect:"/"
}),function (req, res){
   
});
app.get("/register",(req,res)=>{
  res.render("register");
});
app.post("/register",(req,res)=>{
  
  User.register(new User({username: req.body.username,phone:req.body.phone,store: req.body.storeName}),req.body.password,function(err,user){
      if(err){
          console.log(err);
          res.render("register");
      }
  passport.authenticate("local")(req,res,function(){
      res.redirect("/");
  })    
  })
})

app.get("/addBooks",(req,res)=>{
  req.session=session
  res.render("addbooks",{data:null});
});
app.post("/addBooks",(req,res)=>{
  req.session=session
  var new_book= Book({
      name:req.body.bname,
      Author:req.body.bauth,
      Vol:req.body.vol,
      copies:req.body.copies,
      store:req.user.store,
      gid:req.body.gId
    })
    new_book.save().then(
      bk=>{
        res.redirect("/userprofile")
      }
    )
    
});

app.get('/openStore/:stre',(req,res)=>{
  req.session=session
  Book.find({store:req.params.stre})
  .then(sb=>{
    var change=false
    if(req.params.stre==req.user.store){
      change=true
    }
    res.render("storebooks",{book:sb, p:change})
  })
  .catch(err=>{
    console.log(err)
  }
  )
})
 
app.get("/removeBook/:bid",(req,res)=>{
  req.session=session
  var c
  Book.findById(req.params.bid)
  .then(ress=>{
    console.log(ress["copies"])
    c=ress["copies"]-1
    console.log(c)
    Book.updateOne({_id:req.params.bid},{$set:{copies:c}},
      function( err, result ) {
        if ( err ) throw err;
        res.redirect("/openStore/"+req.user.store)
    })

  })
  
  
})

app.get("/editBook/:bid",(req,res)=>{
  req.session=session
  Book.findById(req.params.bid)
  .then(ress=>{
    res.render("addbooks.ejs",{data:ress})
    })  
})

app.post("/editBook/:bid",(req,res)=>{
  req.session=session
  Book.updateOne({_id:req.params.bid},{$set:{
    name:req.body.bname,
    Author:req.body.bauth,
    Vol:req.body.vol,
    copies:req.body.copies,
    store:req.user.store,
    gid:req.body.gId
  }})
  .then(data=>{
    console.log(data)
    res.redirect("/openStore/"+req.user.store)
  })
})

function isLoggedIn(req,res,next) {
  if(req.isAuthenticated()){
      return next();
  }
  res.redirect("/");
}

app.get("/logout",(req,res)=>{
  req.logout();
  res.redirect("/");
});


app.listen(process.env.PORT ||3000,function (err) {
    if(err){
       console.log(err);
    }else {
    console.log("Server Started At Port 3000");  }});