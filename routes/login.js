const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const jwt = require('jsonwebtoken');
const keys=require('../config/keys');
var async = require('async');
var fs = require('fs');
const moment = require('moment');
const bcrypt = require('bcryptjs');

const {
    save_directory
} = require('../helper/directory');

router.post('/login',async (req,res)=>{
  try{
      const {email,password} = req.body;
      const result = await pool.query("SELECT * FROM login WHERE email=?",[email]);
      console.log(result[0].password)
        if (result.length) 
        {
            bcrypt.compare(password, result[0].password, (err, isMatch) => {
                if (err) console.log(err);
                console.log(isMatch)
                if (isMatch) {
                    jwt.sign({id: result[0].u_id},keys.SECRET, (err,token)=>{
                        if(err) 
                        return res.send({code:4,msg:'Error'});
                        
                        return res.send({
                            result,
                            token,
                            code: 1
                        });
                    });
                } else {
                    return res.send({
                        code: 0,
                        msg:"Password Doesn't Match!!"
                    });
                }
            });
        } 
        else 
        {  
            res.send({code:0,msg:'Not registered!!'});
        }
  }catch(err){
    return res.send({code:0,msg:err});
  }
    
});

router.post('/signup', async (req,res)=>{
    try{
        const {
            email,
            name,
            password
        } = req.body;


        bcrypt.genSalt(10, function(err, salt) {
            bcrypt.hash(password, salt, async function(err, hash) {
                // console.log(hash);
                const result = await pool.query("INSERT INTO login (`name`, `email`,`password`) VALUES(?,?,?)",[name,email,hash]);
                
                let u_id = result.insertId;

                var uploadDir = './public/users/user_'+u_id+'';
                const done = await save_directory(uploadDir)
            });
        });

        res.send({
            code:1,
            msg:"User Inserted"
        })

    }catch(err){
        res.send({code:0,msg:err});
    }
});


module.exports = router;