const express = require('express');
const router = express.Router();

const checkAuthorization = require('../../../app/Middlewares/Authentication/Authentication');
const mobileOnlineController = require('../../../app/Controllers/Online/Mobile/MobileController');

// Authentication
router.all('/*', checkAuthorization);

// get categories
router.get('/home-set', mobileOnlineController.getHomeset);

// get categories
router.get('/categories', mobileOnlineController.getCategories);

// get list in category
router.get('/category/:id', mobileOnlineController.getListInCategory);

// get program in list
router.get('/list/:id', mobileOnlineController.getProgramInList);

// get program original
router.get('/original', mobileOnlineController.getProgramOriginal);

module.exports = router;
