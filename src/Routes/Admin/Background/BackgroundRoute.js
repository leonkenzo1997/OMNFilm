const express = require('express');
const router = express.Router();
// const backgroundVideoSettingRoute = require('./Video/BackgroundVideoSettingRoute');
const backgroundVideoRoute = require('./Video/BackgroundVideoRoute');
const backgroundPosterRoute = require('./Poster/BackgroundPosterRoute');
const backgroundPosterSettingRoute = require('./Poster/BackgroundPosterSettingRoute');

/*

flow old for background video setting
router.use('/video-setting', backgroundVideoSettingRoute);

*/
//admin router background video setting app
router.use('/video-setting', backgroundVideoRoute);

//admin router background video app
// router.use('/video', backgroundVideoRoute);

//admin router background poster setting app
router.use('/poster-setting', backgroundPosterSettingRoute);

//admin router background poster app
// router.use('/poster', backgroundPosterRoute);

module.exports = router;
