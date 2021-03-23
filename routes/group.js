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
const { runInNewContext } = require('vm');


router.post('/', async function(req,res){
    const {
        part_no,
        diagram_no,
        group_name,
        group_desc,
        total,
        rate_per_piece,
        number_of_pieces,
        total_per_piece,
        part_number_id,
        reference_id
    } = req.body;
    try
    {
        const result = await pool.query('INSERT INTO group_category(part_no, daigram_id, group_name, group_desc, total)  VALUES (?,?,?,?,?)',
            [
                part_no,
                diagram_no, 
                group_name,
                group_desc,
                total,
            ]);
        const gid = result.insertId;
        // console.log(gid);console.log(reference_id)
        for(let i = 0; i<part_number_id.length; i++){
            const result_parts = await pool.query('INSERT INTO group_parts(group_id, rate_per_piece, number_of_pieces, total, part_number_id, reference_id) VALUES (?,?,?,?,?,?)',[gid, rate_per_piece[i], number_of_pieces[i], total_per_piece[i], part_number_id[i], reference_id[i]]);
        }
        
        res.send({code:1, msg: "Group Inserted"})
        
    }
    catch(err){
        return res.send({code:0,msg:err})
    }
});  



router.get('/', async (req,res)=>{
    try{
        let _result = [];
        const result = await pool.query("SELECT * FROM group_category order by group_id DESC");
        for(let i = 0; i<result.length; i++){
            let data = result[i];
            // console.log(data)
            let res = await pool.query("SELECT * FROM group_parts where group_id = ?", [data.group_id]);
            // console.log(res);
            data.parts = res;
            _result.push(
                data
            )
        }
        // console.log(_result)
        res.send({
            code:1,
            groups: _result
        })

    }catch(err){
        res.send({code:0,msg:err});
    }
})

router.post('/delete', async (req,res) =>{
    try{
        const {
            group_id
        } = req.body;

        const result = await pool.query("DELETE FROM group_category WHERE group_id= ?",[group_id]);
        const result1 = await pool.query("DELETE FROM group_parts WHERE group_id= ?",[group_id]);

        res.send({code:1, msg: "Deleted groups"});

    }catch(err){
        res.send({code:0, msg:err});
    }
});

router.post('/edit', async function(req,res){
    const {
        part_no,
        diagram_no,
        group_name,
        group_desc,
        total,
        rate_per_piece,
        number_of_pieces,
        total_per_piece,
        part_number_id,
        reference_id,
        group_id
    } = req.body;
    try
    {
        const result = await pool.query('UPDATE group_category SET part_no=?,daigram_id =?,group_name=?,group_desc=?,total=? WHERE group_id= ?',
            [
                part_no,
                diagram_no, 
                group_name,
                group_desc,
                total,
                group_id
            ]);
        // console.log(gid);console.log(reference_id)
        
        const result1 = await pool.query("DELETE FROM group_parts WHERE group_id= ?",[group_id]);
        for(let i = 0; i<part_number_id.length; i++){
            const result_parts = await pool.query('INSERT INTO group_parts(group_id, rate_per_piece, number_of_pieces, total, part_number_id, reference_id) VALUES (?,?,?,?,?,?)',[group_id, rate_per_piece[i], number_of_pieces[i], total_per_piece[i], part_number_id[i], reference_id[i]]);
        }
        
        res.send({code:1, msg: "Group updated"})
        
    }
    catch(err){
        return res.send({code:0,msg:err})
    }
});  



module.exports = router;