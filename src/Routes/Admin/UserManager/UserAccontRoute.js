const express = require("express");
const router = express.Router();
const checkAuthorization = require('../../../app/Middlewares/Authentication/Authentication');
const userAccountController = require('../../../app/Controllers/Admin/UserManager/UserAccountController');
const authenticationByRole = require('../../../app/Middlewares/Authentication/AuthenticationByRole');
const constants = require('../../../app/Constant/constants');
const permissionMenu = require('../../../app/Middlewares/PermissionMenu');


// api permision menu
router.get("/menu", checkAuthorization, userAccountController.permissionMenu);

// authentication
router.all('/*', 
        checkAuthorization, 
        authenticationByRole([constants.USER_TYPE.ADMIN, constants.USER_TYPE.SUPPERADMIN]),
        permissionMenu('MG')
    );

// api create user admin
router.post("/create", checkAuthorization, userAccountController.create);

// api create user admin
router.put("/update/:id", checkAuthorization, userAccountController.update);

// api detail user admin
router.get("/detail/:id", checkAuthorization, userAccountController.detail);

// api delete user
router.delete("/delete/:id", checkAuthorization, userAccountController.detroy);

// api get list user
router.get("/", checkAuthorization, userAccountController.index);

module.exports = router;
