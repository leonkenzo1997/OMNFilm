const Joi = require('joi');
const logger = require('../../Constant/Logger/loggerConstant');
const system = require('../../Constant/General/SystemConstant');

const CreateParentProtectionValidationSchema = Joi.object({
	name: Joi.string().required(),
	description: Joi.string().required(),
	type: Joi.number().required(),
});

const UpdateParentProtectionValidationSchema = Joi.object({
	id: Joi.string().required(),
	name: Joi.string().required(),
    description: Joi.string().required(),
    type: Joi.number().required(),
});

class ParentProtectionValidator {
	async create(req, res, next) {
		const errors = [];
		try {
			await CreateParentProtectionValidationSchema.validateAsync(req.body);
			next();
		} catch (error) {
			errors.push(error.message);
			return logger.status400(res, error, errors, system.error);
		}
	}
	async update(req, res, next) {
		const errors = [];
		try {
			await UpdateParentProtectionValidationSchema.validateAsync(req.body);
			next();
		} catch (error) {
			errors.push(error.message);
			return logger.status400(res, error, errors, system.error);
		}
	}
}

module.exports = new ParentProtectionValidator();
