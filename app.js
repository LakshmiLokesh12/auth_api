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
    user: 'your_email@gmail.com',
    pass: 'your_password',
  },
});

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token == null) return res.sendStatus(401);
  verifyToken(token)
  next()
};

app.post('/register', (req, res) => {
  const { name, email, password } = req.body;
  const otp = generateOTP();

  const query= 'INSERT INTO users (name, email, password, otp) VALUES (?, ?, ?, ?)';
   const values=[name, email, password, otp];
  db(query, values, (err, result) => {
    res.send(result);
  });

//   db.query(
//    ,
//     ,
//     (err) => {
//       if (err) throw err;
//       const mailOptions = {
//         from: 'your_email@gmail.com',
//         to: email,
//         subject: 'OTP Verification',
//         text: `Your OTP for email verification is: ${otp}`,
//       };
//       transporter.sendMail(mailOptions, (error) => {
//         if (error) throw error;
//         console.log('OTP sent to email:', email);
//         res.status(200).send('OTP sent to email');
//       });
//     }
//   );
});

app.post('/verify', (req, res) => {
    const { email, otp } = req.body;
  
    db.query(
      'SELECT * FROM users WHERE email = ? AND otp = ?',
      [email, otp],
      (err, results) => {
        if (err) throw err;
        if (results.length === 0) {
          return res.status(400).send('Invalid OTP');
        }
  
        db.query(
          'UPDATE users SET verified = TRUE WHERE email = ?',
          [email],
          (err) => {
            if (err) throw err;
            console.log('Account verified:', email);
            res.status(200).send('Account verified');
          }
        );
      }
    );
  });



  app.post('/login', (req, res) => {
    const { email, password, mobile, otp } = req.body;
  
    if (email && password) {
      db.query(
        'SELECT * FROM users WHERE email = ? AND password = ? AND verified = TRUE',
        [email, password],
        (err, results) => {
          if (err) throw err;
          if (results.length === 0) {
            return res.status(400).send('Invalid email or password');
          }
  
          const user = { id: results[0].id, email: results[0].email };
          const accessToken = generateAccessToken(user);
          const refreshToken = generateRefreshToken(user);
          db.query(
            'UPDATE users SET refresh_token = ? WHERE id = ?',
            [refreshToken, results[0].id],
            (err) => {
              if (err) throw err;
              res.json({ accessToken, refreshToken });
            }
          );
        }
      );
    } else if (mobile && otp) {
      db.query(
        'SELECT * FROM users WHERE email = ? AND otp = ? AND verified = TRUE',
        [mobile, otp],
        (err, results) => {
          if (err) throw err;
          if (results.length === 0) {
            return res.status(400).send('Invalid mobile or OTP');
          }
  
          const user = { id: results[0].id, email: results[0].email };
          const accessToken = generateAccessToken(user);
          const refreshToken = generateRefreshToken(user);
          db.query(
            'UPDATE users SET refresh_token = ? WHERE id = ?',
            [refreshToken, results[0].id],
            (err) => {
              if (err) throw err;
              res.json({ accessToken, refreshToken });
            }
          );
        }
      );
    } else {
      res.status(400).send('Invalid request');
    }
  });

  
  app.post('/refresh', (req, res) => {
    const refreshToken = req.body.refreshToken;
  
    if (refreshToken == null) {
      return res.sendStatus(401);
    }
  
    db.query(
      'SELECT * FROM users WHERE refresh_token = ?',
      [refreshToken],
      (err, results) => {
        if (err) throw err;
        if (results.length === 0) {
          return res.sendStatus(403);
        }
  
        const user = { id: results[0].id, email: results[0].email };
        const accessToken = generateAccessToken(user);
        res.json({ accessToken });
      }
    );
  });
  
  
app.listen(8080,()=>{
    console.log("Created Server");
})