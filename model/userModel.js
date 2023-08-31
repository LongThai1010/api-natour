const crypto = require('crypto');
const mongoose = require('mongoose'); // Erase if already required
const validator = require('validator');
const bcrypt = require('bcryptjs');
// Declare the Schema of the Mongo model
var userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please tell us your name']

    },
    email: {
        type: String,
        required: [true, 'Please provide your name'],
        unique: true,
        lowercase: true,
        validate: [validator.isEmail, 'Please provide a valid email']
    },
    role: {
        type: String,
        enum: ['user', 'guide', 'lead-guide', 'admin'],
        default: 'user',
    },
    photo: String,

    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minLength: 6,
        select: false
    },

    passwordConfirm: {
        type: String,
        required: [true, 'Please Confirm your password'],
        validate: {
            // This only work on create and save!!! 
            validator: function (el) {
                return el === this.password;
            },
            message: 'Password are not the same!'
        }
    },
    passwordResetToken: String,
    passwordResetExpires: Date,

    active: {
        type: Boolean,
        default: true,
        select: false,
    }

});

// userSchema.pre('save', async function (next) {
//     // Only run this function, if password was actually modified 
//     if (!this.isModified('password')) return next();

//     // Hash password
//     this.password = await bcrypt.hash(this.password, 12);

//     // Delete passwordConfirm fields
//     this.passwordConfirm = undefined;
//     next();
// })

// userSchema.pre('save', function (next) {
//     if (!this.isModified('password') || this.isNew) return next();

//     this.passwordChangedAt = Date.now() - 1000;
//     next();
// });

userSchema.pre(/^find/, function (next) {
    this.find({ active: { $ne: false } })
    next()
})

userSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword)
}

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
    if (this.passwordChangedAt) {
        const changedTimestamp = parseInt(
            this.passwordChangedAt.getTime() / 1000,
            10
        );

        return JWTTimestamp < changedTimestamp;
    }

    // False means NOT changed
    return false;
};

userSchema.methods.createPasswordResetToken = function () {
    const resetToken = crypto.randomBytes(32).toString('hex');

    this.passwordResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    console.log({ resetToken }, this.passwordResetToken);

    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

    return resetToken;
};


//Export the model
module.exports = mongoose.model('User', userSchema);