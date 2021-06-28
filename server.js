require('dotenv').config()
const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT;

const admin = require('./routes/admin');
const user = require('./routes/user');
const fundraising = require('./routes/fundraising');
const forward = require('./routes/forward');
// const goods = require('./routes/goods');
const donate = require('./routes/donation');
const ref = require('./routes/reference');
const update = require('./routes/update');
const comments = require('./routes/comments');

app.use(cors());
app.use(express.json());
app.use(express.static("public"));
// ROUTES
app.use('/admin', admin);
app.use('/user', user); 
app.use('/fundraising', fundraising);
app.use('/forward', forward);
app.use('/donation', donate);
app.use('/reference', ref);
app.use('/update', update);
app.use('/comments', comments);


app.get("/", (req, res) => {
    res.status(200).send('Connected to Database');
});

app.listen(port, () => {
    console.log(`Database listening on http://localhost:${port}`);
});