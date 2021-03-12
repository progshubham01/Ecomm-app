const jwt = require('jsonwebtoken');
const keys=require('../config/keys');
var jwtDecode = require('jwt-decode');
var mysql = require('mysql');

//Authorization Function//
var authorization = function verifyToken(req, res, next) {
    if (req.headers["authorization"]) {
      const bearerHeader = req.headers["authorization"];
      if (bearerHeader) {
        const bearer = bearerHeader.split(" ");
        const bearerToken = bearer[1];
        req.token = bearerToken;
        jwt.verify(req.token, keys.SECRET, function (err, decoded) {
          console.log("here", decoded);
          
          res.decoded = decoded.id;
  
          var auth = { auth: false, message: "Failed to authenticate token." };
          if (err) return res.status(500).send(auth);
          else {
            next();
          }
        });
      } else {
        res.sendStatus(403);
      }
    } else {
      next();
    }
  };
  

module.exports = authorization;