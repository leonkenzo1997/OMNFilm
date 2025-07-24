const express = require('express');
const router = express.Router();
const checkAuthorization = require('../../../../app/Middlewares/Authentication/Authentication');
const authenticationByRole = require('../../../../app/Middlewares/Authentication/AuthenticationByRole');
const constants = require('../../../../app/Constant/constants');
const backgroundPosterController = require('../../../../app/Controllers/Admin/Background/Poster/BackgroundPosterController');
const backgroundPosterValidation = require('../../../../app/Middlewares/Validation/BackgroundPosterValidation');
// authentication role
router.all(
    '/*',
    checkAuthorization,
    authenticationByRole([constants.USER_TYPE.SUPPERADMIN, constants.USER_TYPE.ADMIN])
);

router.post(
    '/create',
    backgroundPosterValidation.create,
    backgroundPosterController.create
);

router.put('/:id', backgroundPosterValidation.update, backgroundPosterController.update);

router.get('/list-video', backgroundPosterController.indexDropdownlist);

router.get('/search', backgroundPosterController.searchProgram);

// router.get('/category', backgroundPosterController.categories);

// router.get('/tags', backgroundPosterController.tags);

// router.get('/find', backgroundPosterController.find);

router.get('/:id', backgroundPosterController.detail);

router.get('/', backgroundPosterController.index);

module.exports = router;
