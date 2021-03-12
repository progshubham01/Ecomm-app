var mysql = require('mysql');
const util = require("util");

var pool = mysql.createConnection({multipleStatements: true,
  connectionLimit : 100,
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'ecomm',
  charset: 'UTF8MB4_GENERAL_CI'
});

// Promisify for Node.js async/await.

pool.query = util.promisify(pool.query);

module.exports = pool;
