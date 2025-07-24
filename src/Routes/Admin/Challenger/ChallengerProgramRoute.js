const express = require('express');
const router = express.Router();

const checkAuthorization = require('../../../app/Middlewares/Authentication/Authentication');
const authenticationByRole = require('../../../app/Middlewares/Authentication/AuthenticationByRole');
const challengerProgramController = require('../../../app/Controllers/Admin/Challenger/ChallengerProgramController');
const constants = require('../../../app/Constant/constants');

// authentication role
router.all(
    '/*',
    checkAuthorization,
    authenticationByRole([constants.USER_TYPE.SUPPERADMIN, constants.USER_TYPE.ADMIN])
);

// api create history
router.post('/history/:id', challengerProgramController.addHistory);

// api get list delete request challenger
router.get('/request-delete', challengerProgramController.listDelete);

// api get list delete challenger
router.get('/list-delete', challengerProgramController.listSoftDelete);

// api status : { approval, denied, delete } challenger program
// router.put('/status/:id', challengerProgramController.updateStatusNewFlow);
router.put('/status/:id', challengerProgramController.updateStatus);
// api status challenger program
router.get('/status', challengerProgramController.statusAll);

// api get episode by programID and seasonID
router.get('/episodes', challengerProgramController.getEpisodes);

// api get history newest
router.get('/history-newest/:id', challengerProgramController.getHistoryNewest);

// api get history
router.get('/history/:id', challengerProgramController.getHistory);

// api get detail challenger program
router.get('/:id', challengerProgramController.detail);

// api update challenger program
router.put('/:id', challengerProgramController.update);

// api get list challenger program
router.get('/', challengerProgramController.indexAdmin);

module.exports = router;
