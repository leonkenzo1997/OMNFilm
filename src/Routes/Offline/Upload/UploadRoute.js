const express = require('express');
const router = express.Router();
const checkAuthorization = require('../../../app/Middlewares/Authentication/Authentication');
const validation = require('../../../app/Middlewares/Validation/UploadValidation');
const uploadController = require('../../../app/Controllers/Offline/Upload/UploadController');
const uploadImagesController = require('../../../app/Controllers/Offline/Upload/UploadImagesController');

//post api convert images for upload
router.post('/convert', uploadImagesController.uploadImages);

// authentication
router.all('/*', checkAuthorization);

// api create challenger
router.post('/create',
validation,
uploadController.create);

// api get list upload belong to user
router.get('/my-program', uploadController.myProgram);

// api get detail program omner
router.get('/detail-program-omner/:id', uploadController.detailProgramOMNEr);

// api get detail challenger belong to user
router.get('/:id', uploadController.detail);

// api revert old data upload
// router.put('/status/:id', uploadController.updateStatus);
router.put('/revert-data/:id', uploadController.returnOldData);

// api clear program denial
router.put('/clear-program-denial/:id', uploadController.clearProgramDenial);

// api update challenger belong to user
// router.put('/:id', validation, uploadController.update);
router.put('/:id',
// validation,
uploadController.updateNewFlow);

// api delete program
router.delete('/:id', uploadController.delete);

// api get list upload belong to user
router.get('/', uploadController.index);

module.exports = router;
