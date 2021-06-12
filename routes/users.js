var express = require("express");
const router= express.Router();
const mysql = require("mysql");
const jwt = require("jsonwebtoken");
const dbase = require("../connection");
const axios = require("axios");

const multer=require("multer");

module.exports=router;
const connection=mysql.createConnection({host:"localhost", database:"project_soa", user:"root", password:""});
connection.connect();


const storage=multer.diskStorage(
    {
        destination: function(req, res, callback){
            callback(null, "./uploads");    
        },
        filename: async function(req, file, callback){
            const extension="jpg";
            var kode=req.body.id_user;
            let filename= await bikinNamaFoto();
            callback(null, filename+"."+extension);
        }
    }
);

function checkFileType(file,cb){
    const filetypes= /jpeg|jpg/;
    const extname=filetypes.test(file.originalname.split('.')[file.originalname.split('.').length-1]);
    const mimetype=filetypes.test(file.mimetype);
    if(mimetype && extname){
        return cb(null,true);
    }else{
        cb(error = 'Error : Image Only!');
    }
}

const uploads=multer({
    storage:storage,
    fileFilter: function(req, file, cb){
        checkFileType(file, cb);
    }
});


async function bikinNamaFoto(){
    var query=`SELECT LPAD(COUNT(ID_USER)+1,3,"0") as id FROM USERS`;
    var hasil= await dbase.executeQuery(query);
    var id=hasil[0].id;
    newkode="U"+id;
    var filename="U"+id;
    return filename;
}


router.post('/register', uploads.single("foto_user"), (req,res) => {
    var newnama_user = req.body.nama_user;
    var newusername = req.body.username;
    var newpassword = req.body.password;
    var newconf_password = req.body.conf_password;
    if(newpassword==newconf_password){
        connection.query(`SELECT * FROM USERS WHERE username = '${newusername}'`,(err, result, field)=> {
            if(err) throw err;
            if(result.length>0){
                //user sudah ada
                //BLM TAK KASI LOG
                res.status(404).send("Username sudah digunakan. Pilih username lain!");
            }else{
                connection.query(`SELECT LPAD(COUNT(ID_USER)+1,3,"0") as id FROM USERS`,(err, result, field)=> {
                    if(err) throw err;
                    var id=result[0].id;
                    kode="U"+id;
                    connection.query(`INSERT INTO USERS(id_user,username, nama_user, password) VALUES (?,?,?,?)`,[kode, newusername,newnama_user, newpassword],(err, result, field)=> {
                        if(err) throw err;
                        res.status(201).send({
                            id_user: kode,
                            username: newusername,
                            nama_user: newnama_user,
                            api_hit: "0",
                            saldo: "0",
                            msg: "Berhasil menambahkan user!"
                        });
                    });
                });
            }
        });
    }
    else{
        res.status(404).send("Password dan konfirmasi tidak cocok");
    }

});


router.post("/login",function(req,res){
    let username = req.body.username;
    let password = req.body.password;
    connection.query(`select * from users where username='${username}' and password ='${password}'`,function(err,result){
        if(err) res.status(500).send(err);
        else{
            if(result.length <1){
                return res.status(400).send("Invalid username or password");
            }
            const token = jwt.sign({    
                    "username": username,

                },
                "vagabond");
            temp={
                "username":username,
                "token":token
            };
            res.status(200).send(temp);
        }
    });
});


router.put("/delete",function(req,res){
    const token = req.header("x-auth-token");
    let user = {};
    if(!token){
        res.status(401).send("Unauthorized (not found)");
    }
    try{    
        user = jwt.verify(token,"vagabond");
    }catch(err){
        res.status(401).send("Unauthorized");
    }
    if((new Date().getTime()/1000)-user.iat>10*60){//10mnt
        return res.status(400).send("Token expired");
    }
    // const username = req.body.username;
    const password = req.body.password;
    connection.query(`select * from users where username='${user.username}' and password ='${password}'`,function(err,result){
        if(err) res.status(500).send(err);
        else{
            if(result.length <0){
                return res.status(400).send("Invalid username or password");
            }
            connection.query(`update users set status=0 where username='${user.username}'`,function(err,result){
                res.status(200).send("Account dihapus!");
            });
        }
    });
});

