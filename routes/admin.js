const express = require('express');
const pool = require("../conn");
const router = express.Router();
const nodemailer = require('nodemailer');

// Transporter for Gmail API
let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.SENDER,
        pass: process.env.PASSWORD
    }
});

// admin login
router.post('/login',async(req,res)=>{
    try {
        const creds = req.body;
        const getLogin = await pool.query('SELECT * FROM "ADMIN_INFO" WHERE "Admin_User" = $1 AND "Admin_Pass" = $2' ,[creds.user,creds.password]);
        res.status(200).json({
            body:getLogin.rows,
            message:"Login Success"
        })
        console.log('Login Success');
    } catch (e) {
        res.status(500).json({
            error: e.message
        })
        console.log(e.message);
    }
})

router.get('/validation',async(req,res)=>{
    try {
        const getValidation = await pool.query('SELECT * FROM "VALIDATION_INFO" WHERE "Fundraiser_ID" = $1 ' ,[req.query.id]);
        res.status(200).json({
            body:getValidation.rows,
            message:"Get Validation Success"
        })
        console.log("Get Validation Success")
    } catch (e) {
        res.status(500).json({
            error: e.message
        })
        console.log(e.message);
    }   
})
router.post('/status',async(req,res)=>{
    try {
        const body = req.body;
        const setStatus = await pool.query(`
        UPDATE  "FUNDRAISER_INFO"
        SET "Fundraiser_Status" = $2
        WHERE "Fundraiser_ID"  = $1;
        ` ,[body.id,body.status]);
        res.status(200).json({
            body:setStatus.rows,
            message:"Update Success"
        })
        console.log('Update Success');
    } catch (e) {
        res.status(500).json({
            error: e.message
        })
        console.log(e.message);
    }
})

// get Users
router.get('/users', async(req,res)=>{
    try {
        const getUsers = await pool.query(`SELECT * FROM  "USER_INFO"`)
        res.status(200).json({
            body:getUsers.rows,
            message:"Get User Success"
        })
    } catch (e) {
        res.status(500).json({
            error: e.message
        })
        console.log(e.message);
    }
});
// get Users
router.get('/users/page/:id', async(req,res)=>{
    try {
        const getUsers = await pool.query(`SELECT * FROM  "USER_INFO" WHERE "User_ID" =  $1 `,[req.params.id]);
        const getProject = await pool.query(`SELECT * FROM  "FUNDRAISER_INFO" WHERE "User_ID" = $1`, [req.params.id]);
        res.status(200).json({
            body:{
                user:getUsers.rows,
                fundraising:getProject.rows
            },
            message:"Get User Success"
        })
        console.log(getUsers.rows)
        console.log("Get User Success")
    } catch (e) {
        res.status(500).json({
            error: e.message
        })
        console.log(e.message);
    }
});


module.exports = router;