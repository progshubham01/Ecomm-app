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
        const user_id = res.decoded;
        const {
            name,
            description
        } = req.body;

        const result = await pool.query("INSERT INTO brand (`brand_name`,`brand_desc`) VALUES(?,?)",
        [name, description]);

        res.send({code:1,msg:"Inserted"});

    }catch(err){
        return res.send({code:0,msg:err});
    }
});

router.get('/', async (req,res)=>{
    try{
        const result = await pool.query("SELECT * FROM brand");
        res.send({
            code:1,
            brand: result
        })

    }catch(err){
        res.send({code:0,msg:err});
    }
})

router.post('/edit', async (req,res)=>{
    try{
        const {
            brand_name,
            brand_desc,
            brand_id
        } = req.body;

        const result = await pool.query("UPDATE brand SET `brand_name` =?, `brand_desc`=? WHERE `brand_id`=?",
        [
            brand_name,
            brand_desc,
            brand_id
        ]);
        
        res.send({
            code:1,
            msg:"Updated"
        })

    }catch(err){
        res.send({code:0,msg:err});
    }
})

router.delete('/', async (req,res)=>{
    try{
        const {
            brand_id
        } = req.body;
        
        const result = await pool.query("DELETE FROM brand WHERE `brand_id`=?",
        [
            brand_id
        ]);
        
        res.send({
            code:1,
            msg:"DELETED"
        })

    }catch(err){
        res.send({code:0,msg:err});
    }
})


module.exports = router;