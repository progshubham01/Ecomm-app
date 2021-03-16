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
const { runInNewContext } = require('vm');

router.post('/',function(req,res){
    try
    {
            let name;
            let form = new formidable.IncomingForm();
            form.keepExtensions= true ;
            form.maxFieldsSize=10*1024*1024;
            form.multiples = true;
            form.parse(req,async  (err, fields, files) => {
            if (err)
            {
                console.error('Error', err)
                return res.send({code:32,msg:err})
            }
            var CurrentDate = moment().format("YYYY-MM-DD");
            console.log(CurrentDate);

            const result3 = await pool.query('INSERT INTO `products`(`pc_id`, `diagram_id`,`ref_id`,`part_name_id`,`part_number_id`,`brand_id`,`rate`,`description`) VALUES (?,?,?,?,?,?,?,?)',
                [
                    fields.pc_id, 
                    fields.diagram_id, 
                    fields.ref_id,
                    fields.part_name_id,
                    fields.part_number_id,
                    fields.brand_id,
                    fields.rate,
                    fields.description
                ]);

            const pid = result3.insertId;

            var uploadDir = './public/product/product_'+pid+'/';
            const done = await save_directory(uploadDir)

            for(let i=0; i< files.file.length; i++)
            {
                if(files.file[i].size)
                {    
                    var oldpath = files.file[i].path;
                    fileExt = files.file[i].name.split('.').pop();
                    var newpath='./public/product/product_'+pid+'/'+ 'product_'+pid+'_'+i+'.'+fileExt+'';
                    mv(oldpath, newpath, (err) => {
                        if (err){
                            res.send({code:33,msg:err});
                        }
                    });
                    name='./product/product_'+pid+'/product_'+pid+'_'+i+'.'+fileExt+'';
                }

                const image = await pool.query("INSERT INTO product_image(`p_id`,`image`) VALUES(?,?)",[pid, name]);

            }

            res.send({code:1, msg: "Product Inserted"})
        });
    }
    catch(err){
        return res.send({code:0,msg:err})
    }
});  

router.get('/details', async (req,res)=>{
    try{
        const {
            primary,
            secondary,
            tertiary
        } = req.body;

        let category ; 

        if(primary){
            category = await pool.query("SELECT * FROM product_category WHERE primary = ?",[primary]); 
        }else if (secondary){
            category = await pool.query("SELECT * FROM product_category WHERE secondary=?",[secondary]);
        }else{
            category = await pool.query("SELECT * FROM product_category WHERE tertiary=?",[tertiary]);
        }

        const model = await pool.query("SELECT * FROM model");

        const product  = await pool.query("SELECT * FROM products");

        const part_name = await pool.query("SELECT * FROM part_name");

        const part_number = await pool.query("SELECT * FROM part_number");

        const brand = await pool.query("SELECT * FROM brand");

        const hsn = await pool.query("SELECT * FROM hsn_code");

        const gst = await pool.query("SELECT * FROM gst");
        
        res.send({
            code:1, 
            category: result, 
            model:model, 
            product: product, 
            part_name: part_name, 
            part_number: part_number,
            brand: brand,
            hsn_code: hsn,
            gst: gst

        });

    }catch(err){
        res.send({code:0,msg:err});
    }
});

router.get('/', async (req,res)=>{
    try{
        const result = await pool.query("SELECT a.part_name,b.part_number,c.brand_name,d.rate,d.description FROM products AS d INNER JOIN part_name AS a ON a.part_name_id = d.part_name_id INNER JOIN part_number AS b ON d.part_number_id = b.part_number_id INNER JOIN brand AS c ON d.brand_id = c.brand_id");
        res.send({
            code:1,
            product: result
        })

    }catch(err){
        res.send({code:0,msg:err});
    }
})

router.get('/edit', async(req,res)=>{
    try{
        const {
            p_id
        } = req.body;

        const result = await pool.query("SELECT a.part_name,b.part_number,c.brand_name,d.rate FROM products AS d INNER JOIN part_name AS a ON a.part_name_id = d.part_name_id INNER JOIN part_number AS b ON d.part_number_id = b.part_number_id INNER JOIN brand AS c ON d.brand_id = c.brand_id WHERE d.p_id = ?",[p_id]);
        res.send({
            code:1,
            product: result
        })


    }catch(err){
        res.send({code:0, msg:err});
    }
})


module.exports = router;