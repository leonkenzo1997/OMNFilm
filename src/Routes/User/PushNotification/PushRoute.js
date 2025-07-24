const express = require('express');
const router = express.Router();

const pushAndoirdController = require('../../../app/Controllers/User/Push/PushNotificationController');
const UserPushNotificationContrller = require('../../../app/Controllers/User/Push/UserPushNotificationController');
const checkAuthorization = require('../../../app/Middlewares/Authentication/Authentication');

// create push notification user
router.post('/create', checkAuthorization, UserPushNotificationContrller.create);

// get detail push notification user
router.get('/:id', checkAuthorization, UserPushNotificationContrller.detail);

// update push notification user
router.put('/:id', checkAuthorization, UserPushNotificationContrller.update);

// push notification user
router.post('/', checkAuthorization, pushAndoirdController.pushMessage);

// push notification user
router.get('/', checkAuthorization, UserPushNotificationContrller.index);

module.exports = router;
