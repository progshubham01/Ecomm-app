const router = require('express').Router();
const nodemailer = require('nodemailer');
var crypto = require('crypto');
var async = require('async');
// const db_change = require('../helper/db_change');
const pool = require('../config/database');
  
  
router.post('/', function(req, res, next) {      
   console.log(req.body);
   const {
       email
   } = req.body;
  // The Email is Sent//
  async.waterfall([
    function(done) {
       crypto.randomBytes(20, function(err, buf) {
        var token = buf.toString('hex');
          done(err, token);
      });
    },function(token, done) {
        var sql="SELECT * FROM login WHERE email=?";
        conn.query(sql,[email],function(err, user) {
            if (!user.length) {
                res.send({code:0, msg:'No account with that email address exists.'});
            }
            user.resetPasswordToken = token;
            user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

            var sql1="INSERT into reset_token(`token`,`expires`,`user_id`) VALUES ('"+user.resetPasswordToken+"','"+user.resetPasswordExpires+"','"+user[0].id+"')";
            conn.query(sql1,function(err,result){
                if(err)throw err;
                      done(err, token, user);
                });
            });
        },
        function(token, user, done) {
            console.log(user[0].email)
            var smtpTransport = nodemailer.createTransport({
                host: process.env.MAIL_HOST,
                port: process.env.MAIL_PORT,
                secure: false,
                auth: {
                    user: process.env.MAIL_USER,
                    pass: process.env.MAIL_PASS,
                }
            });
                  var mailOptions = {
                    from: '"CodeBucket Solutions"'+process.env.MAIL_USER+'',
                    to: user[0].email,
                    subject: 'Online Classroom Password Reset',
                    text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
                      'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
                      'http://' + req.headers.host + '/forgot/reset/' + token + '\n\n' +
                      'If you did not request this, please ignore this email and your password will remain unchanged.\n'
                  };
                  let info = smtpTransport.sendMail(mailOptions, function(err) {
                    console.log('mail sent');
                    res.send({code:1, msg:'An e-mail has been sent your mail with further instructions.'});
                     done(err, 'done');
                  });
                }
              ], function(err) {
                if (err) return next(err);
              });
        });

router.get('/reset/:token', db_change,function(req, res) {
  pool.getConnection((err, conn) => {
    if (err) throw err;  

    const {database} = res;

    conn.changeUser({database:database}, (e) => {
  console.log(req.params);
  if(conn != undefined){
    // console.log(pool)
    var sql="SELECT * FROM reset_token WHERE token='"+req.params.token+"'";
    conn.query(sql,function(err,result){
      if(err)throw err;
      if(!result.length){
        req.flash('error', 'Password reset token is invalid.');
        return res.redirect('/forgot');
      }
      if(result[0].expires < Date.now()){
        req.flash('error', 'Password reset token has expired.');
        return res.redirect('/forgot');
      }
      res.render('reset_password.ejs', {
        token: req.params.token,
        error:req.flash('error'),
        success:req.flash('success')
      });
    });
  }
  else{
      req.flash('error', 'Password reset token is invalid Or has been expired.');
      return res.redirect('/forgot');
  }
});
  });
});

router.post('/reset/:token', function(req, res) {  
  async.waterfall([
    function(done) {
      var sql="SELECT a.token,a.user_id,a.expires,b.email FROM reset_token AS a INNER JOIN login AS b ON a.user_id=b.id WHERE a.token='"+req.params.token+"'";
      const user = await pool.query(sql);        
      console.log("here",user)
        if(req.body.password === req.body.confirm) {
          user.resetPasswordToken = undefined;
          user.resetPasswordExpires = undefined;
          var sql1="UPDATE `login` SET password='"+req.body.password+"' WHERE `id`='"+user[0].user_id+"'";
          const result = await pool.query(sql1);
            if(err)throw err;
            done(err, user);
        } else {
          return res.send({msg:"Passwords Donot Match"});
        }
    },
    function(user, done) {
      console.log(user)
      var smtpTransport = nodemailer.createTransport({
        host: process.env.MAIL_HOST,
        port: process.env.MAIL_PORT,
        secure: false,
        auth: {
          user: process.env.MAIL_USER,
          pass: process.env.MAIL_PASS,
        }
      });
      var mailOptions = {
        from: '"CodeBucket Solutions"'+process.env.MAIL_USER+'',
        to: user[0].email,
        subject: 'Your password has been changed',
        text: 'Hello,\n\n' +
          'This is a confirmation that the password for your account has just been changed.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        req.flash('success', 'Success! Your password has been changed.');
        done(err);
      });
    }
  ], function(err) {
    res.redirect('/login');
  });
});

  
  module.exports = router;