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

            const uploadPath = __dirname + '/../public/csv/catalogue/';

            const reader = fs.createReadStream(`${csv_file.path}`);
            const writer = fs.createWriteStream(`${uploadPath}${filename}`);
            
            reader.pipe(writer);
            reader.on('end', function() {

                let incomp = new Set();
                let avai = new Set();
                let ae_check = new Set();
                let results = [];
                const headers = ['Name','Year of Publication','No of Diagrams','Description'
                ];

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
                                result = await pool.query(`INSERT INTO catalogue(name, year_of_publication, no_of_diagrams, description) VALUES (?,?,?,?) `, [row['Name'], row['Year of Publication'], row['No of Diagrams'], row['Description']]);
                               
                            } catch (err) {
                                console.log(err);
                               message = message + "Error in "+row['Name']+"\n";
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