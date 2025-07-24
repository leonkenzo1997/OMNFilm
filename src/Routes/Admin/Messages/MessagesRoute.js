const express = require('express');
const router = express.Router();

const checkAuthorization = require('../../../app/Middlewares/Authentication/Authentication');
const authenticationByRole = require('../../../app/Middlewares/Authentication/AuthenticationByRole');
const messagesController = require('../../../app/Controllers/Admin/Messages/MessagesController');
const constants = require('../../../app/Constant/constants');

// authentication role
router.all(
    '/*',
    checkAuthorization,
    authenticationByRole([constants.USER_TYPE.SUPPERADMIN, constants.USER_TYPE.ADMIN])
);

// api get list notification
router.get('/', messagesController.getMessages);

// api get list notification deleted
router.get('/deleted', messagesController.getDeletedMessages);

// api search users
router.get('/search', messagesController.searchUsers);

// api get detail notification
router.get('/:id', messagesController.getDetailMessage);

// api send messages
router.post('/', messagesController.sendMessages);

// api delete message
router.delete('/:id', messagesController.deleteMessage);

module.exports = router;
