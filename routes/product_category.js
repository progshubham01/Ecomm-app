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
const { generateArray }  = require("../helper/commonFn")

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
            product_type,
            fields
        } = req.body;

        _product_type = product_type.toString();
        _fields = fields.toString();

        const result = await pool.query("INSERT INTO product_category(`primary`,`secondary`,`tertiary`,`product_type`,`fields`) VALUES(?,?,?,?,?)",
        [primary_category_name,secondary_category_name,tertiary_category_name, _product_type, _fields]);

        res.send({code:1,msg:"Inserted"});

    }catch(err){
        return res.send({code:0,msg:err});
    }
});

router.get('/', async (req,res)=>{
    try{
        const result = await pool.query("SELECT * FROM product_category");
        let _result = [];
        result.map((r) =>{
            _result.push({
                ...r,
                product_type:r.product_type.split(','),
                fields:r.fields.split(',')
            })
        })
        res.send({
            code:1,
            product_category: _result
        })

    }catch(err){
        res.send({code:0,msg:err});
    }
})

router.get('/category_type', async (req,res)=>{
    try{
        const primary = await pool.query("SELECT distinct `primary` FROM product_category");
        const secondary = await pool.query("SELECT distinct `secondary` FROM product_category");
        const tertiary = await pool.query("SELECT distinct `tertiary` FROM product_category");
        
        res.send({
            code:1,
            primary:generateArray(primary, "primary"),
            secondary:generateArray(secondary, "secondary"),
            tertiary:generateArray(tertiary, "tertiary")
        })

    }catch(err){
        res.send({code:0,msg:err});
    }
})

router.post('/delete', async (req,res) =>{
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
            product_type,
            fields,
            pc_id
        } = req.body;

        _product_type = product_type.toString();
        _fields = fields.toString();
        
        const result = await pool.query("UPDATE `product_category` SET `primary` = ?, `secondary` = ?, `tertiary` = ?,`product_type` =?, `fields` = ?  WHERE `pc_id` = ?",
        [primary_category_name, secondary_category_name, tertiary_category_name, _product_type, _fields, pc_id])

        res.send({code:1, msg:"Updated"})

    }catch(err){
        res.send({code:0, msg:err});    
    }
})


module.exports = router;