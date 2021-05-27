//sdh install express mysql multer axios jwt
var express = require("express");
var app = express();
app.use(express.json());
app.use(express.urlencoded({extended:true}));

app.listen(3000, function(){
    console.log("3000 hehehe.");
});

const users = require("./routes/users");
app.use("/api/users",users);
