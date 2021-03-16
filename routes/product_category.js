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
            primary_category_name,
            secondary_category_name,
            tertiary_category_name,
            fields
        } = req.body;

        const result = await pool.query("INSERT INTO product_category(`primary`,`secondary`,`tertiary`) VALUES(?,?,?)",
        [primary_category_name,secondary_category_name,tertiary_category_name]);

        const pc_id = result.insertId;

        const result2 = await pool.query("INSERT INTO product_category_fields(`pc_id`,`rest_fields`)VALUES(?,?)",[pc_id, fields]);

        res.send({code:1,msg:"Inserted"});

    }catch(err){
        return res.send({code:0,msg:err});
    }
});

router.get('/', async (req,res)=>{
    try{
        const result = await pool.query("SELECT * FROM product_category");
        res.send({
            code:1,
            product_category: result
        })

    }catch(err){
        res.send({code:0,msg:err});
    }
})

router.delete('/', async (req,res) =>{
    try{
        const {
            pc_id
        } = req.body;

        const result = await pool.query("DELETE FROM product_category WHERE pc_id= ?",[pc_id]);

        res.send({code:1, msg: "Deleted Category"});

    }catch(err){
        res.send({code:0, msg:err});
    }
});

router.post('/edit', async (req,res)=>{
    try{
        const {
            primary_category_name,
            secondary_category_name,
            tertiary_category_name,
            pc_id
        } = req.body;

        const result = await pool.query("UPDATE `product_category` SET `primary` = ?, `secondary` = ?, `tertiary` = ? WHERE `pc_id` = ?",
        [primary_category_name, secondary_category_name, tertiary_category_name, pc_id])

        res.send({code:1, msg:"Updated"})

    }catch(err){
        res.send({code:0, msg:err});    
    }
})


module.exports = router;