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

router.post('/fetch_fields', async function(req,res){
    const {
        primary,
        secondary,
        tertiary
    } = req.body;
    try
    {
        let fields, pc_id, result;
        
        if(primary && secondary && tertiary){
            console.log(primary,secondary, tertiary);
            result = await pool.query("SELECT fields, pc_id FROM product_category WHERE `primary` = ? and secondary = ? and tertiary = ?",[primary, secondary, tertiary]); 
        }
        else if(primary && secondary){
            result = await pool.query("SELECT fields, pc_id FROM product_category WHERE `primary` = ? and secondary = ?",[primary, secondary]); 
        }
        else if(primary){
            console.log(primary,secondary, tertiary, "sda");
            result = await pool.query("SELECT fields, pc_id FROM product_category WHERE `primary` = ?",[primary]); 
            
            // console.log(fields, pc_id, "dz")
        }
        else{
            res.send({code:0, msg: "Invalid Input"})
        }
        // console.log(result)
        fields = result[0].fields;
        pc_id = result[0].pc_id;
        // console.log(fields, pc_id, "dz")
        res.send({code:1, msg: "Success", fields:JSON.parse(fields), pc_id : pc_id})
    }
    catch(err){
        console.log(err)
        return res.send({code:0,msg:err})
    }
});  

