const express = require('express');
const router = express.Router();

const checkAuthorization = require('../../../app/Middlewares/Authentication/Authentication');
const authenticationByRole = require('../../../app/Middlewares/Authentication/AuthenticationByRole');
const uploadController = require('../../../app/Controllers/Admin/Upload/UploadController');
const constants = require('../../../app/Constant/constants');

// authentication role
router.all(
    '/*',
    checkAuthorization,
    authenticationByRole([constants.USER_TYPE.SUPPERADMIN, constants.USER_TYPE.ADMIN])
);

// api create upload
router.post('/create', uploadController.create);

// api create history
router.post('/history/:id', uploadController.addHistory);

//api get all status of program
router.get('/status', uploadController.statusAll);

// api get episode by programID and seasonID
router.get('/episodes', uploadController.getEpisodes);

// api get list delete request upload
router.get('/request-delete', uploadController.listDelete);

// api get list delete upload
router.get('/list-delete', uploadController.listSoftDelete);

// api get history newest
router.get('/history-newest/:id', uploadController.getHistoryNewest);

// api get history
router.get('/history/:id', uploadController.getHistory);

// api get program add in list
router.get('/program-add-list', uploadController.programAddList);

// api get list children
router.get('/children/:id', uploadController.getListChildren);

// api get detail uplaod
router.get('/:id', uploadController.detail);

// api update status upload
// router.put('/status/:id', uploadController.updateStatus);
router.put('/status/:id', uploadController.updateStatusNewFlow);

// // api update upload
router.put('/:id', uploadController.update);

// api get list upload
router.get('/', uploadController.index);

//app view
router.get('/view/:id', uploadController.view);

module.exports = router;
