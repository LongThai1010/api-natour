const express = require('express');
const morgan = require('morgan');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet')
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean')
const hpp = require('hpp');

process.on('uncaughtException', err => {
    console.log(err.name, err.message)
    process.exit(1)
})

const tourRouter = require('./routes/tourRoutes')
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

const app = express();
dotenv.config({ path: './config.env' })



// Connect DB
mongoose.connect(process.env.DATABASE, {
    useNewUrlParser: true,
}).then(() => {
    console.log('DB connection successfully');
})

// Error DB
process.on('unhandledRejection', err => {
    console.log(err.name, err.message)
    process.exit(1)
})



// using middleware // Global middleware
// Set security HTTP headers
app.use(helmet())

if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

const limiter = rateLimit({
    max: 100,
    windowMs: 60 * 60 * 1000,
    message: 'Too many requests from this IP, please try again in an hour'
})

// Body parser, reading data from into req.body
app.use('/api', limiter)
app.use(express.json())
app.use(mongoSanitize())

app.use(xss())

// Prevent parameter pollution
app.use(hpp({
    whitelist: ['duration', 'ratingsQuantity', 'ratingsAverage', 'maxGroupSize', 'difficulty', 'price']
}))

app.use(express.static(`${__dirname}/public`))

// routes
app.use('/api/v1/tours', tourRouter)
app.use('/api/v1/users', userRouter)
app.use('/api/v1/reviews', reviewRouter)

app.all('*', (req, res, next) => {
    // const err = new Error();
    // err.status = 'fail';
    // err.statusCode = 404;

    next(new AppError(`Can't find ${req.originalUrl} on the server`, 404))
})

app.use(globalErrorHandler)

const port = 3000;
app.listen(port, () => {
    console.log(`App running with port ${port}`)
})