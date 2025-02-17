let express=require('express');
let app=express();
let bodyparser=require('body-parser');
let mysql=require('mysql');
let session=require('express-session');
app.use(session({
    secret:"1234",
    saveUninitialized:true,
    resave:true
}))

let upload=require('express-fileupload');
app.use(upload());
app.use(bodyparser.urlencoded({extended:true}));
let admin=require('./routes/admin');
app.use(express.static("public/"));
app.use("/",admin);
app.listen(1001);