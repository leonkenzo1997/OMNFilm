const express = require('express');
const router = express.Router();

const checkAuthorization = require('../../../app/Middlewares/Authentication/Authentication');
const homeOnlineController = require('../../../app/Controllers/Online/Home/HomeController');

// Authentication
router.all('/*', checkAuthorization);

// api add my list
router.post('/mylist/add', homeOnlineController.addMyList);

// get detail list
router.get('/list/:id', homeOnlineController.getDetailList);

// get similar programs
router.get('/similar/:id', homeOnlineController.getSimilarPrograms);

// ONLINE - Trending: get trending video
router.get('/trending', homeOnlineController.trending);

// ONLINE - Top 10: get top 10 video
router.get('/top', homeOnlineController.topShow);

// ONLINE - newest program
router.get('/newest', homeOnlineController.newestProgram);

// ONLINE - My list: get my list video
router.get('/mylist', homeOnlineController.getMyList);

// ONLINE - Other: get other list video
router.get('/other', homeOnlineController.getOther);

// ONLINE - User categories set: get video in user categories set
router.get('/user-categories-set', homeOnlineController.getUserCategoriesSet);

// ONLINE - Home set: get homeset
router.get('/homeset', homeOnlineController.getHomeSet);

// ONLINE - Detail home set: get detail homeset
router.get('/homeset/:id', homeOnlineController.getDetailHomeSet);

// ONLINE - Get program in list: get detail homeset
router.get('/program-in-list/:id', homeOnlineController.getProgramInList);

// ONLINE - List bracter: get list bracter
router.get('/bracters', homeOnlineController.getBracters);

// ONLINE - List program in bracter: get list program in bracter
router.get('/bracter/:id', homeOnlineController.getListProgramInBracter);

// get data user categories
router.get('/categories', homeOnlineController.getCategoriesUser);

// search online
router.get('/search', homeOnlineController.searchVideo);

// search online creator info
router.get('/search-creator', homeOnlineController.searchCreatorInfo);

// get detail program
router.get('/background', homeOnlineController.getDetailProgram);

// get detail program
router.get('/:id', homeOnlineController.getDetailProgram);


module.exports = router;
