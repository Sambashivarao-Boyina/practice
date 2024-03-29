if(process.env.NODE_ENV!="production"){
    require("dotenv").config();
}
 

const express=require("express");
const app=express();
const mongoose=require("mongoose");
const path=require("path");
const methodOverride=require("method-override");
const ejsMate=require("ejs-mate")
const flash=require("connect-flash");
const session=require("express-session");
const MongoStore=require("connect-mongo")
const passport=require("passport");
const LocalStrategy=require("passport-local");
const ExpressError = require("./util/ExpressError.js");

//routers
const user=require("./routes/user.js");
const organizer=require("./routes/orgainzer");
const event=require("./routes/event");

//models
const User=require("./models/user");


const PORT=8080;
const db_Url=process.env.DB_URL;

async function main() {
    await mongoose.connect(db_Url);
  }
  

  
main()
    .then((res)=>{
        console.log("Connected to database");
    }).catch((err)=>{
        console.log(err);
    });



app.engine("ejs",ejsMate);
app.set("views",path.join(__dirname,"views"));
app.set("view engine","ejs");

app.use(express.static(path.join(__dirname,"/public")));
app.use(methodOverride("_method"));
app.use(express.urlencoded({extended:true}));   

const store=MongoStore.create({
    mongoUrl:db_Url,
    crypto:{
        secret:process.env.SECRET,
    },
    touchAfter:24*3600
});

store.on("error",()=>{
    console.log("Error on mongo session store",err);
})

const sessionOptions={
    store,
    secret:process.env.SECRET,
    resave:false,
    saveUninitialized:true,
    cookie:{
        expires:Date.now()+7*24*60*60*1000,
        maxAge:7*24*60*60*1000,
        httpOnly:true,
    },
}

app.use(session(sessionOptions));
app.use(flash()); 

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());




app.use((req,res,next)=>{
    res.locals.success=req.flash("success");
    res.locals.error=req.flash("error");
    res.locals.currUser=req.user;
    next();
})


app.get("/",(req,res)=>{

    res.render("home/home.ejs");
})
    

app.use("/user",user);
app.use("/organizer",organizer)
app.use("/event",event);

app.all("*",(req,res,next)=>{
    next(new ExpressError(404,"page not found"));
})
app.use((err,req,res,next)=>{
    let {status=500,message="some err"}=err;
    res.status(status).render("home/error.ejs",{status,message});
})


app.listen(PORT,()=>{
    console.log(`Server is listing on ${PORT}`);
})