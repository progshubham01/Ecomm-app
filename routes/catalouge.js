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
            name,
            year_of_publication,
            no_of_diagrams,
            description
        } = req.body;

        const result = await pool.query("INSERT INTO catalogue (`name`,`year_of_publication`,`no_of_diagrams`,`description`) VALUES(?,?,?,?)",
        [name, year_of_publication, no_of_diagrams, description]);

        res.send({code:1,msg:"Inserted"});

    }catch(err){
        return res.send({code:0,msg:err});
    }
});

router.get('/', async (req,res)=>{
    try{
        const result = await pool.query("SELECT * FROM catalogue");
        res.send({
            code:1,
            catalogue: result
        })

    }catch(err){
        res.send({code:0,msg:err});
    }
})

router.delete('/', async (req,res)=>{
    try{
        const {
            catalogue_id
        } = req.body;

        const result = await pool.query("DELETE FROM catalogue WHERE catalogue_id = ?",[catalogue_id]);
        
        res.send({
            code:1,
            msg:"Deleted"
        })

    }catch(err){
        res.send({code:0,msg:err});
    }
})

router.post('/edit', async (req,res)=>{
    try{
        const {
            name,
            year_of_publication,
            no_of_diagrams,
            description,
            catalogue_id
        } = req.body;

        const result = await pool.query("UPDATE catalogue SET `name`=?,`year_of_publication`=?,`no_of_diagrams`=?,`description`=? WHERE catalogue_id=?",
        [name, year_of_publication, no_of_diagrams, description,catalogue_id]);

        res.send({code:1,msg:"Updated"});

    }catch(err){
        return res.send({code:0,msg:err});
    }
});

module.exports = router;