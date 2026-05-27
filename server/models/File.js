const mongoose = require("mongoose");
const transporter = require("../config/transporter");

const fileSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    imageUrl: {
        type: String,
    },
    tags: {
        type: String,
    },
    email: {
        type: String,
    }
});

// Post-save middleware — send notification email after DB entry is created
fileSchema.post("save", async function (doc) {
    try {
        console.log("Doc saved:", doc);

        let info = await transporter.sendMail({
            from: `CloudVibe <${process.env.MAIL_USER}>`,
            to: doc.email,
            subject: "New File Uploaded on Cloudinary",
            html: `<h2>CloudVibe Upload Notification</h2>
                   <p>Your file <strong>${doc.name}</strong> was uploaded successfully.</p>
                   <p>View it here: <a href="${doc.imageUrl}">${doc.imageUrl}</a></p>`,
        });

        console.log("Email sent:", info.messageId);
    }
    catch (error) {
        console.error("Email send error:", error);
    }
});

const File = mongoose.model("File", fileSchema);
module.exports = File;