const mongoose = require('mongoose'); // Erase if already required
const { default: slugify } = require('slugify');
const User = require('./userModel');

// Declare the Schema of the Mongo model
var tourSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'A tour must have a name'],
        unique: true,
    },

    slug: String,

    duration: {
        type: String,
        required: [true, 'A tour must have a duration'],

    },
    maxGroupSize: {
        type: Number,
        required: [true, 'A tour must have a maxGroupSize'],

    },
    difficulty: {
        type: String,
        required: [true, 'A tour must have a difficulty'],
        enum: {
            values: ['easy', 'medium', 'difficult'],
            message: 'difficulty is either: easy, medium or difficulty'
        }
    },
    ratingsAverage: {
        type: Number,
        default: 4.5,
        min: 1,
        max: 5,
        set: val => Math.round(val * 10) / 10 // 4
    },
    ratingsQuantity: {
        type: Number,
        default: 0
    },
    price: {
        type: Number,
        required: [true, 'A tour must have a price'],
    },

    priceDiscount: {
        type: Number,
        validate: {
            validator: function (val) {
                return val < this.price
            },
            message: 'Discount price should be below regular price'
        }
    },

    summary: {
        type: String,
        trim: true,
        required: [true, 'A tour must have a summary'],
    },
    descriptiop: {
        type: String,
        trim: true,
    },
    imageCover: {
        type: String,
        required: [true, 'A tour must have a cover image'],
    },
    images: [String],
    createAt: {
        type: Date,
        default: new Date(),
        select: false,
    },
    startDates: [Date],
    startLocation: {
        // GeoJSON
        type: {

            type: String,
            default: 'Point',
            enum: ['Point']
        },
        coordinates: [Number],
        address: String,
        descriptiop: String,
    },

    locations: [
        {
            type: {
                type: String,
                default: 'Point',
                enum: ['Point'],
            },
            coordinates: [Number],
            address: String,
            descriptiop: String,
            day: Number
        }
    ],

    guides: [
        {
            type: mongoose.Schema.ObjectId,
            ref: 'User'
        }
    ],

},
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

// tourSchema.index({price: 1});
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });

// Visual Populate Tours
tourSchema.virtual('reviews', {
    ref: 'Review',
    foreignField: 'tour',
    localField: '_id'
})

// Document middleware: run before .save() and .create()
tourSchema.pre('save', function (next) {
    this.slug = slugify(this.name, { lower: true })
    next()
})

tourSchema.pre('save', async function (next) {
    const guidesPromise = this.guides.map(async id => await User.findById(id));
    this.guides = await Promise.all(guidesPromise)
    next()
})



//Export the model
module.exports = mongoose.model('Tour', tourSchema);