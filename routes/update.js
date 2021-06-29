const express = require('express');
const pool = require("../conn");
const router = express.Router();
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

// get all
router.get('/', async (req, res) => {
    try {
        const getUpdates = await pool.query('SELECT * FROM  "UPDATE_TABLE";');
        res.status(200).json({
            body: getUpdates.rows,
            message: "Get Update Success"
        });
        console.log("Get Update Success");
    } catch (e) {
        console.log(e.message);
        res.status(500).json({
            error: e.message
        });
    }
});
// get from id
router.get('/:id', async (req, res) => {
    try {
        const id = req.params.id
        const getUpdates = await pool.query(`
        SELECT * FROM  "UPDATE_TABLE" WHERE "Fundraiser_ID" = $1
        ORDER BY "created_At" DESC
        `, [id]);
        res.status(200).json({
            body: getUpdates.rows,
            message: "Get Update Success"
        });
        console.log("Get Update Success");
    } catch (e) {
        console.log(e.message);
        res.status(500).json({
            error: e.message
        });
    }
});
// get 3
router.get('/', async (req, res) => {
    try {
        const getUpdates = await pool.query('SELECT * FROM  "UPDATE_TABLE";');
        res.status(200).json({
            body: getUpdates.rows,
            message: "Get Update Success"
        });
        console.log("Get Update Success");
    } catch (e) {
        console.log(e.message);
        res.status(500).json({
            error: e.message
        });
    }
});

router.post('/add', async (req, res) => {
    try {
        const id = generateID();
        const update = req.body;
        const date = today();
        const addUpdate = await pool.query('INSERT INTO  "UPDATE_TABLE" ("Update_ID","Fundraiser_ID","Update_Desc","created_At") VALUES ($1,$2,$3,$4) RETURNING "Update_ID"', [id, update.fundraiser, update.description, date]);
        res.status(200).json({
            body: addUpdate.rows,
            message: "Add Update Success"
        });
        console.log("Add Update Success");
    } catch (e) {
        console.log(e.message);
        res.status(500).json({
            error: e.message
        });
    }
});

module.exports = router;