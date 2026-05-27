const express = require("express");
const router = express.Router();

const { localFileUpload, imageUpload, videoUpload, imageSizeReducer, getFiles, deleteFile } = require("../controllers/fileUpload");

//api router
router.post("/localFileUpload", localFileUpload);
router.post("/imageUpload", imageUpload);
router.post("/videoUpload", videoUpload);
router.post("/imageSizeReducer", imageSizeReducer);
router.get("/getFiles", getFiles);
router.delete("/deleteFile/:id", deleteFile);

module.exports = router;