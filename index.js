//sdh install express mysql multer axios jwt
const express = require("express");
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.listen(3000, function(){
    console.log("3000 hehehe.");
});

const users = require('./routes/users')
app.use("/api/users",users);

const songs = require('./routes/songs')
app.use("/api/songs",songs);