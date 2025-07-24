const express = require('express');
const router = express.Router();
const backgroundVideoRoute = require('./BackgroundVideoRoute');
const backgroundPosterRoute = require('./BackgroundPosterRoute');

//admin router background app
router.use('/video', backgroundVideoRoute);

//admin router background app
router.use('/poster', backgroundPosterRoute);

module.exports = router;
