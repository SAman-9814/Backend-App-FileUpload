//app create
const express = require("express");
const app = express();

//PORT find krne hai
require("dotenv").config();
const PORT = process.env.PORT || 3000;

//moddleware add krne hai
const cors = require("cors");
app.use(cors());
app.use(express.json());
const fileupload = require("express-fileupload");
app.use(fileupload({
    useTempFiles : true,
    tempFileDir : '/tmp/'
}));

//db se connect krne hai
const db = require("./config/database");
db.connect();

//cloud se connect krne hai
const cloudinary = require("./config/cloudinary");
cloudinary.cloudinaryConnect();

//api route mount krne hai
const Upload = require("./routes/FileUpload");
app.use('/api/v1/upload', Upload);

//activate server
if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`App is running at ${PORT}`);
    });
}

//default Route
app.get("/", (req, res) => {
    res.send(`<h1>This is Aman Sah</h1>`);
})

// module.exports = app;