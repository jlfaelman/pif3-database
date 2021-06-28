const express = require('express');
const pool = require("../conn");
const router = express.Router();
const nodemailer = require('nodemailer');

router.get('/',(async(req,res)=>{
    try {

        const reference = await pool.query(`
        SELECT * FROM public."REF_PROJECT_TYPE" `);
        res.status(200).json({
            body: reference.rows,
            message: "Get Reference Success"
        });

    } catch (e) {
        console.log(e.message);
        res.status(500).json({
            error: e.message,
        })
    }
}));


module.exports = router;