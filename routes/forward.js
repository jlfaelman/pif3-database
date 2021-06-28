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
        cb(null, 'fp' + "-" + Date.now() + generateID() + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        checkFileType(file, cb)
    }
})

// main
router.get('/', async (req, res) => {
    try {
        const getForward = await pool.query('SELECT * FROM public."FORWARD_INFO"');
        res.status(200).json({
            body: getForward.rows,
            message: "Get Forward Success"
        });
        console.log("Get Forward Success")

    } catch (e) {
        res.status(500);
        console.log(e.message);
    }
})
// page
router.get('/page/:id', async (req, res) => {
    try {
        const getForward = await pool.query('SELECT * FROM public."FORWARD_INFO" WHERE "Forward_ID" = $1', [req.params.id]);
        const getUser = await pool.query('SELECT * FROM public."USER_INFO" WHERE "User_ID" =  $1', [getForward.rows[0].User_ID])
        res.status(200).json({
            body:{
                forward:getForward.rows,
                user:getUser.rows,
            },
            message: "Get Forward Success"
        });
        console.log("Get Forward Success")

    } catch (e) {
        res.status(500);
        console.log(e.message);
    }
})


// add forward
router.post('/page/add',upload.single('image'),async(req,res)=>{
    try {
        const id = generateID();
        const date = today();
        const image = req.file;
        const imgURL = "http://localhost:5000/" + image.path.replace('public\\', '');
        const forward = req.body;
        console.log(forward)
        const addforward = await pool.query('INSERT INTO public."FORWARD_INFO" ("Forward_ID","User_ID","Forward_Title","Forward_Desc","Forward_Status","Forward_Type","Forward_Image","created_At","Allow_Search","Allow_Donation") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,true,true) RETURNING "Forward_ID";',
            [
                id,
                forward.user,
                forward.title,
                forward.description,
                forward.status,
                forward.type,
                imgURL,
                date
            ]);
        res.status(200).json({
            body: addforward.rows,
            message: "Add forward Success",
            status: 1
        })
        console.log("Add forward Success");
    } catch (e) {
        res.status(500).json({
            error:e.message
        })
        console.log(e.message);
    }
})
// add validation
router.post('/add/validation', upload.any('images'), async (req, res) => {
    try {
        const images = req.files;
        const forward = req.body.forward;
        images.forEach(async (image) => {
            const id = generateID();
            const imgURL = "http://localhost:5000/" + image.path.replace('public\\', '');
            const addValidation = await pool.query('INSERT INTO public."VALIDATION_INFO" ("Validation_ID","Fundraiser_ID","Validation_Image") VALUES ($1,$2,$3) ;',
                [id, forward, imgURL]);
                console.log("Files Uploaded");
        });
        res.status(200).json({
            message: "Files Uploaded"
        })
        
    } catch (e) {
        res.status(500).json({
            error: e.message
        })
    }
});

// add goods
router.post('/add/goods',async(req,res)=>{
   try {
        const id = generateID();
        const goods = req.body;
        const addGoods = await pool.query('INSERT INTO public."GOODS_INFO" ("Goods_ID","Forward_ID","Goods_Item","Goods_Quantity","Goods_Address","Goods_Received","is_Reached") VALUES ($1,$2,$3,$4,$5,0,false) ;',
        [id, goods.forward,goods.item,goods.quantity,goods.address]);
        res.status(200).json({
            body: addGoods.rows,
            message:"Add Goods Success"
        })
        console.log("Add Goods Success")
   } catch (e) {
        res.status(500).json({
            error: e.message
        })
        console.log(e.message);
   }
})


// get dashboard
router.get('/dashboard/:id',async(req,res)=>{
    try {
        const id = req.params.id;
        const getDashboard = await pool.query(`SELECT * FROM public."FORWARD_INFO" WHERE "User_ID" = $1`,[id])
        res.status(200).json({
            body:getDashboard.rows,
            message:"Get Dashboard Success"
        })
        console.log("Get Dashboard Success")
    } catch (e) {
        res.status(500).json({
            error:e.message
        })
        console.log(e.message);
    }
})
// get forward settings
router.get('/dashboard/page/:forward',async(req,res)=>{
    try {
        const forward = req.params.forward;
        const getDashboard = await pool.query(`SELECT * FROM public."FORWARD_INFO" WHERE "Forward_ID" = $1`,[forward])
        const getUser = await pool.query(`SELECT * FROM public."USER_INFO" WHERE "User_ID" = $1`,[getDashboard.rows[0].User_ID])
        res.status(200).json({
            body:{
                dashboard:getDashboard.rows[0],
                user:getUser.rows[0]
            },
            message:"Get Settings Success"
        })
        console.log("Get Settings Success")
    } catch (e) {
        res.status(500).json({
            error:e.message
        })
        console.log(e.message);
    }
})

// get goods
router.get('/dashboard/page/goods/:forward',async(req,res)=>{
    try {
        const forward = req.params.forward;
        const getSettings = await pool.query(`SELECT * FROM public."GOODS_INFO" WHERE "Forward_ID" = $1`,[forward])
        
        res.status(200).json({
            body:getSettings.rows,
            message:"Get Goods Success"
        })
        console.log("Get Goods Success")
    } catch (e) {
        res.status(500).json({
            error:e.message
        })
        console.log(e.message);
    }
})

// get validation
router.get('/dashboard/page/validation/:forward',async(req,res)=>{
    try {
        const forward = req.params.forward;
        const getValidation = await pool.query(`SELECT * FROM public."VALIDATION_INFO" WHERE "Fundraiser_ID" = $1`,[forward])
        res.status(200).json({
            body:getValidation.rows,
            message:"Get Validation Success"
        })
        console.log("Get Validation Success")
    } catch (e) {
        res.status(500).json({
            error:e.message
        })
        console.log(e.message);
    }
})

// get latest update

router.get('/update/:id',async(req,res)=>{
    try {
        const id = req.params.id
        const getUpdates = await pool.query(`
        SELECT * FROM public."UPDATE_TABLE" WHERE "Fundraiser_ID" = $1
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
})
// Forward Search
router.get("/search/:query", async (req, res) => {
    try {
        const q = req.params.query;
        const getProject = await pool.query(`
        SELECT * FROM public."FORWARD_INFO"
        WHERE to_tsvector("Forward_Title"  || ' ' || "Forward_Type") @@ to_tsquery($1) AND "Allow_Search" = true`, [q]);
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
module.exports = router;