const express = require('express');
const router = express.Router();
const checkAuthorization = require('../../../app/Middlewares/Authentication/Authentication');
const NotificationController = require('../../../app/Controllers/Offline/Notification/NotificationController')

// authentication
router.all('/*', checkAuthorization);

// count noti
router.get('/count-noti', NotificationController.countNotification);

// clear noti
router.put('/clear-noti', NotificationController.clearNotification);

// check indicator
router.get('/check-indicator', NotificationController.checkIndicator);

// clear indicator
router.put('/clear-indicator', NotificationController.clearIndicator);

module.exports = router;
