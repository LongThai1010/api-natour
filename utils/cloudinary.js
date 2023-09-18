const dotenv = require('dotenv')
dotenv.config();
const cloudinary = require("cloudinary");

//configure cloudinary

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.SECRET_KEY,
});

//Instance of cloudinary storage



module.exports = cloudinary;