router.put("/update",function(req,res){
    const token = req.header("x-auth-token");
    let user = {};
    if(!token){
        res.status(401).send("Unauthorized (not found)");
    }
    try{    
        user = jwt.verify(token,"vagabond");
    }catch(err){
        res.status(401).send("Unauthorized");
    }
    if((new Date().getTime()/1000)-user.iat>10*60){//10mnt
        return res.status(400).send("Token expired");
    }
    // const username = req.body.username;
    const password_lama = req.body.password_lama;
    const nama_user = req.body.nama_user;
    const password_baru = req.body.password_baru;
    connection.query(`select * from users where username='${user.username}' and password ='${password_lama}'`,function(err,result){
        if(err) res.status(500).send(err);
        else{
            if(result.length <1){
                return res.status(400).send("Invalid username or password");
            }
            var qstring="";
            if(nama_user){
                qstring+="nama_user='"+nama_user+"'";
            }
            if(password_baru){
                if(nama_user) qstring+=", ";
                qstring+="password='"+password_baru+"'";
            }
            connection.query(`update users set ${qstring} where username='${user.username}'`,function(err,result){
                res.status(200).send("Profil berhasil diganti!");
            });
        }
    });
});

router.get("/searchFriends",function(req,res){
    var friend_username=req.query.friend_username;
    friend_username=friend_username.toString().toLowerCase();
    connection.query(`select id_user, username, nama_user from users where lower(username) like '%${friend_username}%'`,function(err,result){
        if(result.length<=0){
            res.status(404).send("Tidak ada user yang ditemukan");
        }else{
            res.status(200).send(result);
        }
    });
});

router.post("/addFriends",function(req,res){
    const token = req.header("x-auth-token");
    let user = {};
    if(!token){
        res.status(401).send("Unauthorized (not found)");
    }
    try{    
        user = jwt.verify(token,"vagabond");
    }catch(err){
        res.status(401).send("Unauthorized");
    }
    if((new Date().getTime()/1000)-user.iat>10*60){//10mnt
        return res.status(400).send("Token expired");
    }
    var friend_username=req.body.friend_username;
    var friend_id=req.body.friend_id;
    
    connection.query(`select * from users where username='${user.username}'`,function(err,result){
        if(err) res.status(500).send(err);
        else{
            var qstring = "";
            if(result.length <1){
                return res.status(400).send("Invalid username");
            }
            var id_aktif=result[0].id_user;
            if(friend_username && friend_username != user.username){
                qstring="username='"+friend_username+"'";
            }
            else if(friend_id && friend_id != id_aktif){
                qstring="id_user='"+friend_id+"'";
            }
            else
            {
                return res.status(400).send("Tidak bisa menambahkan diri sendiri menjadi teman");
            }
            connection.query(`select id_user, username, nama_user from users where ${qstring}`,function(err,result){
                if(result.length<=0){
                    res.status(404).send("Tidak ada user yang ditemukan");
                }else{
                    var temp={
                        username: result[0].username,
                        nama_user: result[0].nama_user,
                        msg: "Teman berhasil ditambahkan!"
                    };
                    var id_teman=result[0].id_user;
                    connection.query(`select * from friends where id_user='${id_aktif}' and teman_user='${id_teman}'`,function(err,result){
                        if(result.length < 1)
                        {
                            connection.query(`insert into friends values(?,?)`,[id_aktif, id_teman],function(err,result){
                                res.status(201).send(temp);
                            });
                        }
                        else
                        {
                            return res.status(400).send("Teman telah tertambahkan");
                        }
                    });
                    
                }
            });
        }
    });
    
});


router.delete("/removeFriends",function(req,res){
    const token = req.header("x-auth-token");
    let user = {};
    if(!token){
        res.status(401).send("Unauthorized (not found)");
    }
    try{    
        user = jwt.verify(token,"vagabond");
    }catch(err){
        res.status(401).send("Unauthorized");
    }
    if((new Date().getTime()/1000)-user.iat>10*60){//10mnt
        return res.status(400).send("Token expired");
    }
    var friend_username=req.body.friend_username;
    var friend_id=req.body.friend_id;
    connection.query(`select * from users where username='${user.username}'`,function(err,result){
        if(err) res.status(500).send(err);
        else{
            if(result.length <1){
                return res.status(400).send("Invalid username");
            }
            var id_aktif=result[0].id_user;
            if(friend_username){
                var qstring="username='"+friend_username+"'";
            }
            else if(friend_id){
                qstring="id_user='"+friend_id+"'";
            }
            connection.query(`select id_user, username, nama_user from users where ${qstring}`,function(err,result){
                if(result.length<=0){
                    res.status(404).send("Tidak ada user yang ditemukan");
                }else{
                    var id_teman=result[0].id_user;
                    connection.query(`select teman_user from friends where teman_user='${id_teman}' and id_user='${id_aktif}'`,function(err,result){
                        if(result.length<=0){
                            res.status(404).send("User yang dicari bukan teman");
                        }else{
                            connection.query(`delete from friends where teman_user='${id_teman}' and id_user='${id_aktif}'`,function(err,result){
                                res.status(200).send({msg: "Teman dengan id "+id_teman+" sudah dihapus"});
                            });
                        }
                    });
                }
            });
        }
    });
    
});

