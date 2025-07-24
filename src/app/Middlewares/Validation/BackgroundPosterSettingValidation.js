const Joi = require('joi');
const logger = require('../../Constant/Logger/loggerConstant');
const system = require('../../Constant/General/SystemConstant');

const CreateBackgroundPosterSettingValidationSchema = Joi.object({
    backgroundPosterSettingCategory: Joi.string().required(),
    backgroundPosterSettingName: Joi.string().required(),
    backgroundPosterSettingMon: Joi.boolean(),
    backgroundPosterSettingTue: Joi.boolean(),
    backgroundPosterSettingWed: Joi.boolean(),
    backgroundPosterSettingThu: Joi.boolean(),
    backgroundPosterSettingFri: Joi.boolean(),
    backgroundPosterSettingSat: Joi.boolean(),
    backgroundPosterSettingSun: Joi.boolean(),
    backgroundPosterSettingPosterList: Joi.array(),
});

const UpdateBackgroundPosterSettingValidationSchema = Joi.object({
    categoritesPosterProgramID: Joi.string().required().allow(""),
});

class BackgroundPosterSettingValidator {
    async create(req, res, next) {
        const errors = [];
        try {
            await CreateBackgroundPosterSettingValidationSchema.validateAsync(req.body);
            next();
        } catch (error) {
            errors.push(error.message);
            return logger.status400(res, error, errors, system.error);
        }
    }
    async update(req, res, next) {
        const errors = [];
        try {
            await UpdateBackgroundPosterSettingValidationSchema.validateAsync(req.body);
            next();
        } catch (error) {
            errors.push(error.message);
            return logger.status400(res, error, errors, system.error);
        }
    }
}

module.exports = new BackgroundPosterSettingValidator();
