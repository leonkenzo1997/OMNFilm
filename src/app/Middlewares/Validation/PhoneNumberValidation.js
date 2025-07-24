const system = require('../../Constant/General/SystemConstant');
const logger = require('../../Constant/Logger/loggerConstant');

const userService = require('../../Service/User/UserService');

const phoneNumberValidation = async (request, response, next) => {
	const formData = request.body;
	const errors = [];
	const idAreaCode = formData.idAreaCode;
	try {
		if (!idAreaCode) {
			return logger.status200(response, system.success, system.missingIdAreaCode);
		} else {
			const areaCode = await userService.findByAreaCode(idAreaCode);
			if (areaCode) {
				const areaCodeRegExp = /^\+([1-9]{1,4})$/;
				const checkAreaCode = areaCodeRegExp.test(formData.areaCode);

				if (!checkAreaCode) {
					return logger.status200(response, system.error, system.invalidAreaCode);
				}

				if (!(areaCode.areaCode === formData.areaCode)) {
					return logger.status200(response, system.error, system.invalidAreaCode);
				}

				const phoneNumberRegExp = /^[1-9]([0-9]{6,14})$/;
				const checkPhoneNumber = phoneNumberRegExp.test(formData.phoneNumber);

				if (!checkPhoneNumber) {
					return logger.status200(response, system.error, system.invalidPhoneNumber);
				}

				next();
			} else {
				return logger.status404(response, system.error, system.notFoundAreaCode(idAreaCode));
			}
		}
	} catch (error) {
		errors.push(error.message);
		return logger.status400(response, error, errors);
	}
};

module.exports = phoneNumberValidation;
