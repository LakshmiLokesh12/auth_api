require ('dotenv').config();
const express = require('express');
const {generateOTP,
    generateAccessToken,
    generateRefreshToken,
    verifyToken}=require('./common/common');

const nodemailer = require('nodemailer');

const {db}=require('./dbconnection/connection');

const app = express();
app.use(express.json());

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user:process.env.EMAIL_USERNAME ,
    pass: process.env.EMAIL_PASSWORD,
  },
});


app.post('/register', (req, res) => {
  const { name, email, password } = req.body;
  const otp = generateOTP();

  const query= 'INSERT INTO users (name, email, password, otp) VALUES (?, ?, ?, ?)';
   const values=[name, email, password, otp];
  db(query, values, (err, result) => {
    if(err){
      res.send(err);
    }
    res.send(result);
  });


      const mailOptions = {
        from: 'lakshmilokesh12@gmail.com',
        to: email,
        subject: 'OTP Verification',
        text: `Your OTP for email verification is: ${otp}`,
      };
      transporter.sendMail(mailOptions, (error) => {
        if (error) throw error;
        console.log('OTP sent to email:', email);
        res.status(200).send('OTP sent to email');
      });
    }
  );


app.post('/verify', (req, res) => {
    const { email, otp } = req.body;
    console.log({email,otp});
    try{ if(email && otp){
      const query= 'SELECT * FROM users WHERE email = ? AND otp = ?';
      const values=[email, otp];
   
      db(query, values, (err, results) => {
       if (err) throw err;
       console.log(results);      
           if (results.length === 0) {
              res.status(400).send('Invalid OTP');
        }
     });
   }
   
   else{
     res.send("Please fill All details")
   }
   
   
   const query= 'UPDATE users SET verified = true WHERE email = ?';
    
   const values= [email];
      db(query, values, (err, results) => {
       if (err) throw err;
               console.log('Account verified:', email);
               res.status(200).send('Account verified');
        }
     );}
     catch(err){
       res.send(err);
     }
    });
   
     app.post('/login', (req, res) => {
       const { email, password} = req.body;
     if(req.body?.access_token){
       const access_token=req.body?.access_token;
       const query='SELECT * FROM users WHERE access_token = ?';
       const values=[access_token];
       db(query, values, (err, results) => {
         if (err) throw err;
         if (results.length === 0) {
           return res.sendStatus(403);
         }
   
           res.json({message:`Hello ${results[0].name}`});       
         })
     }
     if (email && password) {
        
         const query='SELECT * FROM users WHERE email = ? AND password = ? AND verified = TRUE';
         const values=[email, password];
         db(query, values, (err, results) => {
      
         if (err) throw err;
             if (results.length === 0) {
                res.status(400).send('Invalid email or password');
             }
     
        
             const user = { id: results[0].id, email: results[0].email };
             const access_token = generateAccessToken(user);
             
   
             const query1='UPDATE users SET access_token = ? WHERE id = ?';
             const values1= [access_token, results[0].id];
             db(query1, values1, (err, result) => {
          
             if (err) throw err;
             if (err) throw err;
             res.json({ access_token });
     
         });
       });
       } 
     });
   
     
     app.post('/refresh', (req, res) => {
       const refreshToken = req.body.refreshToken;
     
       if (refreshToken == null) {
         return res.sendStatus(401);
       }
     
       const query='SELECT * FROM users WHERE access_token = ?';
       const values=[refreshToken];
       db(query, values, (err, results) => {
         if (err) throw err;
         if (results.length === 0) {
           return res.sendStatus(403);
         }
           const user = { id: results[0].id, email: results[0].email };
           const access_token = generateAccessToken(user);
          
          
          //update access Token
          const query1='UPDATE users SET access_token = ? WHERE id = ?';
          const values1= [access_token, results[0].id];
          db(query1, values1, (err, result) => {
       
          if (err) throw err;
          if (err) throw err;
          res.json({ access_token });
          
          });
         
     });
   })
     
   app.listen(8080,()=>{
       console.log("Created Server");
   })
   
  
    