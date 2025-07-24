const system = require('../../Constant/General/SystemConstant');
const logger = require('../../Constant/Logger/loggerConstant');
const userConstant = require('../../Constant/User/UserConstant');
const userService = require('../../Service/User/UserService');

const checkPhoneNumberExistValidation = async (request, response, next) => {
	const formData = request.body;
	const phoneNumber = formData.phoneNumber;
	const areaCode = formData.areaCode;
	const userPhoneNumber = {
		areaCode: areaCode,
		phoneNumber: phoneNumber,
	};
	const errors = [];
	try {
		const checkPhoneNumber = await userService.checkPhoneNumberExist(userPhoneNumber);

		if (checkPhoneNumber) {
			return logger.status200PhoneNumberExist(
				response,
				system.error,
				userConstant.existPhoneNumber,
				userPhoneNumber,
				true
			);
		}
		next();
	} catch (error) {
		errors.push(error.message);
		return logger.status400(response, error, errors);
	}
};

module.exports = checkPhoneNumberExistValidation;
