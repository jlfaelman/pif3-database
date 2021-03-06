const express = require('express');
const pool = require("../conn");
const router = express.Router();
const nodemailer = require('nodemailer');
const { google } = require('googleapis');
require('dotenv').config();
// Transporter for Gmail API

const oAuth = new google.auth.OAuth2(process.env.CLIENT_ID, process.env.CLIENT_SECRET, process.env.REDIRECT_URI)

function generateID() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// LOGIN
// Get User
// router.get("/get", async (req, res) => {
//     try {
//         const getUser = await pool.query('SELECT * FROM  "USER_INFO"');
//         res.status(200).json(getUser.rows);
//         console.log("Get Request Success");
//     } catch (e) {
//         res.status(500);
//         console.log(e.message);
//     }
// });
// Login User 
router.post("/login", async (req, res) => {
    try {
        const user = req.body;
        if (user.Email === '' || undefined && user.Pass === '' || undefined) {
            res.status(500).json({
                message: "Invalid request"
            });
        }
        else {
            const getUser = await pool.query(`SELECT * FROM  "USER_INFO" WHERE "User_Email" = $1 AND "User_Password" = $2`, [user.Email, user.Pass]);
            res.json({
                body: getUser.rows,
                message: "Login Success"
            });
            console.log("Login Request Success");
        }
    }
    catch (e) {
        res.status(500).json({
            error: e.message
        })
        console.log(e.message);
    }
});
// Register User
router.post("/register", async (req, res) => {
    try {

        const user = req.body;
        const id = generateID();
        oAuth.setCredentials({ refresh_token: process.env.REFRESH_TOKEN })
        const accessToken = await oAuth.getAccessToken();
        let transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                type: 'OAuth2',
                user: process.env.SENDER,
                clientId: process.env.CLIENT_ID,
                clientSecret: process.env.CLIENT_SECRET,
                refreshToken: process.env.REFRESH_TOKEN,
                accessToken: accessToken
            }
        });
        const addUser = await pool.query(`INSERT INTO  "USER_INFO" ("User_ID","User_First","User_Last","User_Email","User_Password","Is_Verified") VALUES ($1,$2,$3,$4,$5,false) RETURNING "User_ID","User_Last","User_First";`, [id, user.First, user.Last, user.Email, user.Pass]);
        res.json({
            body: addUser.rows,
            message: "Register Success"
        });
        console.log("Register Success");
        let link = `${process.env.URL}/user/verify?id=${id}`;
        let mailOptions = {
            from: process.env.SENDER,
            to: user.Email,
            subject: 'Pay It Forward Account Registration',
            html: `<div style="font-size: 35px;">Account Created Successfully!</div><br><br><br> <p>Your Pay It Forward Account has been created successfully <br><br><br> but to use it for donation and fundraisers, you must verify your account. Click <a href="${link}">here</a>.</p> `
        };

        transporter.sendMail(mailOptions, (err, res) => {
            if (err) {
                console.log(err);
            }
            else console.log('Email Sent');
        });


    } catch (e) {
        console.log(e.message);
        res.status(500).json({
            error: e.message,
        })
    }
});

router.get("/verify/:id", async (req, res) => {
    try {
        oAuth.setCredentials({ refresh_token: process.env.REFRESH_TOKEN })
        const accessToken = await oAuth.getAccessToken();
        let transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                type: 'OAuth2',
                user: process.env.SENDER,
                clientId: process.env.CLIENT_ID,
                clientSecret: process.env.CLIENT_SECRET,
                refreshToken: process.env.REFRESH_TOKEN,
                accessToken: accessToken
            }
        });
        const id = req.params.id;
        const verifyUser = await pool.query(`UPDATE  "USER_INFO" SET "Is_Verified" = true WHERE "User_ID"  = $1 RETURNING "User_Email";`, [id]);
        let mailOptions = {
            from: process.env.SENDER,
            to: verifyUser.rows[0].User_Email,
            subject: 'Pay It Forward Account Verification',
            html: `<div style="font-size: 35px;">Account Verified Successfully!</div><br><br><br> <p>Your Pay It Forward Account has been verified successfully!</p> `
        };

        transporter.sendMail(mailOptions, (err, res) => {
            if (err) {
                console.log(err);
            }
            else console.log('Email Sent');

        });
        res.status(200).json({
            message: "User Verified Successfuly"
        });
        console.log("User Verified")
    } catch (e) {
        console.log(e.message);
        res.status(500).json({
            error: e.message,
        })
    }

});



module.exports = router;