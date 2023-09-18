const Tour = require('../model/tourModel');
const APIFeatures = require('../utils/apiFeatures');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync')
const multer = require('multer');
const sharp = require('sharp');

const cloudinary = require('../utils/cloudinary')

const factory = require('./handleFactory')


const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image')) {
        cb(null, true);
    } else {
        cb(new AppError('Not an image! Please upload only images.', 400), false);
    }
};

const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter
});

exports.uploadTourImages = upload.fields([
    { name: 'imageCover', maxCount: 1 },
    { name: 'images', maxCount: 3 }
]);

exports.resizeTourImages = catchAsync(async (req, res, next) => {
    if (!req.files.imageCover || !req.files.images) return next();

    console.log(req.files);
    // 1) Cover image
    req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
    await sharp(req.files.imageCover[0].buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${req.body.imageCover}`);

    // 2) Images
    req.body.images = [];

    await Promise.all(
        req.files.images.map(async (file, i) => {
            const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;

            await sharp(file.buffer)
                .resize(2000, 1333)
                .toFormat('jpeg')
                .jpeg({ quality: 90 })
                .toFile(`public/img/tours/${filename}`);

            req.body.images.push(filename);
        })
    );

    next();
});

exports.aliasTopTours = catchAsync(async (req, res, next) => {
    req.query.limit = '5',
        req.query.sort = '-ratingsAverage,price',
        req.query.fields = 'name,price,ratingsAverage,summary,difficulty',
        next();
})

exports.createTour = catchAsync(async (req, res) => {
    console.log(req.file)
    const { name, description, price, summary, imageCover, ratingsQuantity, difficulty, maxGroupSize, duration } = req.body;
    if (imageCover) {
        const result = await cloudinary.uploader.upload(imageCover, {
            upload_preset: "tour-image"
        })

        if (result) {
            const tour = new Tour({
                name,
                description,
                price,
                summary,
                ratingsQuantity,
                difficulty,
                maxGroupSize,
                duration,
                imageCover: result
            })
            const saveTour = await tour.save()

            res.status(201).json({
                message: "Success",
                tour: saveTour
            })
        }
    }


})


exports.getAllTours = factory.getAll(Tour)

exports.getTour = factory.getOne(Tour, { path: 'reviews' })


exports.updateTour = factory.updateOne(Tour)

exports.deleteTour = factory.deleteOne(Tour)


exports.getTourStats = catchAsync(async (req, res) => {

    const stats = await Tour.aggregate([
        {
            $match: { ratingsAverage: { $gte: 4.5 } }
        },

        {
            $group: {
                _id: '$difficulty',
                numTours: { $sum: 1 },
                numRating: { $sum: '$ratingsQuantity' },
                avgRating: { $avg: '$ratingsAverage' },
                avgPrice: { $avg: '$price' },
                minPrice: { $min: '$price' },
                maxPrice: { $max: '$price' },
            }
        },

        {
            $sort: {
                avgPrice: 1
            }
        },


    ])

    res.status(200).json({
        status: 'success',
        data: {
            stats
        }
    })

})


exports.getMonthlyPlan = catchAsync(async (req, res) => {

    const year = req.params.year * 1;
    const plan = await Tour.aggregate([
        {
            $unwind: '$startDates'
        },

        {
            $match: {
                startDates: {
                    $gte: new Date(`${year}-01-01`),
                    $lte: new Date(`${year}-12-31`),
                }
            }
        },

        {
            $group: {
                _id: { $month: '$startDates' },
                numTourStarts: { $sum: 1 },
                tour: { $push: '$name' }
            }
        },

        {
            $addFields: { month: '$_id' }
        },

        {
            $project: {
                _id: 0
            }
        },

        {
            $sort: { numTourStarts: -1 }
        },

        // {
        //     $limit: 3
        // }

    ])

    res.status(200).json({
        status: 'success',
        data: {
            plan
        }
    })

})





