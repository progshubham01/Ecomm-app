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

router.post('/', async (req,res)=>{
    try{
        const {
            part_name,
            alternate_part_name
        } = req.body;

        const result = await pool.query("INSERT INTO part_name (`part_name`) VALUES(?)",[part_name]);

        const id = result.insertId; 

        const result2 = await pool.query("INSERT INTO a_part_name(`part_name_id`,`a_name`) VALUES(?,?)",[id, alternate_part_name]);

        res.send({code:1,msg:"Inserted"});

    }catch(err){
        return res.send({code:0,msg:err});
    }
});

router.post('/edit', async (req,res)=>{
    try{
        const {
            part_name,
            alternate_part_name,
            part_name_id
        } = req.body;

        const result = await pool.query("UPDATE part_name SET `part_name`=? WHERE part_name_id=?",[part_name, part_name_id]);

        const result2 = await pool.query("UPDATE a_part_name SET `a_name`= ? WHERE part_name_id=?",[alternate_part_name, part_name_id]);

        res.send({code:1,msg:"Updated"});

    }catch(err){
        return res.send({code:0,msg:err});
    }
});

router.post('/delete', async (req,res)=>{
    try{
        const {
            part_name_id 
        } = req.body;

        const result = await pool.query("DELETE FROM part_name WHERE part_name_id = ?", [part_name_id]);

        res.send({
            code:1,
            msg:"Deleted"
        })


    }catch(err){
        res.send({code:0, msg:err})
    }
})

router.get('/', async (req,res)=>{
    try{
        const result = await pool.query("SELECT a.*,b.* FROM part_name AS a INNER JOIN a_part_name AS b ON a.part_name_id = b.part_name_id order by a.part_name_id desc ");
        res.send({
            code:1,
            part: result
        })

    }catch(err){
        console.log(err);
        res.send({code:0,msg:err});
    }
})



router.post('/part_no/edit', async (req,res)=>{
    try{
        const {
            part_number,
            alternate_part_number,
            part_number_id
        } = req.body;

        const result = await pool.query("UPDATE part_number SET `part_number`=? WHERE part_number_id=?",[part_number, part_number_id]);

        const result2 = await pool.query("UPDATE a_part_number SET  `a_number`=? WHERE part_number_id = ?",[alternate_part_number, part_number_id]);

        res.send({code:1,msg:"Updated"});

    }catch(err){
        return res.send({code:0,msg:err});
    }
});

router.post('/part_no', async (req,res)=>{
    try{
        const {
            part_number,
            alternate_part_number
        } = req.body;

        const result = await pool.query("INSERT INTO part_number (`part_number`) VALUES(?)",[part_number]);

        const id = result.insertId; 

        const result2 = await pool.query("INSERT INTO a_part_number(`part_number_id`,`a_number`) VALUES(?,?)",[id, alternate_part_number]);

        res.send({code:1,msg:"Inserted"});

    }catch(err){
        return res.send({code:0,msg:err});
    }
});

router.post('/part_no/delete', async (req,res)=>{
    try{
        const {
            part_number_id 
        } = req.body;

        const result = await pool.query("DELETE FROM part_number WHERE part_number_id = ?", [part_number_id]);

        res.send({
            code:1,
            msg:"Deleted"
        })


    }catch(err){
        res.send({code:0, msg:err})
    }
})

router.get('/part_no', async (req,res)=>{
    try{
        const result = await pool.query("SELECT a.*,b.* FROM part_number AS a INNER JOIN a_part_number AS b ON a.part_number_id = b.part_number_id order by a.part_number_id desc ");
        res.send({
            code:1,
            part: result
        })

    }catch(err){
        res.send({code:0,msg:err});
    }
})

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
            const { part_type } = fields;
           
            // eslint-disable-next-line no-unused-vars
            const [_, ext] = csv_file.name.split(".");
            const filename = moment().valueOf() + "." + ext;

            const uploadPath = __dirname + '/../public/csv/parts/';

            const reader = fs.createReadStream(`${csv_file.path}`);
            const writer = fs.createWriteStream(`${uploadPath}${filename}`);
            
            reader.pipe(writer);
            reader.on('end', function() {

                let results = [];
                let headers;
                if(part_type === "part_name"){
                    headers = ['Part Name','Additional Name'];
                }
                else if( part_type === "part_number"){
                    headers = ['Part Number','Additional Number'];
                }

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

                                    if(part_type === "part_name"){
                                        let result = await pool.query(`INSERT INTO part_name(part_name) VALUES (?) `, [row['Part Name']]);

                                        const pid = result.insertId;
    
                                        let result1 = await pool.query(`INSERT INTO a_part_name(part_name_id, a_name) VALUES (?,?) `, [pid, row['Additional Name']]);
                                    }
                                    else if( part_type === "part_number"){
                                        let result = await pool.query(`INSERT INTO part_number(part_number) VALUES (?) `, [row['Part Number']]);

                                        const pid = result.insertId;

                                        let result1 = await pool.query(`INSERT INTO a_part_number(part_number_id, a_number) VALUES (?,?) `, [pid, row['Additional Number']]);
                                    }
                                    
                                
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