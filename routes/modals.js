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
            model_name,
            model_desc,
            vin_number,
            model_year,
            model_manufacturer
        } = req.body;

        const result = await pool.query("INSERT INTO model (`model_name`,`model_desc`,`vin_number`,`model_year`,`model_manufacturer`) VALUES(?,?,?,?,?)",
        [model_name,model_desc,vin_number,model_year,model_manufacturer]);

        res.send({code:1,msg:"Inserted"});

    }catch(err){
        return res.send({code:0,msg:err});
    }
});

router.get('/', authorization, async (req,res)=>{
    try{
        const result = await pool.query("SELECT * FROM model");
        res.send({
            code:1,
            model: result
        })

    }catch(err){
        res.send({code:0,msg:err});
    }
})


module.exports = router;