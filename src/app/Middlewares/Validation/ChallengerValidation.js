const system = require('../../Constant/General/SystemConstant');
const challengerConstant = require('../../Constant/Challenger/ChallengerConstant');
const logger = require('../../Constant/Logger/loggerConstant');
const isEmpty = require('lodash/isEmpty');
const constants = require('../../Constant/constants');
const _ = require('lodash');

const challengerValidation = async (request, response, next) => {
	const formData = request.body;
	const errors = [];
	const programTypeVideo = formData.programTypeVideo;
	try {
		// get key in array formData
		const keyData = Object.keys(formData);
		const valueData = Object.values(formData);

		// check key when user input something different in system
		// method every is return true or false
		// => example: total: 4 properties if 3 true and 1 false => every return false.
		// otherwise 4 true. every return true

		// validate keys

		let fieldsValidate;
		if (programTypeVideo === constants.TYPE_VIDEO.SS) {
			// validate keys
			fieldsValidate = challengerConstant.fieldsValidate;
		} else {
			// validate keys
			fieldsValidate = challengerConstant.fieldsValidateStandAlone;
		}

		const isValidKeys = keyData.every((item) => fieldsValidate.includes(item));

		// validate values
		const isValidValues = valueData.some((item) => _.isEmpty(item));

		if (!isValidKeys) {
			const fields = (keyData.filter(item => !fieldsValidate.includes(item))).join(', ')
			return logger.status400(response, system.invalidField + fields, system.error);
		}
		if (isValidValues) {
			return logger.status400(response, system.errorValue, system.error);
		}
		next();
	} catch (error) {
		errors.push(error.message);
		return logger.status400(response, error, errors, system.error);
	}
};

module.exports = challengerValidation;
