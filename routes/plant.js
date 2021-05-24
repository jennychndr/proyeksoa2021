var express = require("express");
const router= express.Router();
const mysql = require("mysql");

const axios=require("axios");

module.exports=router;
const connection=mysql.createConnection({host:"localhost", database:"project_soa", user:"root", password:""});
connection.connect();

var token_key="vagabond";

//BLIND CODE
//GATAU
//TREFLE E GAISA TAK LOGIN :( HUHU
router.post("/",function(req,res){
    //home->all plants
    const token = req.header("x-auth-token");
    let user = {};
    if(!token){
        res.status(401).send("Unauthorized (not found)");
    }
    try{    
        user = jwt.verify(token,token_key);
    }catch(err){
        res.status(401).send("Unauthorized");
    }
    if((new Date().getTime()/1000)-user.iat>10*60){//10mnt
        return res.status(400).send("Token expired");
    }

    // connection.query(`SELECT * FROM users WHERE id_user=${user.id}`,(err, result, field)=> {
    //     if(err) throw err;
    //     var hit=result[0].api_hit;
        
    // });
    var src=req.query.searchPlant;
    if(!src){
        var link="http://localhost:3000/api/v1/plants";
    }
    else{
        var link="http://localhost:3000/api/v1/plants/search";
    }
    const hasil= await axios.get(link);
    var plants=hasil.data;

    temp={
        id_tanaman: plants.id,
        nama_tanaman: plants.common_name,
        nama_ilmiah: plants.scientific_name,
        image: plants.image_url,
        family: plants.family,
        genus: plants. genus,
    }
    return res.status(200).send(temp);
});
