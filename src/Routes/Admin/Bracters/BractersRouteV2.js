const express = require('express');
const router = express.Router();

const checkAuthorization = require('../../../app/Middlewares/Authentication/Authentication');
const authenticationByRole = require('../../../app/Middlewares/Authentication/AuthenticationByRole');
const bractersController = require('../../../app/Controllers/Admin/Bracters/BractersControllerV2');
const constants = require('../../../app/Constant/constants');

// authentication role
router.all(
    '/*',
    checkAuthorization,
    authenticationByRole([constants.USER_TYPE.SUPPERADMIN, constants.USER_TYPE.ADMIN])
);

//api get list categories not in bracter
router.get('/categories', bractersController.categories);

// api get list categories in bracter
router.get('/', bractersController.index);

// api create category for bracter
router.post('/create', bractersController.create);

// api delete bracters
router.delete('/:id', bractersController.destroy);

// api add program in bracter
router.post('/add-program/:id', bractersController.addProgram);

// api delete program in bracter
router.put('/delete-program/:id', bractersController.deleteProgram);

//api get list programs in category
router.get('/list-programs/:id', bractersController.listPrograms);

//api get list programs add category
router.get('/program-add-category/:id', bractersController.programAddCategory);

module.exports = router;
