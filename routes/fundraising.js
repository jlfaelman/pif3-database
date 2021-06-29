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
function checkFileType(file, cb) {
    const fileType = /jpg|jpeg|png/
    const ext = fileType.test(path.extname(file.originalname).toLowerCase())
    const mime = fileType.test(file.mimetype)
    if (ext && mime) return cb(null, true);
    else return cb("Error: Images only");
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './public/img')
    },
    filename: (req, file, cb) => {
        cb(null, 'fr' + "-" + Date.now() + generateID() + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        checkFileType(file, cb)
    }
})




//Get All Projects
router.get("/", async (req, res) => {
    try {
        const getProject = await pool.query('SELECT * FROM  "FUNDRAISER_INFO"');
        res.status(200).json({
            body: getProject.rows,
            message: "Get Project Success"
        });
        console.log("Get Project Success");

    } catch (e) {
        res.status(500);
        console.log(e.message);
    }
});

//  trending

// get page
router.get("/page/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const getFundraiser = await pool.query('SELECT * FROM  "FUNDRAISER_INFO" WHERE "Fundraiser_ID" =  $1', [id]);
        const getFunding = await pool.query('SELECT * FROM  "FUNDING_INFO" WHERE "Fundraiser_ID" =  $1', [id]);
        const getUpdate = await pool.query(`
        SELECT * FROM  "UPDATE_TABLE" WHERE "Fundraiser_ID" = $1
        ORDER BY "created_At" DESC
        `, [id]);
        const getUser = await pool.query('SELECT * FROM  "USER_INFO" WHERE "User_ID" =  $1', [getFundraiser.rows[0].User_ID])
        const getComment = await pool.query(`
            SELECT * FROM  "COMMENT_TABLE" AS "comment"  
            INNER JOIN   "DONATION_INFO" AS "donation"
            ON "donation"."Donation_ID" = "comment"."Donation_ID"
            WHERE "comment"."Fundraiser_ID" = $1
        `, [id])
        res.status(200).json({
            body: {
                fundraiser: getFundraiser.rows,
                funding: getFunding.rows,
                update: getUpdate.rows,
                user: getUser.rows,
                comment: getComment.rows,
            },
            message: "Get Project Success"
        })
        console.log("Get Project Success");

    } catch (e) {
        res.status(500);
        console.log(e.message);
    }
});

