const express = require('express');
const router = express.Router();
const checkAuthorization = require('../../../app/Middlewares/Authentication/Authentication');
const historyEditProgramController = require('../../../app/Controllers/Offline/HistoryEditProgram/HistoryEditProgramController');

// authentication
router.all('/*', checkAuthorization);

// api get list challenger belong to user
router.get('/challenger/:id', historyEditProgramController.indexChallenger);

// api get list upload belong to user
router.get('/upload/:id', historyEditProgramController.indexUpload);

// api get detail challenger belong to user
router.get('/:id', historyEditProgramController.detailHistory);



module.exports = router;
