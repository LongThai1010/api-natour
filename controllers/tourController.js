const Tour = require('../model/tourModel');
const APIFeatures = require('../utils/apiFeatures');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync')

const factory = require('./handleFactory')

exports.aliasTopTours = catchAsync(async (req, res, next) => {
    req.query.limit = '5',
        req.query.sort = '-ratingsAverage,price',
        req.query.fields = 'name,price,ratingsAverage,summary,difficulty',
        next();
})

exports.getAllTours = factory.getAll(Tour)

exports.createTour = factory.createOne(Tour)

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




