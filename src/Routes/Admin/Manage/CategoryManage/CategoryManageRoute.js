const express = require('express');
const router = express.Router();

const checkAuthorization = require('../../../../app/Middlewares/Authentication/Authentication');
const authenticationByRole = require('../../../../app/Middlewares/Authentication/AuthenticationByRole');
const categoryManageController = require('../../../../app/Controllers/Admin/Manage/CategoryManage/CategoryManageController');
const categoryManageValidation = require('../../../../app/Middlewares/Validation/CategoryManageValidation');
const constants = require('../../../../app/Constant/constants');

// authentication role
router.all(
    '/*',
    checkAuthorization,
    authenticationByRole([constants.USER_TYPE.SUPPERADMIN, constants.USER_TYPE.ADMIN])
);

// api create category-manage
router.post(
	'/create',
	categoryManageValidation,
	categoryManageController.create
);

// api get detail category-manage
router.get('/:id', categoryManageController.detail);

// api get detail category-manage
router.put(
	'/:id',
	categoryManageValidation,
	categoryManageController.update
);

// api delete category-manage
router.delete('/:id', categoryManageController.destroy);

// api get list category-manage
router.get('/', categoryManageController.index);

module.exports = router;
