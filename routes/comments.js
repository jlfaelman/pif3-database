const express = require('express');
const pool = require("../conn");
const router = express.Router();
function today() {
    let today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
    const yyyy = today.getFullYear();

    today =   yyyy +'-'+  mm  +'-' + dd  ;
    return today;
}
function generateID() {
    return Math.random().toString(36).substring(2, 15) + "_" + Math.random().toString(36).substring(2, 15);
}

// get all
router.get('/', async(req,res)=>{
    try {
        const getComments = await pool.query('SELECT * FROM public."COMMENT_TABLE";');
        res.status(200).json({
            body:getComments.rows,
            message: "Get Message Success"
        });
        console.log("Get Message Success");
    } catch (e) {
        console.log(e.message);
        res.status(500).json({
            error:e.message
        });
    }
});
// add
router.post('/add', async(req,res)=>{
    try {
        const id = generateID();
        const comment = req.body;
        const date = today();
        const addComments = await pool.query(`
        INSERT INTO public."COMMENT_TABLE" ("Comment_ID","User_ID","Fundraiser_ID","Donation_ID","Comment_Desc","Comment_User","created_At") VALUES ($1,$2,$3,$4,$5,$6,$7) `,[id,comment.user,comment.fundraiser,comment.donation,comment.description,comment.name,date]);
        res.status(200).json({
                body:addComments.rows,
                message: "Transaction Begin"
        });
        console.log("Add Message Success");
    } catch (e) {
        console.log(e.message);
        res.status(500).json({
            error:e.message
        });
    }
});
module.exports = router;