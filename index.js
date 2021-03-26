const express = require("express");
const path = require('path');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const cors = require('cors')

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
const group = require('./routes/group');

app.set('view engine', 'ejs');

const PORT=process.env.PORT||9877;

// app.use(express.json()).use(express.urlencoded())
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname,'public')));
app.use(cors())


app.use((req,res,next)=>{
  res.locals.user=req.user||null;
  next();
});


app.use('/', login);
app.use('/catalogue', catalogue);
app.use('/brands', brands);
app.use('/diagrams', diagram);
app.use('/parts', parts);
app.use('/models', modals);
app.use('/hsn', hsn);
app.use('/products', product);
app.use('/product_category', product_category);
app.use('/group', group);

var server = app.listen(PORT,()=>{
  console.log(`Server started on port ${PORT}`);
});