const express = require('express');
const router = express.Router();

const UserController = require('../../app/Controllers/User/UserController');
const AreaCodeController = require('../../app/Controllers/User/AreaCode/AreaCodeController');
const EmailController = require('../../app/Controllers/User/Email/EmailController');

const checkAuthorization = require('../../app/Middlewares/Authentication/Authentication');
const userValidation = require('../../app/Middlewares/Validation/UserValidation');
const checkEmailValidation = require('../../app/Middlewares/Validation/EmailValidation');
const checkEmailExist = require('../../app/Middlewares/Validation/CheckEmailExistValidation');
const checkPhoneNumber = require('../../app/Middlewares/Validation/PhoneNumberValidation');
const changePhoneNumberValidation = require('../../app/Middlewares/Validation/ChangePhoneNumberValidation');
const changePasswordValidation = require('../../app/Middlewares/Validation/ChangePasswordValidation');
const resetPasswordValidation = require('../../app/Middlewares/Validation/ResetPasswordValidation');
const checkOTPValidation = require('../../app/Middlewares/Validation/CheckOTPValidation');
const checkPhoneNumberExist = require('../../app/Middlewares/Validation/CheckPhoneNumberExistValidation');
const checkFieldPhoneNumber = require('../../app/Middlewares/Validation/CheckFieldPhoneNumberExistValidation');
const checkUpdateUser = require('../../app/Middlewares/Validation/CheckUpdateUserValidation');
const checkFieldPinCode = require('../../app/Middlewares/Validation/CheckFieldPinCodeValidation');
const checkLengthPinCode = require('../../app/Middlewares/Validation/CheckLengthPinCodeValidation');
const resetPinCodeValidation = require('../../app/Middlewares/Validation/ResetPinCodeValidation');
const videoSettingValidation = require('../../app/Middlewares/Validation/VideoSettingValidation');

// api get list user
router.post('/area-code/test', checkAuthorization, AreaCodeController.test);

//api check email of user
router.post(
    '/check-otp-phone-number',
    checkFieldPhoneNumber,
    checkPhoneNumber,
    UserController.checkOTPOfPhoneNumber
);

//api check phone number of user
router.post(
    '/check-phone-number',
    checkFieldPhoneNumber,
    checkPhoneNumber,
    UserController.checkPhoneNumber
);

// api check opt email user
router.post(
    '/check-otp-email',
    checkOTPValidation,
    checkEmailValidation,
    UserController.checkOTPOfEmail
);

//api check email of user
router.post(
    '/send-otp-pin-code',
    userValidation,
    checkEmailValidation,
    EmailController.sendOTPResetPinCode
);

//api check email of user
router.post(
    '/send-otp-email',
    userValidation,
    checkEmailValidation,
    EmailController.sendOTP
);

//api check email of user
router.post(
    '/check-email',
    userValidation,
    checkEmailValidation,
    UserController.checkEmail
);

//api logout all user
router.post('/logoutAll', checkAuthorization, UserController.logoutAll);

// api sign-up user
router.post(
    '/register',
    checkEmailValidation,
    userValidation,
    checkEmailExist,
    UserController.register
);

// api get list user
router.get('/view/:id', checkAuthorization, UserController.view);

router.post('/checkDRM', checkAuthorization, UserController.checktokenDRM);

//api logout user
router.post('/logout', checkAuthorization, UserController.logout);

//api login user
router.post('/login', userValidation, checkEmailValidation, UserController.login);

//api login user with token
router.get('/login-by-token', checkAuthorization, UserController.loginByToken);

// api check pin code
router.post(
    '/check-pin-code',
    checkAuthorization,
    checkFieldPinCode,
    checkLengthPinCode,
    UserController.checkPinCode
);

// api get list user
router.get('/delete-phone-number', checkAuthorization, UserController.deletePhoneNumber);

//api deactive plan
router.post('/deactive-plan', checkAuthorization, UserController.deactivePlan);

// api check notice
router.get('/check-notice', checkAuthorization, UserController.checkNotice);

// api get notice
router.get('/get-notice', checkAuthorization, UserController.getNotice);

// api get list user
router.get('/area-code', AreaCodeController.index);

//api like program
router.get('/like/:id', checkAuthorization, UserController.like);

//api unlike program
router.get('/unlike/:id', checkAuthorization, UserController.unlike);

// api get profile user
router.get('/me', checkAuthorization, UserController.profile);

// api delete user
router.delete('/me', checkAuthorization, UserController.destroy);

// api update parent protection
router.put(
    '/update-parent-protection',
    checkAuthorization,
    checkUpdateUser,
    UserController.updateParentProtection
);

//api reset password by email
router.put(
    '/reset-password-by-phone-number',
    checkFieldPhoneNumber,
    checkPhoneNumber,
    UserController.resetPasswordByPhoneNumber
);

//api reset password by email
router.put(
    '/reset-password-by-email',
    resetPasswordValidation,
    checkEmailValidation,
    UserController.resetPasswordByEmail
);

//api reset password by email
router.put(
    '/reset-pin-code',
    resetPinCodeValidation,
    checkEmailValidation,
    UserController.resetPinCode
);

//api change phone number
router.put(
    '/change-phone-number',
    checkAuthorization,
    changePhoneNumberValidation,
    checkPhoneNumber,
    checkPhoneNumberExist,
    UserController.changePhoneNumber
);

//api change password
router.put(
    '/change-password',
    checkAuthorization,
    changePasswordValidation,
    UserController.changePassword
);

// api update user
router.put(
    '/video-setting',
    checkAuthorization,
    videoSettingValidation,
    UserController.updateVideoSetting
);

// api update user
router.put(
    '/me',
    checkAuthorization,
    checkUpdateUser,
    checkLengthPinCode,
    UserController.update
);

// api update user
// router.put('/:id', UserController.updateUser);

//api user feedback
router.post('/create-feedback', checkAuthorization, UserController.createFeedback);

// api get list user
router.get('/', checkAuthorization, UserController.index);

module.exports = router;
