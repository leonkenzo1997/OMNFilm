const express = require('express');
const router = express.Router();

const checkAuthorization = require('../../../app/Middlewares/Authentication/Authentication');
const WebController = require('../../../app/Controllers/Online/Web/WebController');

// Authentication
router.all('/*', checkAuthorization);

// get detail program by id
router.get('/detail/:id', WebController.getDetailProgram);

// get season by program id
router.get('/get-seasons/:id', WebController.getSeasons);

// get episode by season
router.get('/get-episodes/:id', WebController.getEpisodes);

// get poster
router.get('/poster', WebController.getPoster);

// get program original
router.get('/original', WebController.getProgramOriginal);

// get program original this week
router.get('/this-week', WebController.newestThisWeek);

// get program original next week
router.get('/next-week', WebController.newestNextWeek);

// ONLINE - Home set: get homeset
router.get('/homeset', WebController.getHomeSet);

// ONLINE - Detail home set: get detail homeset
router.get('/homeset/detail', WebController.getDetailHomeSet);

module.exports = router;
