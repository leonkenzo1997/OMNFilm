const constants = require('../Constant/constants');
global.checkAdmin = function checkAdmin(type) {
    return [constants.USER_TYPE.ADMIN, constants.USER_TYPE.SUPPERADMIN].includes(type);
}