// review / rating / createAt / ref to Tour / ref to User

const mongoose = require('mongoose'); // Erase if already required
const Tour = require('../model/tourModel')

// Declare the Schema of the Mongo model
var reviewSchema = new mongoose.Schema({
    review: {
        type: String,
        required: [true, 'Review can not be empty'],
    },
    rating: {
        type: Number,
        min: 1,
        max: 5

    },
    createAt: {
        type: Date,
        default: Date.now()

    },
    tour: {
        type: mongoose.Schema.ObjectId,
        ref: 'Tour',
        required: [true, 'Review must belong to a tour'],
    },

    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'Review must belong to a user'],
    },


},
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

reviewSchema.index({ tour: 1, user: 1 }, { unique: true })

reviewSchema.pre(/^find/, function (next) {
    // this.populate({
    //     path: 'tour',
    //     select: 'name'
    // }).populate({
    //     path: 'user',
    //     name: 'name photo'
    // })

    this.populate({
        path: 'user',
        select: 'name photo'
    })

    next()
})

reviewSchema.statics.calcAverageRatings = async function (tourId) {
    const stats = this.aggregate([
        {
            $match: { tour: tourId }
        },
        {
            $group: {
                _id: '$tourId',
                nRating: { $num: 1 },
                avgRating: { $avg: '$rating' }
            }
        }
    ])
    console.log(stats);

    if (stats.length > 0) {
        await Tour.findByIdAndUpdate(tourId, {
            ratingsQuantity: stats[0].nRating,
            ratingsAverage: stats[0].avgRating
        })
    } else {
        await Tour.findByIdAndUpdate(tourId, {
            ratingsQuantity: 0,
            ratingsAverage: 4.5
        })
    }
}

reviewSchema.post('save', function (next) {
    // this Point to current review
    this.constructor.calcAverageRatings(this.tour);
    next();
})

// findByAndUpdate
// findByAndDelete

reviewSchema.pre(/^findOneAnd/, async function (next) {
    this.r = await this.findOne();
    console.log(this.r);
    next()
})

reviewSchema.post(/^findOneAnd/, async function (next) {
    // await this.findOne(); does NOT work here, query has already executed
    await this.r.constructor.calcAverageRatings(this.r.tour)
})


//Export the model
module.exports = mongoose.model('Review', reviewSchema);