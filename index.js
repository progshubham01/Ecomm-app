const express = require("express");
const path = require('path');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');

const app = express();

const login = require('./routes/login');
const parts = require('./routes/parts');
const diagram = require('./routes/diagram');
const brands = require('./routes/brands');
const catalogue = require('./routes/catalouge');
const modals = require('./routes/modals'); 
const hsn = require('./routes/hsn');
const product = require('./routes/products');
const product_category = require('./routes/product_category');

app.set('view engine', 'ejs');

const PORT=process.env.PORT||9876;

// app.use(express.json()).use(express.urlencoded())
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname,'public')));


app.use((req,res,next)=>{
  res.locals.user=req.user||null;
  next();
});


app.use('/', login);
app.use('/catalogue', catalogue);
app.use('/brands', brands);
app.use('/diagram', diagram);
app.use('/parts', parts);
app.use('/models', modals);
app.use('/hsn', hsn);
app.use('/product', product);
app.use('/product_category', product_category);

var server = app.listen(PORT,()=>{
  console.log(`Server started on port ${PORT}`);
});