//Masih blm
router.put("/recommendations",function(req,res){
    const token = req.header("x-auth-token");
    let user = {};
    if(!token){
        res.status(401).send("Unauthorized (not found)");
    }
    try{    
        user = jwt.verify(token,"vagabond");
    }catch(err){
        res.status(401).send("Unauthorized");
    }
    if((new Date().getTime()/1000)-user.iat>10*60){//10mnt
        return res.status(400).send("Token expired");
    }
    const password = req.body.password;
    connection.query(`select * from users where username='${user.username}' and password ='${password}'`,function(err,result){
        if(err) res.status(500).send(err);
        else{
            var id_aktif=result[0].id_user;
            connection.query(`select teman_user as teman from friends where id_user='${id_aktif}'`,function(err,result){
                //dapatkan list friends
                var friends=result.teman;
                var songs=[];
                for(var i=0; i<friends.length; i++){
                    connection.query(`select * from h_playlist where id_user='${friends[i]}'`,function(err,result){
                        var playlists=result.id_playlist;
                        for(var j=0; j<playlists.length; j++){
                            connection.query(`select * from d_playlist where id_playlist='${playlists[j]}'`,function(err,result){
                                songs.append(result.id_lagu);
                            });
                        }
                    });
                }
                var my_songs=[];
                connection.query(`select * from h_playlist where id_user='${id_aktif}'`,function(err,result){
                    var playlists_user=result.id_playlist;
                    for(var j=0; j<playlists_user.length; j++){
                        connection.query(`select * from d_playlist where id_playlist='${playlists_user[j]}'`,function(err,result){
                            my_songs.append(result.id_lagu);
                        });
                    }
                });
                var recc=[];
                for(var i=0; i<songs.length; i++){
                    var flag=1;
                    for(var j=0; j<my_songs.length; j++){
                        if(songs[i]==my_songs[j]){
                            flag=0;
                            j=my_songs.length;
                        }
                    }
                    if(flag==1){
                        recc.append(songs[i]);
                    }
                }
                res.status(200).send({"Recommendations:" : recc});
            });
        }
    });
});

router.post("/topup",function(req,res){
    const token = req.header("x-auth-token");
    let user = {};
    if(!token){
        res.status(401).send("Unauthorized (not found)");
    }
    try{    
        user = jwt.verify(token,"vagabond");
    }catch(err){
        res.status(401).send("Unauthorized");
    }
    if((new Date().getTime()/1000)-user.iat>10*60){//10mnt
        return res.status(400).send("Token expired");
    }
    // const username = req.body.username;
    const saldo = req.body.saldo;
    let saldodulu=0;
    var today = new Date();
    var dd = String(today.getDate()).padStart(2, '0');
    var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
    var yyyy = today.getFullYear();

    today = yyyy+ '-' + mm + '-' + dd;
    connection.query(`select saldo from users where username='${user.username}'`,function(err,result){
        if(err) res.status(500).send(err);
        else{
            if(result.length <0){
                return res.status(404).send("user tidak terdaftar");
            }
            connection.query(`select id_user from users where username='${user.username}'`,function(err,result){
                connection.query(`insert into requests values('${result[0].id_user}','${saldo}',0,'${today}','')`,function(err,result){
                   
                        return res.status(200).send("berhasil request tambahkan saldo,meunggu di acc admin");
                    
                });
                
            });
            
        }
    });
    
   
});



