const multer = require("multer");
const path = require("path");
const AppError = require("../utils/appError");
const sharp = require("sharp");
// var storage = multer.

const multerStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, "../public/img"));
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    },
});;

const multerFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image')) {
        cb(null, true);
    } else {
        cb(new AppError('Not an image! Please upload only images.', 400), false);
    }
};

const tourImgResize = async (req, res, next) => {
    if (req.files) return next();

    await Promise.all(
        req.files.map(async (file, i) => {
            const filename = `tour-${Date.now()}-${i + 1}.jpeg`;

            await sharp(file.path)
                .resize(2000, 1333)
                .toFormat('jpeg')
                .jpeg({ quality: 90 })
                .toFile(`public/img/tours/${filename}`);

            // req.body.images.push(filename);
        })
    );

    next();
}

const uploadPhoto = multer({
    storage: multerStorage,
    fileFilter: multerFilter
});

module.exports = { uploadPhoto, tourImgResize }