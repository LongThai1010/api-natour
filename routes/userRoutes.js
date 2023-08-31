const express = require('express');
const authController = require('./../controllers/authController');
const userController = require('./../controllers/userController');


const router = express.Router();


router.post('/signup', authController.signup)
router.post('/login', authController.login)
router.post('/forgotPassword', authController.forgotPassword)
router.patch('/resetPassword/:token', authController.resetPassword)

// Protect all routes after this middleware
router.use(authController.protect)

router.patch('/updateMyPassword', authController.updatePassword)
router.get('/me', userController.getMe, userController.getUser)
router.patch('/updateMe', userController.updateMe)
router.patch('/deleteMe', userController.deleteMe)

router.use(authController.restrictTo('admin'));

router.route('/')
    .get(userController.getAllUsers)
    .post(userController.createUser)


router.route('/:id')
    .delete(userController.deletedUser)
    .patch(userController.updateUser)
    .get(userController.getUser)

module.exports = router;