router.put("/req/acc/:id_req",function(req,res){
    
    const id = req.params.id_req;
    var today = new Date();
    var dd = String(today.getDate()).padStart(2, '0');
    var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
    var yyyy = today.getFullYear();

    today = yyyy+ '-' + mm + '-' + dd;
    connection.query(`select status from requests where id_req=${id}`,function(err,resu){
        if(resu[0].status!="0"){
            return res.status(400).send("sudah pernah di acc/decline");
        }
        connection.query(`select id_user,saldo from requests where id_req='${id}'`,function(err,result2){
            if(err) res.status(500).send(err);
            else{
                if(result2.length <0){
                    return res.status(404).send("request tidak ada");
                }
                //return res.status(200).send(result2[0].id_user);
                
                connection.query(`select saldo from users where id_user='${result2[0].id_user}'`,function(err,result){
                    //return res.json(result[0].saldo);
                    connection.query(`update users set saldo=${parseInt(result[0].saldo)+parseInt(result2[0].saldo)} where id_user='${result2[0].id_user}'`,function(err,result){
                        connection.query(`update requests set status=1 where id_req=${id}`,function(err,result){
                            //return res.json(result[0].saldo);
                            connection.query(`insert into trans_history values('${result2[0].id_user}',0,${result2[0].saldo},'${today}')`,function(err,result){
                                return res.status(200).send("saldo berhasil ditambahkan ke user");
                            });
                        });
                    });
                    
                });
                
            }
        });
    });
    
    
   
});


router.put("/req/dec/:id_req",function(req,res){
    
    const id = req.params.id_req;
    let tgl= new Date();
    let dd=tgl.getFullYear()+"-"+tgl.getMonth()+"-"+tgl.getDate();
    connection.query(`select status from requests where id_req=${id}`,function(err,resu){
        if(resu[0].status!="0"){
            return res.status(400).send("sudah pernah di acc/decline");
        }
        connection.query(`select id_user,saldo from requests where id_req='${id}'`,function(err,result2){
            if(err) res.status(500).send(err);
            else{
                if(result2.length <0){
                    return res.status(404).send("request tidak ada");
                }
                //return res.status(200).send(result2[0].id_user);
                
                connection.query(`update requests set status=2 where id_req=${id}`,function(err,result){
                    //return res.json(result[0].saldo);
                    return res.status(200).send("permintaan berhasil di decline");
                    
                });
                
            }
        });
    });
    
    
   
});
router.put("/apihit",function(req,res){
    const token = req.header("x-auth-token");
    let user = {};
    if(!token){
        res.status(401).send("Unauthorized (not found)");
    }
    try{    
        user = jwt.verify(token,"vagabond");
    }catch(err){
        res.status(401).send("Unauthorized");
    }
    if((new Date().getTime()/1000)-user.iat>10*60){//10mnt
        return res.status(400).send("Token expired");
    }
    // const username = req.body.username;
    
    connection.query(`select saldo from users where username='${user.username}'`,function(err,result){
        if(err) res.status(500).send(err);
        else{
            if(result.length <0){
                return res.status(404).send("user tidak terdaftar");
            }
            if(result[0].saldo<10000){
                return res.status(404).send("saldo tidak cukup");
            }
            var today = new Date();
            var dd = String(today.getDate()).padStart(2, '0');
            var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
            var yyyy = today.getFullYear();

            today = yyyy+ '-' + mm + '-' + dd;
            
            connection.query(`update users set saldo=${result[0].saldo-10000} where username='${user.username}'`,function(err,result){
                connection.query(`select api_hit from users where username='${user.username}'`,function(err,result){
                    connection.query(`update users set api_hit=${result[0].api_hit+10}  where username='${user.username}'`,function(err,result){
                        connection.query(`select id_user from users where username='${user.username}'`,function(err,result){
                            connection.query(`insert into trans_history values('${result[0].id_user}',1,10,'${today}')`,function(err,result){
                                return res.status(200).send("berhasil tambahkan api hit");
                            });
                        });
                    });
                });
            });
            
        }
    });
    
   
});

