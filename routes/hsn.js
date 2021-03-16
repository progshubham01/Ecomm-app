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
            hsn_code,
            country_of_origin,
            import_duty,
            gst,
            description
        } = req.body;

        const result = await pool.query("INSERT INTO hsn_code(`hsn_code`,`country_of_origin`,`import_duty`,`gst_id`,`description`) VALUES(?,?,?,?,?)",
        [hsn_code, country_of_origin,import_duty, gst,description]);

        res.send({code:1,msg:"Inserted"});

    }catch(err){
        return res.send({code:0,msg:err});
    }
});

router.get('/', async (req,res)=>{
    try{
        const hsn = await pool.query("SELECT * FROM hsn_code");
        
        const gst = await pool.query("SELECT * FROM gst");
        
        res.send({
            code:1,
            hsn: hsn,
            gst: gst        
        })

    }catch(err){
        res.send({code:0,msg:err});
    }
})


router.post('/gst', async (req,res)=>{
    try{
        const {
            gst_percentage,
            gst_description
        } = req.body;

        const result = await pool.query("INSERT INTO gst(`gst_percentage`,`gst_desc`)VALUES(?,?)",[gst_percentage,gst_description]);

        res.send({
            code:1,
            msg:"Inserted"
        })

    }catch(err){
        res.send({code:0, msg: err});
    }
});

router.post('/edit', async(req,res)=>{
    try{
        const {
            hsn_code,
            country_of_origin,
            import_duty,
            gst,
            description,
            hsn_id
        } = req.body;

        const result = await pool.query("UPDATE hsn_code SET hsn_code=?, country_of_origin=?, import_duty=?,gst_id=?,description=? WHERE hsn_id = ?",
        [
            hsn_code,
            country_of_origin,
            import_duty,
            gst,
            description,
            hsn_id
        ]);

        res.send({code:1, msg: "Updated"})

    }catch(err){
        res.send({code:0, msg:err});
    }
})

router.post('/gst/edit', async(req,res)=>{
    try{
        const {
            gst_id,
            gst_description,
            gst_percentage
        } = req.body;

        const result = await pool.query("UPDATE gst SET gst_desc=?, gst_percentage=? WHERE gst_id = ?",
        [
            gst_description,
            gst_percentage,
            gst_id
        ]);

        res.send({code:1, msg: "Updated"})

    }catch(err){
        res.send({code:0, msg:err});
    }
})

router.delete('/', async(req,res)=>{
    try{
        const {
            hsn_id
        } = req.body;

        const result = await pool.query("DELETE FROM hsn_code WHERE hsn_id=?",
        [
            hsn_id
        ]);

        res.send({code:1, msg: "DELETED!!!"})

    }catch(err){
        res.send({code:0, msg:err});
    }
})

router.delete('/gst', async(req,res)=>{
    try{
        const {
            gst_id
        } = req.body;

        const result = await pool.query("DELETE FROM gst WHERE gst_id=?",
        [
            gst_id
        ]);

        res.send({code:1, msg: "DELETED "})

    }catch(err){
        res.send({code:0, msg:err});
    }
})


module.exports = router;