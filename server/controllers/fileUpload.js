const fs = require("fs");
const path = require("path");
const File = require("../models/File");
const cloudinary = require("cloudinary").v2;

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isFileTypeSupported(type, supportedTypes) {
    return supportedTypes.includes(type);
}

async function uploadFileToCloudinary(file, folder, quality) {
    const options = { folder, resource_type: "auto" };
    if (quality) options.quality = quality;
    console.log("Uploading to Cloudinary, temp path:", file.tempFilePath);
    return await cloudinary.uploader.upload(file.tempFilePath, options);
}

function deleteTempFile(filePath) {
    try {
        if (filePath && fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log("Temp file deleted:", filePath);
        }
    } catch (err) {
        console.error("Failed to delete temp file:", err);
    }
}

// ─── Local File Upload ─────────────────────────────────────────────────────────

exports.localFileUpload = async (req, res) => {
    try {
        const file = req.files.file;
        console.log("Local upload received:", file.name);

        // Create destination path
        const ext = file.name.split(".").pop();
        const destPath = path.join(__dirname, "files", `${Date.now()}.${ext}`);
        console.log("Destination path:", destPath);

        // Ensure files directory exists
        const filesDir = path.join(__dirname, "files");
        if (!fs.existsSync(filesDir)) {
            fs.mkdirSync(filesDir, { recursive: true });
        }

        // Await the file move — wrap callback in a Promise
        await new Promise((resolve, reject) => {
            file.mv(destPath, (err) => {
                if (err) {
                    console.error("File move error:", err);
                    reject(err);
                } else {
                    resolve();
                }
            });
        });

        return res.json({
            success: true,
            message: "Local File Uploaded Successfully",
            path: destPath,
        });
    }
    catch (error) {
        console.error("localFileUpload error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to upload file to local server",
        });
    }
};

// ─── Image Upload (Cloudinary) ─────────────────────────────────────────────────

exports.imageUpload = async (req, res) => {
    const file = req.files?.imageFile;
    try {
        const { name, tags, email } = req.body;

        if (!file) {
            return res.status(400).json({ success: false, message: "No image file provided" });
        }

        // File type validation
        const supportedTypes = ["jpg", "jpeg", "png"];
        const fileType = file.name.split(".").pop().toLowerCase();
        if (!isFileTypeSupported(fileType, supportedTypes)) {
            return res.status(400).json({ success: false, message: "File format not supported. Use JPG, JPEG, or PNG." });
        }

        // File size validation (5MB max)
        if (file.size > MAX_FILE_SIZE_BYTES) {
            return res.status(400).json({ success: false, message: "File size exceeds the 5MB limit." });
        }

        const response = await uploadFileToCloudinary(file, "CloudVibe");
        console.log("Cloudinary response:", response.secure_url);

        const fileData = await File.create({ name, tags, email, imageUrl: response.secure_url });

        return res.json({
            success: true,
            imageUrl: response.secure_url,
            message: "Image Uploaded Successfully",
            data: fileData,
        });
    }
    catch (error) {
        console.error("imageUpload error:", error);
        return res.status(500).json({ success: false, message: "Something went wrong during image upload" });
    }
    finally {
        if (file) deleteTempFile(file.tempFilePath);
    }
};

// ─── Video Upload (Cloudinary) ─────────────────────────────────────────────────

exports.videoUpload = async (req, res) => {
    const file = req.files?.videoFile;
    try {
        const { name, tags, email } = req.body;

        if (!file) {
            return res.status(400).json({ success: false, message: "No video file provided" });
        }

        // File type validation
        const supportedTypes = ["mp4", "mov"];
        const fileType = file.name.split(".").pop().toLowerCase();
        if (!isFileTypeSupported(fileType, supportedTypes)) {
            return res.status(400).json({ success: false, message: "File format not supported. Use MP4 or MOV." });
        }

        // File size validation (5MB max)
        if (file.size > MAX_FILE_SIZE_BYTES) {
            return res.status(400).json({ success: false, message: "Video size exceeds the 5MB limit." });
        }

        const response = await uploadFileToCloudinary(file, "CloudVibe");
        console.log("Cloudinary response:", response.secure_url);

        const fileData = await File.create({ name, tags, email, imageUrl: response.secure_url });

        return res.json({
            success: true,
            imageUrl: response.secure_url,
            message: "Video Uploaded Successfully",
            data: fileData,
        });
    }
    catch (error) {
        console.error("videoUpload error:", error);
        return res.status(500).json({ success: false, message: "Something went wrong during video upload" });
    }
    finally {
        if (file) deleteTempFile(file.tempFilePath);
    }
};

// ─── Image Size Reducer Upload (Cloudinary) ────────────────────────────────────

exports.imageSizeReducer = async (req, res) => {
    const file = req.files?.imageFile;
    try {
        const { name, tags, email } = req.body;

        if (!file) {
            return res.status(400).json({ success: false, message: "No image file provided" });
        }

        // File type validation
        const supportedTypes = ["jpg", "jpeg", "png"];
        const fileType = file.name.split(".").pop().toLowerCase();
        if (!isFileTypeSupported(fileType, supportedTypes)) {
            return res.status(400).json({ success: false, message: "File format not supported. Use JPG, JPEG, or PNG." });
        }

        // File size validation (5MB max)
        if (file.size > MAX_FILE_SIZE_BYTES) {
            return res.status(400).json({ success: false, message: "File size exceeds the 5MB limit." });
        }

        // Upload with quality=50 for compression
        const response = await uploadFileToCloudinary(file, "CloudVibe", 50);
        console.log("Cloudinary response:", response.secure_url);

        const fileData = await File.create({ name, tags, email, imageUrl: response.secure_url });

        return res.json({
            success: true,
            imageUrl: response.secure_url,
            message: "Image Compressed & Uploaded Successfully",
            data: fileData,
        });
    }
    catch (error) {
        console.error("imageSizeReducer error:", error);
        return res.status(500).json({ success: false, message: "Something went wrong during compressed upload" });
    }
    finally {
        if (file) deleteTempFile(file.tempFilePath);
    }
};

// ─── Get All Files ─────────────────────────────────────────────────────────────

exports.getFiles = async (req, res) => {
    try {
        const files = await File.find({}).sort({ _id: -1 });
        return res.json({ success: true, files });
    }
    catch (error) {
        console.error("getFiles error:", error);
        return res.status(500).json({ success: false, message: "Failed to retrieve files" });
    }
};

// ─── Delete File ───────────────────────────────────────────────────────────────

exports.deleteFile = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await File.findByIdAndDelete(id);

        if (!deleted) {
            return res.status(404).json({ success: false, message: "File record not found" });
        }

        return res.json({ success: true, message: "File record deleted successfully" });
    }
    catch (error) {
        console.error("deleteFile error:", error);
        return res.status(500).json({ success: false, message: "Failed to delete file record" });
    }
};