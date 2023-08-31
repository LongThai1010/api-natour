const User = require('../model/userModel');
const catchAsync = require('../utils/catchAsync');

const factory = require('./handleFactory')


const filterObj = (obj, ...allowedFields) => {
    const newObj = {};
    Object.keys(obj).forEach(el => {
        if (allowedFields.includes(el)) newObj[el] = obj[el];
    })
}

exports.getAllUsers = factory.getAll(User)

exports.getMe = (req, res, next) => {
    req.params.id = req.user.id;
    next()
}
exports.updateMe = catchAsync(async (req, res, next) => {
    // 1) Create error if user Post password data
    if (req.body.password || req.body.passwordConfirm) {
        return next(
            new AppError(
                'This route is not for password updates. Please use/updateMyPassword',
                400
            )
        );
    }
    // 2) Updates user document
    const filteredBody = filterObj(req.body, 'name', 'email')
    const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, { new: true, runValidators: true })
    res.status(200).json({
        status: 'success',
        data: {
            user: updatedUser
        }
    })
})

exports.deleteMe = catchAsync(async (req, res, next) => {
    // 1) Create error if user Post password data

    // 2) Updates user document
    const deletedUser = await User.findByIdAndDelete(req.user.id, { active: false })
    res.status(204).json({
        status: 'success',
        data: null
    })
})

exports.createUser = factory.createOne(User)
exports.getUser = factory.getOne(User)
// Do not update password with this!
exports.updateUser = factory.updateOne(User)
exports.deletedUser = factory.deleteOne(User)