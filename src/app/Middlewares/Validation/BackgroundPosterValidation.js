const Joi = require('joi');
const logger = require('../../Constant/Logger/loggerConstant');
const system = require('../../Constant/General/SystemConstant');

const CreateBackgroundPosterValidationSchema = Joi.object({
    backgroundPosterProgramID: Joi.string().required(),
});

const UpdateBackgroundPosterValidationSchema = Joi.object({
    backgroundPosterProgramID: Joi.string().required().allow(""),
});

class BackgroundPosterValidator {
    async create(req, res, next) {
        const errors = [];
        try {
            await CreateBackgroundPosterValidationSchema.validateAsync(req.body);
            next();
        } catch (error) {
            errors.push(error.message);
            return logger.status400(res, error, errors, system.error);
        }
    }
    async update(req, res, next) {
        const errors = [];
        try {
            await UpdateBackgroundPosterValidationSchema.validateAsync(req.body);
            next();
        } catch (error) {
            errors.push(error.message);
            return logger.status400(res, error, errors, system.error);
        }
    }
}

module.exports = new BackgroundPosterValidator();
