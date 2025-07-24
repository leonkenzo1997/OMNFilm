const logger = require('../../Constant/Logger/loggerConstant');
const system = require('../../Constant/General/SystemConstant');
const constants = require('../../Constant/constants');

class ProgramOriginalValidator {
	async changeStatus(req, res, next) {
		const errors = [];
		const formData = req.body
		try {
			const fieldsValidate = ['programCurrentStatus'];
			const keyData = Object.keys(formData);

			const isValidKeys = keyData.every((item) => {
				return fieldsValidate.includes(item);
			});

			if (!isValidKeys) {
				const fields = keyData.filter((item) => !fieldsValidate.includes(item)).join(', ');
				return logger.status400(res, system.invalidField + fields, system.error);
			}

			const isValidValues = [
				constants.PROGRAM_STATUS.APPROVAL,
				constants.PROGRAM_STATUS.DENIAL,
				constants.PROGRAM_STATUS.UPLOAD
			].includes(formData.programCurrentStatus)

			if (!isValidValues) {
				return logger.status400(res, system.errorValue, system.error);
			}
			next();
		} catch (error) {
			errors.push(error.message);
			return logger.status400(res, error, errors, system.error);
		}
	}
}

module.exports = new ProgramOriginalValidator();
