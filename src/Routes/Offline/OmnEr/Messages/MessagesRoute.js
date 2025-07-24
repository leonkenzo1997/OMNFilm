const express = require('express');
const router = express.Router();
const checkAuthorization = require('../../../../app/Middlewares/Authentication/Authentication');
const messagesController = require('../../../../app/Controllers/Offline/OmnEr/Messages/MessagesController');
const OmnErController = require('../../../../app/Controllers/Offline/OmnEr/Messages/MessagesController');

// authentication
router.all('/*', checkAuthorization);

// api get messages
router.get('/', messagesController.index);

// Get user program in omniverse
router.get('/omniverse', OmnErController.omniverse);

// Get result letter in omniverse
router.get('/result-letter', OmnErController.resultLetter);

// Get detail result letter in omniverse
router.get('/result-letter/:id', OmnErController.detailResultLetter);

// api get detail message
router.get('/:id', messagesController.detail);

module.exports = router;
