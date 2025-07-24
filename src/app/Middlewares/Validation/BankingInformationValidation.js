const Joi = require('joi');
const logger = require('../../Constant/Logger/loggerConstant');
const system = require('../../Constant/General/SystemConstant');
const constants = require('../../Constant/constants');

const BankingInformationValidationSchema = Joi.object({
	koreanBank: Joi.string().required(),
	accountName: Joi.string().required(),
	accountNumber: Joi.string().required(),
});

class BankingInformationValidator {
	async update(req, res, next) {
		const errors = [];
		try {
			await BankingInformationValidationSchema.validateAsync(req.body);
			next();
		} catch (error) {
			errors.push(error.message);
			return logger.status400(res, error, errors, system.error);
		}
	}
}

module.exports = new BankingInformationValidator();
