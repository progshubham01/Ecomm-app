const express = require("express");
const path = require('path');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');

const app = express();

const login = require('./routes/login');
const parts = require('./routes/parts');
const diagram = require('./routes/diagram');

app.set('view engine', 'ejs');

const PORT=process.env.PORT||9555;

// app.use(express.json()).use(express.urlencoded())
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname,'public')));


app.use((req,res,next)=>{
  res.locals.user=req.user||null;
  next();
});


app.use('/', login);
app.use('/mechanic', mechanic)

var server = app.listen(PORT,()=>{
  console.log(`Server started on port ${PORT}`);
});