router.get('/history/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const getDonation = await pool.query(`
        SELECT *
        FROM  "DONATION_INFO"
        WHERE "Fundraiser_ID" = $1
        ORDER BY "created_At" DESC 
        LIMIT 3
        `
            , [id]);
            
        res.status(200).json({
            body:  getDonation.rows,
            message: "Get History Success"
        })
        console.log( "Get History Success");
    } catch (e) {
        res.status(500).json({
            e: e.message
        });
        console.log(e.message);
    }

})
// per Category

router.get("/", async (req, res) => {
    try {
        const getProject = await pool.query('SELECT * FROM  "FUNDRAISER_INFO"');
        res.status(200).json({
            body: getProject.rows,
            message: "Get Project Success"
        });
        console.log("Get Project Success");

    } catch (e) {
        res.status(500);
        console.log(e.message);
    }
});
// Search
router.get("/search/:query", async (req, res) => {
    try {
        const q = req.params.query;
        const getProject = await pool.query(`
        SELECT * FROM  "FUNDRAISER_INFO"
        WHERE to_tsvector("Fundraiser_Title"  || ' ' || "Fundraiser_Type") @@ to_tsquery($1) AND "Allow_Search" = true`, [q]);
        res.status(200).json({
            body: getProject.rows,
            message: "Get Project Success"
        });

        console.log("Get Project Success");
    }
    catch (e) {
        res.status(500).json({
            error: e.message
        })
        console.log(e.message);
    }
});
// dashboard
router.get('/user/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const getProject = await pool.query(`SELECT * FROM  "FUNDRAISER_INFO" WHERE "User_ID" = $1`, [id]);
        res.status(200).json({
            body: getProject.rows,
            message: "Get Project Success"
        });
        console.log("Get Project Success");
    }
    catch (e) {
        res.status(500).json({
            error: e.message
        })
        console.log(e.message);
    }
})


// settings
router.get('/user/settings/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const getFundraising = await pool.query(`
        SELECT * FROM  "FUNDRAISER_INFO" WHERE "Fundraiser_ID" = $1`, [id]);
        const getFunding = await pool.query(`
        SELECT * FROM  "FUNDING_INFO" WHERE "Fundraiser_ID" = $1 `, [id]);
        const getValidation = await pool.query(`
        SELECT * FROM  "VALIDATION_INFO" WHERE "Fundraiser_ID" = $1 `, [id]);
        res.status(200).json({
            body: {
                fundraising: getFundraising.rows,
                funding: getFunding.rows,
                validation: getValidation.rows
            },
            message: "Get Project Success"
        });
    }
    catch (e) {
        res.status(500).json({
            error: e.message
        })
        console.log(e.message);
    }
})
// add fundraiser
router.post('/add/fundraiser', upload.single('image'), async (req, res) => {
    try {
        const id = generateID();
        const date = today();
        const image = req.file;
        const imgURL = "http://localhost:5000/" + image.path.replace('public\\', '');
        const fundraiser = req.body;
        console.log(image);
        const addFundraiser = await pool.query('INSERT INTO  "FUNDRAISER_INFO" ("Fundraiser_ID","User_ID","Fundraiser_Title","Fundraiser_Desc","Fundraiser_Status","Fundraiser_Type","created_At","Allow_Comments","Allow_Donation","Allow_Search","Fundraiser_Image") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING "Fundraiser_ID";',
            [id, fundraiser.user, fundraiser.title, fundraiser.description, "on process", fundraiser.type, date, true, true, true, imgURL]);
        res.status(200).json({
            body: addFundraiser.rows,
            message: "Add Fundraiser Success",
            status: 1
        })
        console.log("Add Fundraiser Success");
    } catch (e) {
        res.status(500).json({
            error: e.message
        })
        console.log(e.message);
    }
})
router.post('/edit', async (req, res) => {
    try {
        const id = req.body.id;
        const title = req.body.title;
        const description = req.body.description
        const updateFundraiser = await pool.query(`
        UPDATE  "FUNDRAISER_INFO"
        SET "Fundraiser_Title" = $2,
        "Fundraiser_Desc" = $3
        WHERE "Fundraiser_ID"  = $1;
        `, [id, title, description])

        res.status(200).json({
            body: updateFundraiser.rows[0],
            message: "Update Fundraiser Success"
        })
        console.log("Update Fundraiser Success")

    } catch (e) {
        res.status(500).json({
            error: e.message
        })
        console.log(e.message)
    }
})
// add funding
router.post('/add/method', async (req, res) => {
    try {
        const id = generateID();
        const funding = req.body;
        const addFunding = await pool.query('INSERT INTO  "FUNDING_INFO" ("Funding_ID","Fundraiser_ID","Funding_Quota","Funding_Method","Funding_Date","Funding_Total","Funding_Received","is_Reached","paypal_Disabled") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *;',
            [id, funding.fundraiser, funding.quota, funding.method, funding.date, funding.total, "0", false, funding.paypal]);
        res.status(200).json({
            body: addFunding.rows,
            message: "Add FunFunding Success",
            status: 1
        })
        console.log("Add Fundraiser Success");
    } catch (e) {
        res.status(500).json({
            error: e.message
        })
        console.log(e.message);
    }
})

// add paymaya qr
router.post('/add/paymaya', upload.single('paymaya-qr'), async (req, res) => {
    try {
        const id = generateID();
        const image = req.file;
        const imgURL = "http://localhost:5000/" + image.path.replace('public\\', '');
        const paymaya = req.body
        const addPaymaya = await pool.query('INSERT INTO  "PAYMAYA_TABLE" ("Paymaya_ID","Funding_ID","Paymaya_QR") VALUES ($1,$2,$3) ;',
            [id, paymaya.funding, imgURL]);
        res.status(200).json({
            body: addPaymaya.rows,
            message: "Add Paymaya Success",
        })
        console.log("Add Paymaya Success");
    } catch (e) {
        res.status(500).json({
            error: e.message
        })
        console.log(e.message);
    }
})
// add gcash qr
router.post('/add/gcash', upload.single('gcash-qr'), async (req, res) => {
    try {
        const id = generateID();
        const image = req.file;
        const imgURL = "http://localhost:5000/" + image.path.replace('public\\', '');
        const gcash = req.body
        const addGCash = await pool.query('INSERT INTO  "GCASH_TABLE" ("Gcash_ID","Funding_ID","Gcash_QR") VALUES ($1,$2,$3) ;',
            [id, gcash.funding, imgURL]);
        res.status(200).json({
            body: addGCash.rows,
            message: "Add GCash Success",
        })
        console.log("Add GCash Success");
    } catch (e) {
        res.status(500).json({
            error: e.message
        })
        console.log(e.message);
    }
})

// Validation
router.post('/add/validation', upload.any('images'), async (req, res) => {
    try {
        const images = req.files;
        const fundraiser = req.body.fundraiser;
        images.forEach(async (image) => {
            const id = generateID();
            const imgURL = "http://localhost:5000/" + image.path.replace('public\\', '');
            const addValidation = await pool.query('INSERT INTO  "VALIDATION_INFO" ("Validation_ID","Fundraiser_ID","Validation_Image") VALUES ($1,$2,$3) ;',
                [id, fundraiser, imgURL]);
            // console.log(id + " " + imgURL + " " + fundraiser );
        });
        res.status(200).json({
            message: "Files Uploaded"
        })
        console.log("Files Uploaded");
    } catch (e) {
        res.status(500).json({
            error: e.message
        })
    }
});

// get qr
router.get('/get/qr/:fund', async (req, res) => {
    try {
        const fund = req.params.fund;
        const getPaymaya = await pool.query('SELECT * FROM  "PAYMAYA_TABLE" WHERE "Funding_ID" = $1;', [fund])
        const getGCash = await pool.query('SELECT * FROM  "GCASH_TABLE" WHERE "Funding_ID" = $1;', [fund])
        res.status(200).json({
            body: {
                gcash: getGCash.rows,
                paymaya: getPaymaya.rows
            },
            message: "get QR Success",
        })
        console.log("Get QR Success");
    } catch (e) {
        res.status(500).json({
            error: e.message
        })
        console.log(e.message);
    }
})


// withdraw
router.post('/user/withdraw/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const reset = "0"
        const updateFunding = await pool.query(`
        UPDATE  "FUNDING_INFO"
        SET "Funding_Received" = $2
        WHERE "Funding_ID"  = $1;
        `, [id, reset])

        res.status(200).json({
            body: updateFunding.rows[0],
            message: "Update Funding Success"
        })
        console.log("Update Funding Success")
    } catch (e) {
        throw e;
    }
})

// get funding
router.get('/get/funding/:id', async (req, res) => {
    try {
        const id = req.params.id
        const getFunding = await pool.query(`SELECT * FROM  "FUNDING_INFO" WHERE "Funding_ID" = $1`, [id]);
        res.status(200).json({
            body: getFunding.rows[0],
            message: "Get Funding Success"
        });
        console.log("Get Funding Success");
    } catch (e) {
        res.status(500).json({
            e: e.message
        })
    }
});
router.post('/update/funding/:id', async (req, res) => {
    try {
        const id = req.params.id
        const received = req.body.received;
        const total = req.body.total;
        const update = await pool.query(`
        UPDATE  "FUNDING_INFO"
        SET "Funding_Received" = $2,
        "Funding_Total" = $3
        WHERE "Funding_ID"  = $1;`, [id, received, total]);
        res.status(200).json({
            message: "Update Funding Success"
        });
        console.log("Update Funding Success");
    } catch (e) {
        res.status(500).json({
            e: e.message
        })
        console.log(e);
    }
});







module.exports = router;