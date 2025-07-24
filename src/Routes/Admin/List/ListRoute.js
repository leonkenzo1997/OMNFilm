const express = require('express');
const router = express.Router();

const checkAuthorization = require('../../../app/Middlewares/Authentication/Authentication');
const authenticationByRole = require('../../../app/Middlewares/Authentication/AuthenticationByRole');
const listController = require('../../../app/Controllers/Admin/List/ListController');
const listValidation = require('../../../app/Middlewares/Validation/ListsValidation');
const constants = require('../../../app/Constant/constants');

// authentication role
router.all(
    '/*',
    checkAuthorization,
    authenticationByRole([constants.USER_TYPE.SUPPERADMIN, constants.USER_TYPE.ADMIN])
);

// api create list
router.post(
    '/create',
    listValidation,
    listController.create,
);

// api add in list
router.post('/add-in-list/:id', listController.addInList);

// api add program in list
router.post('/add-program/:id', listController.addProgram);

// api add all program in list
router.post('/add-all-program/:id', listController.addAllProgram);

// api search category and tag
router.get('/search', listController.search);

// api get categories
router.get('/categories', listController.categories);

// api get tags
router.get('/tags', listController.tags);

// api get loop
router.get('/loops', listController.loops);

// api get no-loop
router.get('/no-loops', listController.noLoops);

// api get loop & no-loop
router.get('/all', listController.all);

// api get list childrens
router.get('/childrens/:id', listController.listChildrens);

// api get program in list
router.get('/program/:id', listController.programInList);

// api get detail uplaod
router.get('/:id', listController.detail);

// api get detail list
router.put('/:id', listValidation, listController.update);

// api delete list
router.delete('/:id', listController.destroy);

// api get array list
router.get('/', listController.index);

module.exports = router;
