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
    // if((new Date().getTime()/1000)-user.iat>60*60){//10mnt
    //     return res.status(400).send("Token expired");
    // }
    let nama_playlsit = req.body.nama_playlist;

    let cekUser = `select * from users where username='${user.username}'`;
    let resultUser = await dbase.executeQuery(cekUser);
    
    if(resultUser.length < 1)
    {
        return res.status(404).send("User tidak ditemukan");
    }
    else
    {
        if(resultUser[0].api_hit - 10 >= 0)
        {
            let tambahPlaylist = `insert into h_playlist values ('','${resultUser[0].id_user}','${user.username}','${nama_playlsit}')`;
            let resPlaylist = await dbase.executeQuery(tambahPlaylist);
            
            let apiupdate = resultUser[0].api_hit-10;
            let updateApi = `update users set api_hit=${apiupdate} where username='${user.username}'`;
            let resUpdate = await dbase.executeQuery(updateApi);
    
            temp = {
                "nama_playlist" : nama_playlsit,
                "ditambahkan_oleh" : resultUser[0].nama_user
            }
            return res.status(201).send(temp);
        }
        else
        {
            return res.status(400).send("API Hit tidak mencukupi. Silahkan melakukan pengisian saldo untuk membeli API Hit");
        }
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
    // if((new Date().getTime()/1000)-user.iat>60*60){//10mnt
    //     return res.status(400).send("Token expired");
    // }

    let cekUser = `select * from users where username='${user.username}'`;
    let resultUser = await dbase.executeQuery(cekUser);
    if(resultUser.length < 1)
    {
        return res.status(404).send("User tidak ditemukan");
    }
    else
    {
        if(resultUser[0].api_hit - 10 >= 0)
        {
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

                let apiupdate = resultUser[0].api_hit-10;
                let updateApi = `update users set api_hit=${apiupdate} where username='${user.username}'`;
                let resUpdate = await dbase.executeQuery(updateApi);
                
                return res.status(200).send(arrSong);
            } catch (error) {
                return res.status(404).send("Lagu tidak ditemukan");
            }
        }
        else
        {
            return res.status(400).send("API Hit tidak mencukupi. Silahkan melakukan pengisian saldo untuk membeli API Hit");
        }
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
    // if((new Date().getTime()/1000)-user.iat>60*60){
    //     return res.status(400).send("Token expired");
    // }
    let id_playlist = req.body.id_playlist;
    let songs_id = req.body.songs_id;

    let cekUser = `select * from users where username='${user.username}'`;
    let resultUser = await dbase.executeQuery(cekUser);
    if(resultUser.length < 1)
    {
        return res.status(404).send("User tidak ditemukan");
    }
    else
    {
        if(resultUser[0].api_hit - 10 >= 0)
        {
            let querySearch = 'https://api.genius.com/songs/'+ songs_id +'?access_token=' + token;
            try {
                let resultGet = await axios.get(querySearch);
                let insertSong = `insert into d_playlist values ('${id_playlist}', '${songs_id}','${resultGet.data.response.song.full_title}')`;
                let resSong = await dbase.executeQuery(insertSong);
                temp = {
                    
                }
                let apiupdate = resultUser[0].api_hit-10;
                let updateApi = `update users set api_hit=${apiupdate} where username='${user.username}'`;
                let resUpdate = await dbase.executeQuery(updateApi);

                return res.status(201).send({"msg" : "Lagu berhasil ditambahkan ke playlist"});
            } catch (error) {
                return res.status(404).send("Lagu tidak ditemukan");
            }
        }
        else
        {
            return res.status(400).send("API Hit tidak mencukupi. Silahkan melakukan pengisian saldo untuk membeli API Hit");
        }
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
    // if((new Date().getTime()/1000)-user.iat>60*60){
    //     return res.status(400).send("Token expired");
    // }

    let cekUser = `select * from users where username='${user.username}'`;
    let resultUser = await dbase.executeQuery(cekUser);
    if(resultUser.length < 1)
    {
        return res.status(404).send("User tidak ditemukan");
    }
    else
    {
        if(resultUser[0].api_hit - 10 >= 0)
        {
            let id_playlist = req.body.id_playlist;
            let deletedplaylist = `delete from d_playlist where id_playlist = '${id_playlist}'`;
            let resultDel = await dbase.executeQuery(deleteplaylist);
        
            let deletehplaylist = `delete from h_playlist where id_playlist = '${id_playlist}'`;
            let resultDel1 = await dbase.executeQuery(deletehplaylist);

            let apiupdate = resultUser[0].api_hit-10;
            let updateApi = `update users set api_hit=${apiupdate} where username='${user.username}'`;
            let resUpdate = await dbase.executeQuery(updateApi);
        
            return res.status(200).send("Playlist berhasil dihapus");
        }
        else
        {
            return res.status(400).send("API Hit tidak mencukupi. Silahkan melakukan pengisian saldo untuk membeli API Hit");
        }
    }

    

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
    // if((new Date().getTime()/1000)-user.iat>60*60){
    //     return res.status(400).send("Token expired");
    // }

    let cekUser = `select * from users where username='${user.username}'`;
    let resultUser = await dbase.executeQuery(cekUser);
    if(resultUser.length < 1)
    {
        return res.status(404).send("User tidak ditemukan");
    }
    else
    {
        if(resultUser[0].api_hit - 10 >= 0)
        {
            let id_playlist = req.body.id_playlist;
            let songs_id = req.body.songs_id;
        
            let deleteSong = `delete from d_playlist where id_playlist = '${id_playlist}' and id_lagu='${songs_id}'`;
            let resultDel = await dbase.executeQuery(deleteSong);

            let apiupdate = resultUser[0].api_hit-10;
            let updateApi = `update users set api_hit=${apiupdate} where username='${user.username}'`;
            let resUpdate = await dbase.executeQuery(updateApi);
        
            return res.status(200).send("Lagu berhasil dihapus dari playlist");
        }
        else
        {
            return res.status(400).send("API Hit tidak mencukupi. Silahkan melakukan pengisian saldo untuk membeli API Hit");
        }
    }

    
});

