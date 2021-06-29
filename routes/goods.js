const express = require('express');
const pool = require("../conn");
const multer = require('multer');
const router = express.Router();
const path = require('path');

function today() {
    let today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    today = yyyy + '-' + mm + '-' + dd;
    return today;
}
function generateID() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}
router.get('/:id', async (req, res) => {
    try {
        const id = req.params.id
        const getGoods = await pool.query('SELECT * FROM  "GOODS_INFO" WHERE "Fundraiser_ID" = $1', [id])
        const getFundraising = await pool.query(`
        SELECT * FROM  "FUNDRAISER_INFO" WHERE "Fundraiser_ID" = $1`, [id]);

        const getUser = await pool.query(`
        SELECT * FROM  "USER_INFO" WHERE "User_ID" = $1`, [getFundraising.rows[0].User_ID]);


        res.status(200).json({
            body: {
                user:getUser.rows,
                fundraiser:getFundraising.rows,
                goods:getGoods.rows
            },
            message: "Get Goods Success"
        })

        console.log("Get Goods Success")
    } catch (e) {
        res.status(500).json({
            e: e.message
        })
        console.log(e.message);
    }
})

router.post('/add', async (req, res) => {
    try {
        const id = generateID();
        const goods = req.body;
        const addGoods = await pool.query(`
        INSERT INTO  "GOODS_INFO" ("Goods_ID","Fundraiser_ID","Goods_Item","Goods_Quantity","Goods_Address","Goods_Received","is_Reached") VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *;`
            , [id, goods.fundraiser, goods.item, goods.quantity, goods.address, '0', false]);
        res.status(200).json({
            body: addGoods.rows,
            message: "Add Goods Success"
        })
        console.log("Add Goods Success")
    } catch (e) {
        res.status(500).json({
            e: e.message
        })
        console.log(e.message);
    }
});


module.exports = router;