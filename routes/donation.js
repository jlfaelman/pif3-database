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
function today() {
    let today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
    const yyyy = today.getFullYear();

    today = yyyy + '-' + mm + '-' + dd;
    return today;
}
function generateID() {
    return Math.random().toString(36).substring(2, 15) + "_" + Math.random().toString(36).substring(2, 15);
}

router.get('/:id', async (req, res) => {
    try {
        
        const id = req.params.id;
        const getDonation = await pool.query('SELECT * FROM  "DONATION_INFO" WHERE "Donation_ID" = $1', [id]);
        res.status(200).json({
            body: getDonation.rows,
            message: "Get Donation Success"
        });
        console.log("Get Donation Success");

    } catch (e) {
        res.status(500);
        console.log(e.message);
    }
});
// router.get('/donate/:id',async(req,res)=>{
//     try {
//         const getDonation = await pool.query('SELECT * FROM  "DONATION_INFO WHERE Fundraising_ID = $1"',[]);
//         res.status(200).json({
//             body: getDonationz.rows,
//             message: "Get Project Success"
//         });
//         console.log("Get Project Success");

//     } catch (e) {
//         res.status(500);
//         console.log(e.message);
//     }
// });

router.post("/donate", async (req, res) => {
    try {
        const id = generateID();
        const fundraiser = req.body.fundraiser;
        const fund = req.body.fund;
        const user = req.body.user;
        const type = req.body.type;
        const amount = req.body.amount;
        const anonymous = req.body.anonymous;
        const date = today();
        const addDonation = await pool.query(`
        INSERT INTO  "DONATION_INFO" ("Donation_ID","Funding_ID","Fundraiser_ID","User_ID","Donation_Type","Donation_Amount","is_Anonymous","created_At") VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING "Donation_ID";`, [id, fund, fundraiser, user, type, amount, anonymous, date]);
        const getUser = await pool.query(`SELECT * FROM  "USER_INFO" WHERE "User_ID" = $1 `, [user]);
        res.status(200).json({
            body: addDonation.rows,
            message: "Donation Success"
        });
        let mailOptions = {
            from: process.env.SENDER,
            to: getUser.rows[0].User_Email,
            subject: 'Pay It Forward Donation',
            html: `<div style="font-size: 35px;">Thank you for your kind donation!</div><br><br><br> <p>Pay it Forward Team thanks you for bringing joy and help to others.<br><br>From: Pay It Forward Team</p> `
        };

        transporter.sendMail(mailOptions, (err, res) => {
            if (err) {
                console.log(err);
            }
            else console.log('Email Sent');
        });
        console.log("Donation Success");
    } catch (e) {
        console.log(e.message);
        res.status(500).json({
            error: e.message,
        })
    }
});
module.exports = router;