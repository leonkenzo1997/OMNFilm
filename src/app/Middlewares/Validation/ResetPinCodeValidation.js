const system = require('../../Constant/General/SystemConstant');
const userConstant = require('../../Constant/User/UserConstant');
const logger = require('../../Constant/Logger/loggerConstant');

const resetPinCodeValidation = async (request, response, next) => {
	const formData = request.body;
	const errors = [];
	const newPinCode = formData.newPinCode;
	const confirmPinCode = formData.confirmPinCode;
	try {
		// get key in array formData
		const keyData = Object.keys(formData);

		// check key when user input something different in system
		// method every is return true or false
		// => example: total: 4 properties if 3 true and 1 false => every return false.
		// otherwise 4 true. every return true

		const isValidOperation = keyData.every((update) => {
			return userConstant.allowedResetPinCode.includes(update);
		});

		if (!isValidOperation) {
			const fields = (keyData.filter(item => !userConstant.allowedResetPinCode.includes(item))).join(', ')
			return logger.status400(response, system.invalidField + fields, errors, system.error);
		}
		request.keyData = keyData;

		if (newPinCode || confirmPinCode) {
			if (newPinCode.length === 4 && confirmPinCode.length === 4) {
				const pinCodRegExp = /^([0-9]{1,4})$/;
				const checkLengthNewPinCode = pinCodRegExp.test(newPinCode);
				const checkLengthConfirmPinCode = pinCodRegExp.test(confirmPinCode);

				if (!checkLengthNewPinCode) {
					return logger.status200(response, system.error, system.invalidPinCode);
				}

				if (!checkLengthConfirmPinCode) {
					return logger.status200(response, system.error, system.invalidPinCode);
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
		return logger.status400(response, error, errors, system.error);
	}
};

module.exports = resetPinCodeValidation;
