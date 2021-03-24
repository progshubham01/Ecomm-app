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
    console.log(req.body)
    const {
        primary,
        secondary,
        tertiary
    } = req.body;
    try
    {
        let fields, pc_id, result;
        console.log(primary,secondary, tertiary, "sda");
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
            
        }
        // console.log(result)
        if(result && result.length > 0){
            fields = result[0].fields;
            pc_id = result[0].pc_id;
        }
        
        // console.log(fields, pc_id, "dz")
        res.send({code:1, msg: "Success", fields:fields ? JSON.parse(fields) : [], pc_id : pc_id})
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
            console.log(fields)
            console.log(files)
            var CurrentDate = moment().format("YYYY-MM-DD");
            console.log(CurrentDate);
            console.log(fields.gst_ids, "sadsa");
            const result3 = await pool.query('INSERT INTO `products`( `pc_id`, `diagram_id`, `ref_id`, `model_id`) VALUES (?,?,?,?)',
                [
                    fields.pc_id, 
                    fields.diagram_id, 
                    fields.ref_id,
                    fields.model_id,
                ]);
            const pid = result3.insertId;
            for(let i = 0; i<fields.totalPart; i++){
                const result_det = await pool.query('INSERT INTO product_details(product_id, part_name_id, part_number_id, brand_id, rate, barcode, hsn_id, gst_id, description, alternate_product_id) VALUES (?,?,?,?,?,?,?,?,?,?)',
                [
                    pid,
                    fields[`part_name_id${i}`],
                    fields[`part_number_id${i}`],
                    fields[`brand_id${i}`],
                    fields[`rate${i}`],
                    fields[`barcode${i}`],
                    fields[`hsn_id${i}`],
                    fields[`gst_ids${i}`],
                    fields[`description${i}`],
                    fields[`alternateProduct${i}`],
                    
                ]);

                const pd_id = result_det.insertId;

                var uploadDir = './public/product/product_'+pid+'/';
                const done = await save_directory(uploadDir)

                console.log(files[`file${i}`]);
                if(files[`file${i}`]){
                    if(files[`file${i}`].length){
                        for(let j=0; j< files[`file${i}`].length; j++)
                        {
                            if(files[`file${i}`][j].size)
                            {    
                                var oldpath = files[`file${i}`][j].path;
                                fileExt = files[`file${i}`][j].name.split('.').pop();
                                fileName = 'product/product_'+pid+'/'+ 'product_'+pid+'_'+i+Date.now()+'.'+fileExt+'';
                                var newpath='./public/'+fileName;
                                mv(oldpath, newpath, (err) => {
                                    if (err){
                                        res.send({code:33,msg:err});
                                    }
                                });
                            }
                            const image = await pool.query("INSERT INTO product_image(`pd_id`,`image`) VALUES(?,?)",[pd_id, fileName]);
                        }
                    }
                    else{
                        if(files[`file${i}`].size)
                        {    
                            var oldpath = files[`file${i}`].path;
                            fileExt = files[`file${i}`].name.split('.').pop();
                            fileName = 'product/product_'+pid+'/'+ 'product_'+pid+'_'+Date.now()+'.'+fileExt+'';
                            var newpath='./public/'+fileName;
                            mv(oldpath, newpath, (err) => {
                                if (err){
                                    res.send({code:33,msg:err});
                                }
                            });
                        
                            const image = await pool.query("INSERT INTO product_image(`pd_id`,`image`) VALUES(?,?)",[pd_id, fileName]);
                        }
                    }
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
        const result = await pool.query("SELECT p.*, d.diagram_desc, m.model_name FROM products AS p LEFT JOIN diagram d on d.diagram_id = p.diagram_id left join model m on m.model_id = p.model_id  order by p.p_id desc");
        let _result = [];
        let last_id = 0;
        let img = '';
        for(let i = 0; i<result.length; i++) {
            let fields = await pool.query("SELECT fields FROM product_category WHERE `pc_id` = ?",[result[i].pc_id]); 
            let product_details = await pool.query("SELECT * FROM product_details WHERE product_id = ?",[result[i].p_id]);
            let imageCount = 0;
            for(let j = 0; j < product_details.length; j++) {
                const images = await pool.query("select * from product_image where pd_id = ?", product_details[j].product_id);
                product_details[j].images = images;
                if(images.length > 0){
                    img = images[0].image;
                    imageCount = imageCount + images.length;
                }

            }
            
            result[i].product_details = product_details;
            result[i].fields = fields && fields.length > 0 ? JSON.parse(fields[0].fields) :  [];
            result[i].sampleImage = img;
            result[i].imageCount = imageCount-1;
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
            p_id
        } = req.body;

        const result = await pool.query("DELETE FROM products WHERE p_id= ?",[p_id]);
        const result1 = await pool.query("DELETE FROM product_details WHERE product_id= ?",[p_id]);

        res.send({code:1, msg: "Deleted product"});

    }catch(err){
        console.log(err);
        res.send({code:0, msg:err});
    }
});

