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

router.post('/edit', async (req,res)=>{
    try{
        const {
            part_name,
            alternate_part_name,
            part_name_id
        } = req.body;

        const result = await pool.query("UPDATE part_name SET `part_name`=? WHERE part_name_id=?",[part_name, part_name_id]);

        const result2 = await pool.query("UPDATE a_part_name SET `a_name`= ? WHERE part_name_id=?",[alternate_part_name, part_name_id]);

        res.send({code:1,msg:"Updated"});

    }catch(err){
        return res.send({code:0,msg:err});
    }
});

router.delete('/', async (req,res)=>{
    try{
        const {
            part_name_id 
        } = req.body;

        const result = await pool.query("DELETE FROM part_name WHERE part_name_id = ?", [part_name_id]);

        res.send({
            code:1,
            msg:"Deleted"
        })


    }catch(err){
        res.send({code:0, msg:err})
    }
})

router.get('/', async (req,res)=>{
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



router.post('/part_no/edit', async (req,res)=>{
    try{
        const {
            part_number,
            alternate_part_number,
            part_number_id
        } = req.body;

        const result = await pool.query("UPDATE part_number SET `part_number`=? WHERE part_number_id=?",[part_number, part_number_id]);

        const result2 = await pool.query("UPDATE a_part_number SET  `a_number`=? WHERE part_number_id = ?",[alternate_part_number, part_number_id]);

        res.send({code:1,msg:"Updated"});

    }catch(err){
        return res.send({code:0,msg:err});
    }
});

router.post('/part_no', async (req,res)=>{
    try{
        const {
            part_number,
            alternate_part_number
        } = req.body;

        const result = await pool.query("INSERT INTO part_number (`part_number`) VALUES(?)",[part_number]);

        const id = result.insertId; 

        const result2 = await pool.query("INSERT INTO a_part_number(`part_number_id`,`a_number`) VALUES(?,?)",[id, alternate_part_number]);

        res.send({code:1,msg:"Inserted"});

    }catch(err){
        return res.send({code:0,msg:err});
    }
});

router.delete('/part_no', async (req,res)=>{
    try{
        const {
            part_number_id 
        } = req.body;

        const result = await pool.query("DELETE FROM part_number WHERE part_number_id = ?", [part_number_id]);

        res.send({
            code:1,
            msg:"Deleted"
        })


    }catch(err){
        res.send({code:0, msg:err})
    }
})

router.get('/part_no', async (req,res)=>{
    try{
        const result = await pool.query("SELECT a.*,b.* FROM part_number AS a INNER JOIN a_part_number AS b ON a.part_number_id = b.part_number_id ");
        res.send({
            code:1,
            part: result
        })

    }catch(err){
        res.send({code:0,msg:err});
    }
})


module.exports = router;