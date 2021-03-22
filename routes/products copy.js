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


router.post('/',function(req,res){
    const {
        part_no,
        diagram_no,
        group_name,
        group_desc,
        total,
        rate_per_piece,
        number_of_pieces,
        part_number_id,
        total_per_piece,
        part_number_id,
        reference_id
    } = req.body;
    try
    {
            
            const result3 = await pool.query('INSERT INTO group_category(group_id, part_no, daigram_id, group_name, group_desc, total)  VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
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
            

            res.send({code:1, msg: "Product Inserted"})
        
    }
    catch(err){
        return res.send({code:0,msg:err})
    }
});  



router.get('/', async (req,res)=>{
    try{
        const result = await pool.query("SELECT d.p_id, a.part_name,b.part_number,c.brand_name,d.rate,d.description, p.image FROM products AS d LEFT JOIN part_name AS a ON a.part_name_id = d.part_name_id LEFT JOIN part_number AS b ON d.part_number_id = b.part_number_id LEFT JOIN brand AS c ON d.brand_id = c.brand_id left join  product_image p on d.p_id = p.p_id");

        let _result = [];
        let last_id = 0;
        result.forEach((r) =>{
            if(last_id != r.p_id){
                last_id = r.p_id;
                _result.push(r);
            }
        })

        res.send({
            code:1,
            product: _result
        })

    }catch(err){
        res.send({code:0,msg:err});
    }
})

router.delete('/', async (req,res) =>{
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