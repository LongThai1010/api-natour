const express = require('express');
const tourController = require('./../controllers/tourController');
const authController = require('./../controllers/authController');
const reviewRouter = require('./../routes/reviewRoutes');
const multer = require('multer');

const router = express.Router();


//khai báo sử dụng multer
// SET STORAGE
// var storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//         cb(null, "public/img/tours");
//     },
//     filename: function (req, file, cb) {
//         cb(null, file.originalname);
//     },
// });
// const upload = multer({
//     uploadToCloudinary,
//     storage: storage
// });



// router.route('/')
//     .get(reviewController.getAllReviews)
//     .post(
//         authController.protect,
//         authController.restrictTo('user'),
//         reviewController.createReview)

router.use('/:tourId/reviews', reviewRouter)

router
    .route('/top-5-cheap')
    .get(tourController.aliasTopTours, tourController.getAllTours)

router
    .route('/tour-stats')
    .get(tourController.getTourStats)

router
    .route('/monthly-plan/:year')
    .get(authController.protect,
        authController.restrictTo('admin', 'lead-guide', 'guide'),
        tourController.getMonthlyPlan)

router
    .route('/')
    .get(tourController.getAllTours)
    .post(
        tourController.createTour);



router
    .route('/:id')
    .get(tourController.getTour)
    .patch(authController.protect,
        authController.restrictTo('admin', 'lead-guide'),
        tourController.uploadTourImages,
        tourController.resizeTourImages,
        tourController.updateTour)
    .delete(authController.protect,
        authController.restrictTo('admin', 'lead-guide'),
        tourController.deleteTour);




module.exports = router;