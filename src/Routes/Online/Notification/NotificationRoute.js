const express = require('express');
const router = express.Router();
const checkAuthorization = require('../../../app/Middlewares/Authentication/Authentication');
const NotificationController = require('../../../app/Controllers/Online/Notification/NotificationController')

// authentication
router.all('/*', checkAuthorization);

// count noti
router.get('/count-noti', NotificationController.countNotification);

// clear noti
router.put('/clear-noti', NotificationController.clearNotification);

module.exports = router;