router.get("/income",function(req,res){
   
    // const username = req.body.username;
    const awal=req.body.tanggal_awal;
    const akhir=req.body.tanggal_akhir;
    if(awal==""&&akhir==""){
        connection.query(`select * from trans_history where type=0`,function(err,result){
            let kump=[];
            for (let i = 0; i < result.length; i++) {
                //return res.json(result[i].tgl_transaksi);
                    let tg=new Date(result[i].tgl_transaksi);
                    let a1=tg.getDate();
                    let a2=tg.getMonth()+1;
                    let a3=tg.getFullYear();
                    let hasil1=a3+"-"+a2+"-"+a1;
                    //return res.json(hasil1);
                    let isi=Date.parse(hasil1);
                    //return res.json(isi);
                    
                    
                    let data={
                        user_id:result[i].id_user,
                        jumlah:result[i].jumlah,
                        tanggal_transaksi:hasil1
    
                    }
                    kump.push(data)
                
                
            }
    
            return res.status(200).send(kump);
        });
    }
    let a=Date.parse(awal);
    let b=Date.parse(akhir);
    
    connection.query(`select * from trans_history where type=0`,function(err,result){
        let kump=[];
        for (let i = 0; i < result.length; i++) {
            //return res.json(result[i].tgl_transaksi);
                let tg=new Date(result[i].tgl_transaksi);
                let a1=tg.getDate();
                let a2=tg.getMonth()+1;
                let a3=tg.getFullYear();
                let hasil1=a3+"-"+a2+"-"+a1;
                //return res.json(hasil1);
                let isi=Date.parse(hasil1);
                //return res.json(isi);
                if(isi>=a&&isi<=b){
                
                let data={
                    user_id:result[i].id_user,
                    jumlah:result[i].jumlah,
                    tanggal_transaksi:hasil1

                }
                kump.push(data)
            }
            
        }

        return res.status(200).send(kump);
    });
    
   
});

router.get("/listrequest",function(req,res){
   
    
    
    connection.query(`select r.id_req as id_request,u.nama_user as nama_user,r.saldo as saldo from requests r, users u where r.id_user=u.id_user and r.status=0`,function(err,result){


        return res.status(200).send(result);
    });
    
   
});
const key = 'mVO_x8VjQgMBryQOpb41oURSprTVLAmcX_xGGLCle2Q5nJqBFDbNeO8vlMT4ongd';
router.get("/searchhistory",async function(req,res){
    const token = req.header("x-auth-token");
    let user = {};
    if(!token){
        res.status(401).send("Unauthorized (not found)");
    }
    try{    
        user = jwt.verify(token,"vagabond");
    }catch(err){
        res.status(401).send("Unauthorized");
    }
    if((new Date().getTime()/1000)-user.iat>10*60){//10mnt
        return res.status(400).send("Token expired");
    }
    connection.query(`select id_user from users where username='${user.username}'`,async function(err,result){
        connection.query(`select id_lagu from search_history where id_user='${result[0].id_user}'`,async function(err,result2){
            //return res.status(200).send(result2[0].id_lagu);
            let kump=[];
            for (let i = 0; i < result2.length; i++) {
                let querySearch = 'https://api.genius.com/songs/'+result2[i].id_lagu+'?access_token=' + key;
                //return res.status(200).send(querySearch);
                try {
                    let resultGet = await axios.get(querySearch);
                    let data={
                        judul_lagu:resultGet.data.response.song.title,
                        artist:resultGet.data.response.song.album.artist.name
                    }
                    kump.push(data);
                } catch (error) {
                    
                }
                
            }
            return res.status(200).send(kump);
        });
    });
    
    
   
   
});

router.get("/history",function(req,res){
    const token = req.header("x-auth-token");
    let user = {};
    if(!token){
        res.status(401).send("Unauthorized (not found)");
    }
    try{    
        user = jwt.verify(token,"vagabond");
    }catch(err){
        res.status(401).send("Unauthorized");
    }
    if((new Date().getTime()/1000)-user.iat>10*60){//10mnt
        return res.status(400).send("Token expired");
    }
    // const username = req.body.username;
    
    connection.query(`select id_user from users where username='${user.username}'`,function(err,result){
        if(err) res.status(500).send(err);
        else{
            if(result.length <0){
                return res.status(404).send("user tidak terdaftar");
            }
        
            connection.query(`select type,jumlah,tgl_transaksi from trans_history where id_user='${result[0].id_user}'`,function(err,result){
                let qq=[];
                for (let i = 0; i < result.length; i++) {
                    let jen="";
                    if(result[i].type==1){
                        jen="Pembelian Api Hit"
                    }else{
                        jen="Top Up Saldo"
                    }
                    let tg=new Date(result[i].tgl_transaksi);
                    let a1=tg.getDate();
                    let a2=tg.getMonth()+1;
                    let a3=tg.getFullYear();
                    let hasil1=a3+"-"+a2+"-"+a1;
                   
                   let data={
                       "jenis transaksi":jen,
                       "jumlah":result[i].jumlah,
                       "tanggal_transaksi":hasil1
                   }
                    qq.push(data);
                }
                return res.status(200).send(qq);
            });
            
        }
    });
    
});



module.exports = router;