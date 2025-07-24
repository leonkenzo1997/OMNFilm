const express = require('express');
const router = express.Router();
const checkAuthorization = require('../../../app/Middlewares/Authentication/Authentication');
const OmnErController = require('../../../app/Controllers/Offline/OmnEr/OmnErController');

// authentication
router.all('/*', checkAuthorization);

// Get result letter by program id
router.get('/result-letter/:id', OmnErController.detailResultLetter);

// Get result letter by program id
router.get('/result-letter', OmnErController.resultLetter);

// Get user program in my program
router.get('/my-program', OmnErController.myProgram);

// Get user program in omniverse
router.get('/omniverse', OmnErController.omniverse);

module.exports = router;
