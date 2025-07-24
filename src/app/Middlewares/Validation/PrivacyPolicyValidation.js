const system = require('../../Constant/General/SystemConstant');
const privacyPolicyConstant = require('../../Constant/PrivacyPolicy/PrivacyPolicyConstant');
const logger = require('../../Constant/Logger/loggerConstant');

const privacyPolicyValidation = async (request, response, next) => {
	const formData = request.body;
	const errors = [];
	try {
		// get key in array formData
		const keyData = Object.keys(formData);

		// check key when user input something different in system
		// method every is return true or false
		// => example: total: 4 properties if 3 true and 1 false => every return false.
		// otherwise 4 true. every return true

		const isValidOperation = keyData.every((update) => {
			return privacyPolicyConstant.allowedUpdates.includes(update);
		});

		if (!isValidOperation) {
			const fields = keyData.filter((item) => !privacyPolicyConstant.allowedUpdates.includes(item)).join(', ');
			return logger.status400(response, system.invalidField + fields, errors, system.error);
		}
		request.keyData = keyData;
		next();
	} catch (error) {
		errors.push(error.message);
		return logger.status400(response, error, errors, system.error);
	}
};

module.exports = privacyPolicyValidation;
