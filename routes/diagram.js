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
const csv = require('csv-parser');

const {
    save_directory
} = require('../helper/directory');
const { findSeries } = require('async');

router.post('/',function(req,res){
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
            // var CurrentDate = moment().format("YYYY-MM-DD");
            // console.log(CurrentDate)
            
            // const result = await pool.query('SELECT MAX(`diagram_id`) AS count FROM `diagram`');
            // console.log(result);
            // let x;
            // if(result[0].count)
            //     x= parseInt(result[0].count)+1;
            // if(!result[0].count)
            //     x=1;
            //     console.log(x);
                    
            if(files.file.size)
            {    
                var oldpath = files.file.path;
                fileExt = files.file.name.split('.').pop();
                let fileName = 'diagram/'+ 'diagram_'+Date.now()+'.'+fileExt+'';
                var newpath='./public/'+fileName;
                fs.rename(oldpath, newpath, (err) => {
                    if (err){
                        res.send({code:33,msg:err});
                    }
                });
                const result3 = await pool.query('INSERT INTO `diagram`(`diagram_img`, `page_number`,`diagram_desc`,`catalogue_id`) VALUES (?,?,?,?)',
                [fileName, fields.page_number, fields.description, fields.catalogue_id]);
            }
            else{
                const result3 = await pool.query('INSERT INTO `diagram`(`diagram_img`, `page_number`,`diagram_desc`,`catalogue_id`) VALUES (?,?,?,?)',
                ['', fields.page_number, fields.description, fields.catalogue_id]);
            }
            
        });
        res.send({code:1,msg:"success"})
    }
    catch(err){
        return res.send({code:0,msg:err})
    }
});  

router.post('/edit',function(req,res){
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
                    
            if(files.file.size)
            {    
                var oldpath = files.file.path;
                fileExt = files.file.name.split('.').pop();
                let fileName = 'diagram/'+ 'diagram_'+Date.now()+'.'+fileExt+'';
                var newpath='./public/'+fileName;
                fs.rename(oldpath, newpath, (err) => {
                    if (err){
                        res.send({code:33,msg:err});
                    }
                });
                const result3 = await pool.query('UPDATE diagram SET diagram_img=?,page_number=?,diagram_desc=?,catalogue_id=? WHERE diagram_id= ?',
                [fileName, fields.page_number, fields.description, fields.catalogue_id, fields.diagram_id]);
            }
            else{
                const result3 = await pool.query('UPDATE diagram SET page_number=?,diagram_desc=?,catalogue_id=? WHERE diagram_id= ?',
                [fields.page_number, fields.description, fields.catalogue_id, fields.diagram_id]);
            }
            res.send({code:1,msg:"success"})
            
        });
    }
    catch(err){
        return res.send({code:0,msg:err})
    }
}); 


router.get('/',  async (req,res)=>{
    try{
        const result = await pool.query("SELECT a.*,b.* FROM diagram AS a INNER JOIN catalogue AS b ON a.catalogue_id=b.catalogue_id");
        res.send({
            code:1,
            diagram: result
        })

    }catch(err){
        res.send({code:0,msg:err});
    }
});


router.post('/delete',  async (req,res)=>{
    try{
        const {
            diagram_id
        } = req.body;

        const result = await pool.query("DELETE FROM diagram WHERE diagram_id=?",[diagram_id]);
        res.send({
            code:1,
            msg:"Deleted"
        })

    }catch(err){
        res.send({code:0,msg:err});
    }
});

router.post('/import', async (req, res) => {
    try {
        const form = formidable({
            keepExtensions: true,
        });
        form.parse(req, (err, fields, files) => {
            if(err) {
                return res.status(200).send({
                    status: false,
                    message: 'Error in parsing form',
                });
            }
            
            // Client and CSV file
            const { payload } = req.body;
            const { csv_file } = files;
           

            // eslint-disable-next-line no-unused-vars
            const [_, ext] = csv_file.name.split(".");
            const filename = moment().valueOf() + "." + ext;

            const uploadPath = __dirname + '/../public/csv/diagrams/';

            const reader = fs.createReadStream(`${csv_file.path}`);
            const writer = fs.createWriteStream(`${uploadPath}${filename}`);
            
            reader.pipe(writer);
            reader.on('end', function() {

                let results = [];
                const headers = ['Page Number','Diagram Description','Catalogue Id'];

                fs.createReadStream(`${uploadPath}${filename}`)
                    .pipe(csv({
                        mapHeaders: ({index}) => {
                            return headers[index];
                        }
                    }))
                    .on('data', async (row) => {
                        results.push(row);
                    })
                    .on('end', async () => {
                        let message = '';
                        if(results.length > 0 && Object.keys(results[0]).length === headers.length){
                            for (let i = 0; i < results.length; i++) {
                                let row = results[i];
                                console.log(row);
                                try {
                                    result = await pool.query(`INSERT INTO diagram(diagram_img, page_number, diagram_desc, catalogue_id) VALUES (?,?,?,?) `, ['', row['Page Number'], row['Diagram Description'], row['Catalogue Id']]);
                                
                                } catch (err) {
                                    console.log(err);
                                    message = message + "Error in "+row['Page Number']+"\n";
                                }
                            }
                        }
                        else{
                            message = message + "INVALID COLUMN COUNT. PLEASE DOWNLOAD THE FORMAT BELOW AND TRY AGAIN\n"; 
                        }   

                        if(message.length == 0) {
                            res.status(200).send({
                                code: 1,
                                msg: 'Success',
                            });
                        } else {
                            res.status(200).send({
                                code: false,
                                msg: message,
                            });
                        }
                    });
            });
        });
        
    } catch (err) {
        console.error(err);

        res.status(200).send({
            code: 0,
            msg: 'Error in importing apps',
        });
    }   
});


module.exports = router;