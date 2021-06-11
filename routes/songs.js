var express = require("express");
const router= express.Router();
const mysql = require("mysql");
const jwt = require("jsonwebtoken");
const dbase = require("../connection");
const axios = require("axios");

router.post('/addplaylist', async(req,res) => {
    const token = req.header("x-auth-token");
    let user = {};
    if(!token){
        return res.status(401).send("Unauthorized (not found)");
    }
    try{    
        user = jwt.verify(token,"vagabond");
    }catch(err){
        return res.status(401).send("Unauthorized");
    }
    if((new Date().getTime()/1000)-user.iat>10*60){//10mnt
        return res.status(400).send("Token expired");
    }
    let nama_playlsit = req.body.nama_playlist;

    let cekUser = `select * from users where username='${user.username}'`;
    let resultUser = await dbase.executeQuery(cekUser);
    
    if(resultUser.length < 1)
    {
        return res.status(404).send("User tidak ditemukan");
    }
    else
    {
        let tambahPlaylist = `insert into h_playlist values ('','${resultUser[0].id_user}','${nama_playlsit}')`;
        let resPlaylist = await dbase.executeQuery(tambahPlaylist);

        temp = {
            "nama_playlist" : nama_playlsit,
            "ditambahkan_oleh" : resultUser[0].nama_user
        }
        return res.status(201).send(temp);
    }
});

const token = 'mVO_x8VjQgMBryQOpb41oURSprTVLAmcX_xGGLCle2Q5nJqBFDbNeO8vlMT4ongd';

router.get('/title', async(req,res) => {
    const xtoken = req.header("x-auth-token");
    let user = {};
    if(!xtoken){
        return res.status(401).send("Unauthorized (not found)");
    }
    try{    
        user = jwt.verify(xtoken,"vagabond");
    }catch(err){
        return res.status(401).send("Unauthorized");
    }
    if((new Date().getTime()/1000)-user.iat>10*60){//10mnt
        return res.status(400).send("Token expired");
    }
    var arrSong = [];
    let querySearch = 'https://api.genius.com/search?access_token=' + token + '&q=' + req.query.name;
    try {
        let resultGet = await axios.get(querySearch);
        console.log(resultGet.data.response.hits.length);
        for (let i = 0; i < resultGet.data.response.hits.length; i++) {
            temp = {
                "songs_id" : resultGet.data.response.hits[i].result.id,
                "songs_name" : resultGet.data.response.hits[i].result.full_title
            }
            arrSong.push(temp);
        }
        return res.status(200).send(arrSong);
    } catch (error) {
        return res.status(404).send("Lagu tidak ditemukan");
    }
});

router.post('/addsongtoplaylist', async(req,res) => {
    const xtoken = req.header("x-auth-token");
    let user = {};
    if(!xtoken){
        return res.status(401).send("Unauthorized (not found)");
    }
    try{    
        user = jwt.verify(xtoken,"vagabond");
    }catch(err){
        return res.status(401).send("Unauthorized");
    }
    if((new Date().getTime()/1000)-user.iat>10*60){
        return res.status(400).send("Token expired");
    }
    let id_playlist = req.body.id_playlist;
    let songs_id = req.body.songs_id;

    let querySearch = 'https://api.genius.com/songs/'+ songs_id +'?access_token=' + token;
    try {
        let resultGet = await axios.get(querySearch);
        let insertSong = `insert into d_playlist values ('${id_playlist}', '${songs_id}')`;
        let resSong = await dbase.executeQuery(insertSong);
        temp = {
            
        }
        return res.status(201).send("Lagu berhasil ditambahkan ke playlist");
    } catch (error) {
        return res.status(404).send("Lagu tidak ditemukan");
    }
});

//Delete playlist
router.delete('/deleteplaylist', async(req,res) => {
    const xtoken = req.header("x-auth-token");
    let user = {};
    if(!xtoken){
        return res.status(401).send("Unauthorized (not found)");
    }
    try{    
        user = jwt.verify(xtoken,"vagabond");
    }catch(err){
        return res.status(401).send("Unauthorized");
    }
    if((new Date().getTime()/1000)-user.iat>10*60){
        return res.status(400).send("Token expired");
    }

    let id_playlist = req.body.id_playlist;
    let deletedplaylist = `delete from d_playlist where id_playlist = '${id_playlist}'`;
    let resultDel = await dbase.executeQuery(deleteplaylist);

    let deletehplaylist = `delete from h_playlist where id_playlist = '${id_playlist}'`;
    let resultDel1 = await dbase.executeQuery(deletehplaylist);

    return res.status(200).send("Playlist berhasil dihapus");

});

//Delete song from playlist
router.delete('/deletesong', async(req,res) => {
    const xtoken = req.header("x-auth-token");
    let user = {};
    if(!xtoken){
        return res.status(401).send("Unauthorized (not found)");
    }
    try{    
        user = jwt.verify(xtoken,"vagabond");
    }catch(err){
        return res.status(401).send("Unauthorized");
    }
    if((new Date().getTime()/1000)-user.iat>10*60){
        return res.status(400).send("Token expired");
    }

    let id_playlist = req.body.id_playlist;
    let songs_id = req.body.songs_id;

    let deleteSong = `delete from d_playlist where id_playlist = '${id_playlist}' and id_lagu='${songs_id}'`;
    let resultDel = await dbase.executeQuery(deleteSong);

    return res.status(200).send("Lagu berhasil dihapus dari playlist");
});

//Search lagu di playlist

//List Playlist yang dimiliki user

//List Lagu dari playlist



module.exports = router;