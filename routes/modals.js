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

router.post('/', async (req,res)=>{
    try{
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

router.get('/', async (req,res)=>{
    try{
        const result = await pool.query("SELECT * FROM model order by model_id desc");
        res.send({
            code:1,
            model: result
        })

    }catch(err){
        res.send({code:0,msg:err});
    }
})

router.post('/edit', async (req,res)=>{
    try{
        const {
            model_name,
            model_desc,
            vin_number,
            model_year,
            model_manufacturer,
            model_id
        } = req.body;

        const result = await pool.query("UPDATE model SET `model_name`=?,`model_desc`=?,`vin_number`=?,`model_year`=?,`model_manufacturer`=? WHERE model_id=?",
        [model_name,model_desc,vin_number,model_year,model_manufacturer,model_id]);

        res.send({code:1,msg:"Updated"});

    }catch(err){
        return res.send({code:0,msg:err});
    }
});

router.post('/delete', async(req,res)=>{
    try{
        const {
            model_id
        } = req.body;

        const result = await pool.query("DELETE FROM model WHERE model_id = ?", [model_id])

        res.send({code:1, msg:"Deleted"})
    }catch(err){
        res.send({code:0,msg:err})
    }
})


module.exports = router;