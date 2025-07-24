const express = require('express');
const router = express.Router();
const checkAuthorization = require('../../../app/Middlewares/Authentication/Authentication');
const validation = require('../../../app/Middlewares/Validation/ChallengerValidation');
const challengerController = require('../../../app/Controllers/Offline/Challenger/ChallengerController');

// authentication
router.all('/*', checkAuthorization);

// api create challenger
router.post('/create', validation, challengerController.create);

// api get list challenger upload for user
router.get('/listProgramUpload', challengerController.listProgramUpload);

// api get list challenger approval for user
router.get('/listProgramApproval', challengerController.listProgramApproval);

// api get detail challenger belong to user
router.get('/:id', challengerController.detail);

// api revert old data upload
router.put('/revert-data/:id', challengerController.returnOldData);

// api update challenger belong to user
router.put('/:id', validation, challengerController.update);
// router.put('/:id', validation, challengerController.updateNewFlow);

// api delete program
router.delete('/:id', challengerController.delete);

// api get list challenger belong to user
router.get('/', challengerController.index);


module.exports = router;
