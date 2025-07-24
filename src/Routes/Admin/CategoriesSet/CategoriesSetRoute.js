const express = require('express');
const router = express.Router();

const categoriesSetController = require('../../../app/Controllers/Admin/CategoriesSet/CategoriesSetController');
const checkAuthorization = require('../../../app/Middlewares/Authentication/Authentication');
const authenticationByRole = require('../../../app/Middlewares/Authentication/AuthenticationByRole');
const categoriesSetValidation = require('../../../app/Middlewares/Validation/CategoriesSetValidation');
const constants = require('../../../app/Constant/constants');

// authentication role
router.all(
    '/*',
    checkAuthorization,
    authenticationByRole([constants.USER_TYPE.SUPPERADMIN, constants.USER_TYPE.ADMIN])
);

// api get list delete categorySet
router.get('/list-delete', categoriesSetController.listDelete);

// api get all list categorySet in home set
router.get('/all', categoriesSetController.allList);

// api get detail categorySet
router.get('/list-delete/:id', categoriesSetController.detailDelete);

// api get list categorySet
router.get('/all', categoriesSetController.getListAll);

// api get detail categorySet
router.get('/:id', categoriesSetController.detail);

// api create categorySet
router.post('/create', categoriesSetValidation, categoriesSetController.create);

// api restore categorySet
router.patch('/list-delete/:id/restore', categoriesSetController.restore);

// api update categorySet
router.put('/:id', categoriesSetValidation, categoriesSetController.update);

// api delete categorySet
router.delete('/:id', categoriesSetController.destroy);

// api complete delete categorySet in db
router.delete('/:id/complete-destroy', categoriesSetController.completeDestroy);

// api get list categorySet
router.get('/', categoriesSetController.index);

module.exports = router;