router.get('/details', async (req,res)=>{
    try{
        
        const model = await pool.query("SELECT * FROM model");
        const product  = await pool.query("SELECT * FROM products");
        const part_name = await pool.query("SELECT * FROM part_name");
        const part_number = await pool.query("SELECT * FROM part_number");
        const brand = await pool.query("SELECT * FROM brand");
        const hsn = await pool.query("SELECT * FROM hsn_code");
        const gst = await pool.query("SELECT * FROM gst");
        
        res.send({
            code:1, 
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

router.post('/',function(req,res){
    try
    {
            let name;
            let form = new formidable.IncomingForm();
            form.keepExtensiofilens= true ;
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
            console.log(fields.gst_ids, "sadsa");
            const result3 = await pool.query('INSERT INTO `products`( `pc_id`, `diagram_id`, `ref_id`, `model_id`, `part_name_id`, `part_number_id`, `brand_id`, `rate`, `barcode`, `hsn_id`, `gst_id`, `description`) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
                [
                    fields.pc_id, 
                    fields.diagram_id, 
                    fields.ref_id,
                    fields.model_id,
                    fields.part_name_id,
                    fields.part_number_id,
                    fields.brand_id,
                    fields.rate,
                    fields.barcode,
                    fields.hsn_id,
                    fields.gst_ids,
                    fields.description
                ]);

            const pid = result3.insertId;

            var uploadDir = './public/product/product_'+pid+'/';
            const done = await save_directory(uploadDir)

            // console.log(files.file.length);
            if(files.file.length){
                for(let i=0; i< files.file.length; i++)
                {
                    if(files.file[i].size)
                    {    
                        var oldpath = files.file[i].path;
                        fileExt = files.file[i].name.split('.').pop();
                        var newpath='./public/product/product_'+pid+'/'+ 'product_'+pid+'_'+i+Date.now()+'.'+fileExt+'';
                        mv(oldpath, newpath, (err) => {
                            if (err){
                                res.send({code:33,msg:err});
                            }
                        });
                        name='product/product_'+pid+'/product_'+pid+'_'+i+Date.now()+'.'+fileExt+'';
                    }
                    const image = await pool.query("INSERT INTO product_image(`p_id`,`image`) VALUES(?,?)",[pid, name]);
                }
            }
            else{
                if(files.file.size)
                {    
                    var oldpath = files.file.path;
                    fileExt = files.file.name.split('.').pop();
                    var newpath='./public/product/product_'+pid+'/'+ 'product_'+pid+'_'+0+Date.now()+'.'+fileExt+'';
                    mv(oldpath, newpath, (err) => {
                        if (err){
                            res.send({code:33,msg:err});
                        }
                    });
                    name='product/product_'+pid+'/product_'+pid+'_'+0+Date.now()+'.'+fileExt+'';
                    const image = await pool.query("INSERT INTO product_image(`p_id`,`image`) VALUES(?,?)",[pid, name]);
                }
            }

            res.send({code:1, msg: "Product Inserted"})
        });
    }
    catch(err){
        return res.send({code:0,msg:err})
    }
});  



router.get('/', async (req,res)=>{
    try{
        const result = await pool.query("SELECT d.*, a.part_name,b.part_number,c.brand_name FROM products AS d LEFT JOIN part_name AS a ON a.part_name_id = d.part_name_id LEFT JOIN part_number AS b ON d.part_number_id = b.part_number_id LEFT JOIN brand AS c ON d.brand_id = c.brand_id order by d.p_id desc");

        let _result = [];
        let last_id = 0;
        for(let i = 0; i<result.length; i++) {
            let fields = await pool.query("SELECT fields FROM product_category WHERE `pc_id` = ?",[result[i].pc_id]); 
            const images = await pool.query("select * from product_image where p_id = ?", result[i].p_id);
            result[i].image = images;
            result[i].fields = JSON.parse(fields[0].fields);
        }

        res.send({
            code:1,
            product:result
        })

    }catch(err){
        res.send({code:0,msg:err});
    }
})

router.post('/delete', async (req,res) =>{
    try{
        const {
            p_id
        } = req.body;

        const result = await pool.query("DELETE FROM products WHERE p_id= ?",[p_id]);
        const result1 = await pool.query("DELETE FROM product_image WHERE p_id= ?",[p_id]);

        res.send({code:1, msg: "Deleted product"});

    }catch(err){
        res.send({code:0, msg:err});
    }
});

router.post('/edit',function(req,res){
    try
    {
            let name;
            let form = new formidable.IncomingForm();
            form.keepExtensiofilens= true ;
            form.maxFieldsSize=10*1024*1024;
            form.multiples = true;
            form.parse(req,async  (err, fields, files) => {
            if (err)
            {
                console.error('Error', err)
                return res.send({code:32,msg:err})
            }
            
            console.log(fields);
            const result3 = await pool.query('UPDATE `products` SET `pc_id`=?,`diagram_id`=?,`ref_id`=?,`model_id`=?,`part_name_id`=?,`part_number_id`=?,`brand_id`=?,`rate`=?,`barcode`=?,`hsn_id`=?,`gst_id`=?,`description`=? WHERE `p_id`= ? ',
                [
                    fields.pc_id, 
                    fields.diagram_id, 
                    fields.ref_id,
                    fields.model_id,
                    fields.part_name_id,
                    fields.part_number_id,
                    fields.brand_id,
                    fields.rate,
                    fields.barcode,
                    fields.hsn_id,
                    fields.gst_ids,
                    fields.description,
                    fields.p_id
                ]);

            const pid = fields.p_id;
            console.log(files);
            var uploadDir = './public/product/product_'+pid+'/';
            const done = await save_directory(uploadDir)

            console.log(files.file.length);
            if(files.file.length){
                for(let i=0; i< files.file.length; i++)
                {
                    if(files.file[i].size)
                    {    
                        var oldpath = files.file[i].path;
                        fileExt = files.file[i].name.split('.').pop();
                        var newpath='./public/product/product_'+pid+'/'+ 'product_'+pid+'_'+i+Date.now()+'.'+fileExt+'';
                        mv(oldpath, newpath, (err) => {
                            if (err){
                                res.send({code:33,msg:err});
                            }
                        });
                        name='product/product_'+pid+'/product_'+pid+'_'+i+Date.now()+'.'+fileExt+'';
                    }
                    const image = await pool.query("INSERT INTO product_image(`p_id`,`image`) VALUES(?,?)",[pid, name]);
                }
            }
            else{
                if(files.file.size)
                {    
                    var oldpath = files.file.path;
                    fileExt = files.file.name.split('.').pop();
                    var newpath='./public/product/product_'+pid+'/'+ 'product_'+pid+'_'+0+Date.now()+'.'+fileExt+'';
                    mv(oldpath, newpath, (err) => {
                        if (err){
                            res.send({code:33,msg:err});
                        }
                    });
                    name='product/product_'+pid+'/product_'+pid+'_'+0+Date.now()+'.'+fileExt+'';
                    const image = await pool.query("INSERT INTO product_image(`p_id`,`image`) VALUES(?,?)",[pid, name]);
                }
            }
            

            res.send({code:1, msg: "Product Inserted"})
        });
    }
    catch(err){
        return res.send({code:0,msg:err})
    }
});  



module.exports = router;