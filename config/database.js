const mongoose = require("mongoose");

require("dotenv").config();

exports.connect = () => {
    mongoose.connect(process.env.MONGOOSE_URL)

        .then(console.log("DB Connected successfully"))

        .catch((error) => {
            console.log("DB Connection Issues");
            console.log(err);
            process.exit(1);
        });
}

