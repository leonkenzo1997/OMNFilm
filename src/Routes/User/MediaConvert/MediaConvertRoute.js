const express = require('express');
const router = express.Router();

const checkAuthorization = require('../../../app/Middlewares/Authentication/Authentication');
const mediaConvertController = require('../../../app/Controllers/User/MediaConvert/MediaConvertController');

// api convert video
router.post('/', checkAuthorization, mediaConvertController.index);

// api delete file s3
router.delete('/delete/:id', checkAuthorization, mediaConvertController.deleteFile);

// api convert video background
router.get('/background/:id', checkAuthorization, mediaConvertController.backgroundVideo);

// get video status
router.get('/:id', checkAuthorization, mediaConvertController.getVideo);



module.exports = router;