router.post('/delete/part_number', async (req,res) =>{
    try{
        const {
            pd_id
        } = req.body;

        const result1 = await pool.query("DELETE FROM product_details WHERE id= ?",[pd_id]);

        res.send({code:1, msg: "Deleted product"});

    }catch(err){
        res.send({code:0, msg:err});
        console.log(err);
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
            console.log(fields)
            console.log(files)
            var CurrentDate = moment().format("YYYY-MM-DD");
            console.log(CurrentDate);
            console.log(fields.gst_ids, "sadsa");
            const result3 = await pool.query('UPDATE products SET pc_id=?,diagram_id=?,ref_id=?,model_id=? WHERE p_id= ?',
                [
                    fields.pc_id, 
                    fields.diagram_id, 
                    fields.ref_id,
                    fields.model_id,
                    fields.p_id
                ]);
            const pid = fields.p_id;
            const result_del = await pool.query('DELETE FROM product_details WHERE product_id = ?',[fields.p_id]);
            for(let i = 0; i<fields.totalPart; i++){
                const result_det = await pool.query('INSERT INTO product_details(product_id, part_name_id, part_number_id, brand_id, rate, barcode, hsn_id, gst_id, description, alternate_product_id) VALUES (?,?,?,?,?,?,?,?,?,?)',
                [
                    pid,
                    fields[`part_name_id${i}`],
                    fields[`part_number_id${i}`],
                    fields[`brand_id${i}`],
                    fields[`rate${i}`],
                    fields[`barcode${i}`],
                    fields[`hsn_id${i}`],
                    fields[`gst_ids${i}`],
                    fields[`description${i}`],
                    fields[`alternateProduct${i}`],
                    
                ]);

                const pd_id = result_det.insertId;

                var uploadDir = './public/product/product_'+pid+'/';
                const done = await save_directory(uploadDir)

                console.log(files[`file${i}`]);
                if(files[`file${i}`]){
                    if(files[`file${i}`].length){
                        for(let j=0; j< files[`file${i}`].length; j++)
                        {
                            if(files[`file${i}`][j].size)
                            {    
                                var oldpath = files[`file${i}`][j].path;
                                fileExt = files[`file${i}`][j].name.split('.').pop();
                                fileName = 'product/product_'+pid+'/'+ 'product_'+pid+'_'+i+Date.now()+'.'+fileExt+'';
                                var newpath='./public/'+fileName;
                                mv(oldpath, newpath, (err) => {
                                    if (err){
                                        res.send({code:33,msg:err});
                                    }
                                });
                            }
                            const image = await pool.query("INSERT INTO product_image(`pd_id`,`image`) VALUES(?,?)",[pd_id, fileName]);
                        }
                    }
                    else{
                        if(files[`file${i}`].size)
                        {    
                            var oldpath = files[`file${i}`].path;
                            fileExt = files[`file${i}`].name.split('.').pop();
                            fileName = 'product/product_'+pid+'/'+ 'product_'+pid+'_'+Date.now()+'.'+fileExt+'';
                            var newpath='./public/'+fileName;
                            mv(oldpath, newpath, (err) => {
                                if (err){
                                    res.send({code:33,msg:err});
                                }
                            });
                        
                            const image = await pool.query("INSERT INTO product_image(`pd_id`,`image`) VALUES(?,?)",[pd_id, fileName]);
                        }
                    }
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