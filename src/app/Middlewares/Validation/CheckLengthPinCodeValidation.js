const system = require('../../Constant/General/SystemConstant');
const logger = require('../../Constant/Logger/loggerConstant');

const checkLengthPinCode = async (request, response, next) => {
	const formData = request.body;
    const errors = [];
    const pinCode = formData.userPinCode;
	try {
		if (formData.userPinCode) {
			if (pinCode.length === 4) {
				const pinCodRegExp = /^([0-9]{1,4})$/;
				const checkLengthPinCode = pinCodRegExp.test(pinCode);
				if (!checkLengthPinCode) {
					return logger.status200(
						response,
						system.error,
						system.invalidPinCode
					);
				}
				next();
			} else {
				return logger.status200(response, system.error, system.limitPinCode);
			}
		} else {
			next();
		}
	} catch (error) {
		errors.push(error.message);
		return logger.status400(response, error, errors);
	}
};

module.exports = checkLengthPinCode;
