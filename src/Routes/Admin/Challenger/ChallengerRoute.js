const express = require('express');
const router = express.Router();

const checkAuthorization = require('../../../app/Middlewares/Authentication/Authentication');
const authenticationByRole = require('../../../app/Middlewares/Authentication/AuthenticationByRole');
const challengerController = require('../../../app/Controllers/Admin/Challenger/ChallengerController');
const constants = require('../../../app/Constant/constants');

// authentication role
router.all(
    '/*',
    checkAuthorization,
    authenticationByRole([constants.USER_TYPE.SUPPERADMIN, constants.USER_TYPE.ADMIN])
);

// api create history
router.post('/history/:id', challengerController.addHistory);

// api get list delete request challenger
router.get(
    '/request-delete',
    challengerController.listDelete,
);

// api get list delete challenger
router.get(
    '/list-delete',
    challengerController.listSoftDelete,
);

// api get detail challenger
// router.get('/list-delete/:id', challengerController.detailDelete);

router.get('/status', challengerController.statusAll);

// api get episode by programID and seasonID
router.get('/episodes', challengerController.getEpisodes);

// api get history newest
router.get('/history-newest/:id', challengerController.getHistoryNewest);

// api get history
router.get('/history/:id', challengerController.getHistory);

// api get list children
router.get('/children/:id', challengerController.getListChildren);

// api get detail challenger
router.get('/:id', challengerController.detail);

// api restore challenger
router.patch(
    '/list-delete/:id/restore',
    challengerController.restore,
);

// api update challenger
// router.put('/status/:id', challengerController.updateStatusNewFlow);
router.put('/status/:id', challengerController.updateStatus);

// api delete challenger
router.delete('/:id', challengerController.destroy);

// api delete challenger
router.put('/:id', challengerController.update);

// api complete delete challenger in db
router.delete(
    '/:id/complete-destroy',
    challengerController.completeDestroy,
);

// api get list challenger
router.get('/', challengerController.index);

router.get('/view/:id', challengerController.view);

module.exports = router;
