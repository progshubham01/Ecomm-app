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
    try
    {
        const {
            name, vendor_code, description, supplier_part_number, internal_part_number,cost
        } = req.body;
            const result = await pool.query(`INSERT INTO supplier(name, vendor_code, description) VALUES (?,?,?)`,[name, vendor_code, description]);
            const sid = result.insertId;
            console.log(supplier_part_number.length);
            for(let i = 0; i<supplier_part_number.length; i++){
                const result_det = await pool.query('INSERT INTO supplier_part_number( supplier_id, supplier_part_number, internal_part_number, cost) VALUES (?,?,?,?)',[sid, supplier_part_number[i], internal_part_number[i],cost[i] ]);
            }

            res.send({code:1, msg: "Supplier Inserted"})
    }
    catch(err){
        console.log(err)
        return res.send({code:0,msg:err})
    }
});  



router.get('/', async (req,res)=>{
    try{
        const result = await pool.query("SELECT * FROM supplier order by id desc");
       
        for(let i = 0; i<result.length; i++) {
            let supplier_part_number = await pool.query("SELECT * FROM supplier_part_number WHERE supplier_id = ?", [result[i].id]);
            
            result[i].supplier_part_number = supplier_part_number;
        }

        res.send({
            code:1,
            product:result
        })

    }catch(err){
        console.log(err);
        res.send({code:0,msg:err});
    }
})

router.post('/delete', async (req,res) =>{
    try{
        const {
            s_id
        } = req.body;

        const result = await pool.query("DELETE FROM supplier WHERE id= ?",[s_id]);
        const result1 = await pool.query("DELETE FROM supplier_part_number WHERE supplier_id= ?",[s_id]);

        res.send({code:1, msg: "Deleted product"});

    }catch(err){
        console.log(err);
        res.send({code:0, msg:err});
    }
});

router.post('/edit', async function(req,res){
    try
    {
        const {
            name, vendor_code, description, supplier_part_number, internal_part_number,cost,sid
        } = req.body;
        const result = await pool.query(`UPDATE supplier SET name=? ,vendor_code=?,description=? WHERE id= ? `,[name, vendor_code, description, sid]);
        
        await pool.query(`DELETE FROM supplier_part_number WHERE id = ?`, [sid]);

        for(let i = 0; i<supplier_part_number.length; i++){
            const result_det = await pool.query('INSERT INTO supplier_part_number( supplier_id, supplier_part_number, internal_part_number, cost) VALUES (?,?,?,?)',[sid, supplier_part_number[i], internal_part_number[i],cost[i] ]);
        }

        res.send({code:1, msg: "Supplier Updated"})
    }
    catch(err){
        return res.send({code:0,msg:err})
    }
});  



module.exports = router;