//Search lagu di playlist

//List Lagu dari playlist
router.get('/listSongPlaylist', async(req,res) => {
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
    // if((new Date().getTime()/1000)-user.iat>60*60){//10mnt
    //     return res.status(400).send("Token expired");
    // }
    
    let cekUser = `select * from users where username='${user.username}'`;
    let resultUser = await dbase.executeQuery(cekUser);
    if(resultUser.length < 1)
    {
        return res.status(404).send("User tidak ditemukan");
    }
    else
    {
        if(resultUser[0].api_hit - 10 >= 0)
        {
            let id_playlist = req.query.id_playlist;

            let querySongPlaylist = `select * from d_playlist where id_playlist='${id_playlist}'`;
            let resSP = await dbase.executeQuery(querySongPlaylist);
            
            if(resSP.length < 1)
            {
                return res.status(404).send("Tidak ada lagu dalam playlist");
            }
            else
            {
                arrSong = [];
                for (let i = 0; i < resSP.length; i++) {
                    temp = {
                        "song_title": resSP[i].title_song
                    };         
                    arrSong.push(temp);   
                }
                let apiupdate = resultUser[0].api_hit-10;
                let updateApi = `update users set api_hit=${apiupdate} where username='${user.username}'`;
                let resUpdate = await dbase.executeQuery(updateApi);

                return res.status(200).send(arrSong);
            }
            
        }
        else
        {
            return res.status(400).send("API Hit tidak mencukupi. Silahkan melakukan pengisian saldo untuk membeli API Hit");
        }
    }

    
});

//List Playlist yang dimiliki user sendiri
router.get('/listPlaylist', async(req,res) => {
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
    // if((new Date().getTime()/1000)-user.iat>60*60){//10mnt
    //     return res.status(400).send("Token expired");
    // }

    let cekUser = `select * from users where username='${user.username}'`;
    let resultUser = await dbase.executeQuery(cekUser);
    if(resultUser.length < 1)
    {
        return res.status(404).send("User tidak ditemukan");
    }
    else
    {
        if(resultUser[0].api_hit - 10 >= 0)
        {
            let playlist = `select * from h_playlist where username_user='${user.username}'`;
            let resPlay = await dbase.executeQuery(playlist);
        
            if(resPlay.length < 1)
            {
                let apiupdate = resultUser[0].api_hit-10;
                let updateApi = `update users set api_hit=${apiupdate} where username='${user.username}'`;
                let resUpdate = await dbase.executeQuery(updateApi);
                return res.status(404).send("User tidak memiliki playlist");
            }
            else
            {
                arrPlay = [];
                for (let i = 0; i < resPlay.length; i++) {
                    temp = {
                        "id_playlist" : resPlay[i].id_playlist,
                        "nama_playlist": resPlay[i].nama_playlist
                    };
                    arrPlay.push(temp);
                }
                let apiupdate = resultUser[0].api_hit-10;
                let updateApi = `update users set api_hit=${apiupdate} where username='${user.username}'`;
                let resUpdate = await dbase.executeQuery(updateApi);
                return res.status(200).send(arrPlay);
            }
        }
        else
        {
            return res.status(400).send("API Hit tidak mencukupi. Silahkan melakukan pengisian saldo untuk membeli API Hit");
        }
    }

    
});

//List Playlist yang dimiliki user lain
router.get('/listPlaylist', async(req,res) => {
    let username = req.query.username;
    let playlist = `select * from h_playlist where username_user='${username}'`;
    let resPlay = await dbase.executeQuery(playlist);

    if(resPlay.length < 1)
    {
        return res.status(404).send("User tidak memiliki playlist");
    }
    else
    {
        arrPlay = [];
        for (let i = 0; i < resPlay.length; i++) {
            temp = {
                "id_playlist" : resPlay[i].id_playlist,
                "nama_playlist": resPlay[i].nama_playlist
            };
            arrPlay.push(temp);
        }
        return res.status(200).send(arrPlay);
    }
});


module.exports = router;