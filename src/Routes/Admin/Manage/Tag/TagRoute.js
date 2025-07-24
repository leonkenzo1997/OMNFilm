const express = require('express');
const router = express.Router();

const checkAuthorization = require('../../../../app/Middlewares/Authentication/Authentication');
const authenticationByRole = require('../../../../app/Middlewares/Authentication/AuthenticationByRole');
const tagController = require('../../../../app/Controllers/Admin/Manage/Tag/TagController');
const tagValidation = require('../../../../app/Middlewares/Validation/TagValidation');
const constants = require('../../../../app/Constant/constants');

// authentication role
router.all(
    '/*',
    checkAuthorization,
    authenticationByRole([constants.USER_TYPE.SUPPERADMIN, constants.USER_TYPE.ADMIN])
);

// api create category-manage
router.post('/create', tagValidation, tagController.create);

// api get detail category-manage
router.get('/:id', tagController.detail);

// api get detail category-manage
router.put('/:id', tagValidation, tagController.update);

// api delete category-manage
router.delete('/:id', tagValidation, tagController.destroy);

// api get list category-manage
router.get('/', tagController.index);

module.exports = router;
