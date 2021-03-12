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

router.post('/',authorization,function(req,res){
    try
    {
            console.log("here")
            let name;
            let form = new formidable.IncomingForm();
            form.keepExtensions= true ;
            form.maxFieldsSize=10*1024*1024;
            form.parse(req,async  (err, fields, files) => {
            if (err)
            {
                console.error('Error', err)
                return res.send({code:32,msg:err})
            }
            var CurrentDate = moment().format("YYYY-MM-DD");
            console.log(CurrentDate)
            
            const result = await pool.query('SELECT MAX(`diagram_id`) AS count FROM `diagram`');
            console.log(result);
            let x;
            if(result[0].count)
                x= parseInt(result[0].count)+1;
            if(!result[0].count)
                x=1;
                console.log(x);
                    
            if(files.file.size)
            {    
                var oldpath = files.file.path;
                fileExt = files.file.name.split('.').pop();
                var newpath='./public/diagram/'+ 'diagram_'+x+'.'+fileExt+'';
                fs.rename(oldpath, newpath, (err) => {
                    if (err){
                        res.send({code:33,msg:err});
                    }
                });
                name='./diagram/'+ 'diagram_'+x+'.'+fileExt+'';
            }
            const result3 = await pool.query('INSERT INTO `diagram`(`diagram_img`, `page_number`,`diagram_desc`,`catalogue_id`) VALUES (?,?,?,?)',
            [name, fields.page_number, fields.description, fields.catalogue_id]);
        });
    }
    catch(err){
        return res.send({code:0,msg:err})
    }
});  


router.get('/', authorization, async (req,res)=>{
    try{
        const result = await pool.query("SELECT a.*,b.* FROM diagram AS a INNER JOIN catalogue AS b ON a.catalogue_id=b.catalogue_id");
        res.send({
            code:1,
            diagram: result
        })

    }catch(err){
        res.send({code:0,msg:err});
    }
})


module.exports = router;