const express = require('express');
const router = express.Router();

const adminController = require('../../../app/Controllers/Admin/Admin/AdminController');
const checkAuthorization = require('../../../app/Middlewares/Authentication/Authentication');
const checkEmail = require('../../../app/Middlewares/Validation/EmailValidation');
const userValidation = require('../../../app/Middlewares/Validation/UserValidation');
const constants = require('../../../app/Constant/constants');

const authenticationByRole = require('../../../app/Middlewares/Authentication/AuthenticationByRole');

// api sign-up admin
router.post('/register', checkEmail, userValidation, adminController.register);

//api login admin
router.post('/login', checkEmail, adminController.login);

// authentication
router.all(
    '/*',
    checkAuthorization,
    authenticationByRole([constants.USER_TYPE.ADMIN, constants.USER_TYPE.SUPPERADMIN])
);

//api logout all admin
router.post('/logoutAll', adminController.logoutAll);

//api logout admin
router.post('/logout', adminController.logout);

//api logout admin
router.post('/confirm-password', adminController.confirmPassword);

// api get profile admin
router.get('/me', adminController.profile);

// api delete admin
router.delete('/me', adminController.destroy);

// api update admin
router.put('/me', adminController.update);

// api get list admin
router.get('/', adminController.index);

module.exports = router;
