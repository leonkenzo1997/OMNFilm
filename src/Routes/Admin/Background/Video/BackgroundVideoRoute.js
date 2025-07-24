const express = require('express');
const router = express.Router();
const checkAuthorization = require('../../../../app/Middlewares/Authentication/Authentication');
const authenticationByRole = require('../../../../app/Middlewares/Authentication/AuthenticationByRole');
const constants = require('../../../../app/Constant/constants');
const backgroundVideoController = require('../../../../app/Controllers/Admin/Background/Video/BackgroundVideoController');
const backgroundVideoValidation = require('../../../../app/Middlewares/Validation/BackgroundVideoValidation');

// authentication role
router.all(
    '/*',
    checkAuthorization,
    authenticationByRole([constants.USER_TYPE.SUPPERADMIN, constants.USER_TYPE.ADMIN])
);

router.post(
    '/create',
    backgroundVideoValidation.create,
    backgroundVideoController.create
);

router.put('/edit-file-video', backgroundVideoController.deleteFileVideo);

router.put('/:id', backgroundVideoValidation.update, backgroundVideoController.update);

router.delete('/:id', backgroundVideoController.destroy);

router.get('/list-video', backgroundVideoController.indexDropdownlist);

router.get('/search', backgroundVideoController.searchProgram);

// router.get('/category', backgroundVideoController.categories);

// router.get('/tags', backgroundVideoController.tags);

// router.get('/find', backgroundVideoController.find);

router.get('/:id', backgroundVideoController.detail);

router.get('/', backgroundVideoController.index);

module.exports = router;
