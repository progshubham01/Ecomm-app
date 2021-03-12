const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const jwt = require('jsonwebtoken');
const keys=require('../config/keys');
let mv = require('mv');
const moment = require('moment');
const authorization = require('../helper/jwt');
let formidable = require('formidable');
const fs = require("fs");
var rimraf = require("rimraf");

const {
    save_directory
} = require('../helper/directory');
const { findSeries } = require('async');

router.post('/', authorization, async (req,res)=>{
    try{
        const user_id = res.decoded;
        const {
            part_name,
            alternate_part_name
        } = req.body;

        const result = await pool.query("INSERT INTO part_name (`part_name`) VALUES(?)",[part_name]);

        const id = result.insertId; 

        const result2 = await pool.query("INSERT INTO a_part_name(`part_name_id`,`a_name`) VALUES(?,?)",[id, alternate_part_name]);

        res.send({code:1,msg:"Inserted"});

    }catch(err){
        return res.send({code:0,msg:err});
    }
});

router.get('/', authorization, async (req,res)=>{
    try{
        const result = await pool.query("SELECT a.*,b.* FROM part_name AS a INNER JOIN a_part_name AS b ON a.part_name_id = b.part_name_id ");
        res.send({
            code:1,
            part: result
        })

    }catch(err){
        res.send({code:0,msg:err});
    }
})


module.exports = router;