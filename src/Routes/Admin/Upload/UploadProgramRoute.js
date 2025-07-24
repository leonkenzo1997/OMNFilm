const express = require('express');
const router = express.Router();

const checkAuthorization = require('../../../app/Middlewares/Authentication/Authentication');
const authenticationByRole = require('../../../app/Middlewares/Authentication/AuthenticationByRole');
const uploadProgramController = require('../../../app/Controllers/Admin/Upload/UploadProgramController');
const constants = require('../../../app/Constant/constants');

// authentication role
router.all(
    '/*',
    checkAuthorization,
    authenticationByRole([constants.USER_TYPE.SUPPERADMIN, constants.USER_TYPE.ADMIN])
);

// api create history
router.post('/history/:id', uploadProgramController.addHistory);

// api get list delete request upload
router.get('/request-delete', uploadProgramController.listDelete);

// api get list delete upload
router.get('/list-delete', uploadProgramController.listSoftDelete);

// api status : { approval, denied, delete } upload program
// router.put('/status/:id', uploadProgramController.updateStatus);
router.put('/status/:id', uploadProgramController.updateStatusNewFlow);

//api get all status of program
router.get('/status', uploadProgramController.statusAll);

// api get episode by programID and seasonID
router.get('/episodes', uploadProgramController.getEpisodes);

// api get history newest
router.get('/history-newest/:id', uploadProgramController.getHistoryNewest);

// api get history
router.get('/history/:id', uploadProgramController.getHistory);

// api get detail upload program
router.get('/:id', uploadProgramController.detail);

// api update upload program
router.put('/:id', uploadProgramController.update);

// api get list upload program
router.get('/', uploadProgramController.indexAdmin);

module.exports = router;
