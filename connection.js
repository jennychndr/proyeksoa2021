var mysql= require("mysql");
var pool=mysql.createPool({
   host: "localhost",
   user: "root",
   password: "",
   database: "project_soa" 
});

const executeQuery= async(query)=>{
    return new Promise((resolve, reject)=>{
        pool.query(query, (err, rows, fields)=>{
            if(err) reject(err);
            else resolve(rows);
        })
    })
}

const executeQueryWithParam=async(query, param)=>{
    return new Promise((resolve, reject)=>{
        pool.query(query, param, (err, rows, fields)=>{
            if(err) reject(err);
            else resolve(rows);
        })
    })
}

module.exports={
    'executeQuery': executeQuery,
    'executeQueryWithParam': executeQueryWithParam
}