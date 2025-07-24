const system = require('../../Constant/General/SystemConstant');
const logger = require('../../Constant/Logger/loggerConstant');
const userConstant = require('../../Constant/User/UserConstant');
const userService = require('../../Service/User/UserService');

const checkEmailExistValidation = async (request, response, next) => {
    const formData = request.body;
    const email = formData.userEmail;
    const errors = [];
    try {
        const checkEmail = await userService.findByEmail(email);

        if (checkEmail) {
            return logger.status200ExistEmail(
                response,
                system.error,
                userConstant.existEmail,
                email,
                true,
            );
        }
        next();
    } catch (error) {
        errors.push(error.message);
        return logger.status400(response, error, errors);
    }
};

module.exports = checkEmailExistValidation;
