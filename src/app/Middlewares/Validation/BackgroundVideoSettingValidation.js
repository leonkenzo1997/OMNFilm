const Joi = require('joi');
const logger = require('../../Constant/Logger/loggerConstant');
const system = require('../../Constant/General/SystemConstant');

const CreateBackgroundVideoSettingValidationSchema = Joi.object({
    backgroundVideoSettingCategory: Joi.string().required(),
    backgroundVideoSettingName: Joi.string().required(),
});

const UpdateBackgroundVideoSettingValidationSchema = Joi.object({
    backgroundVideoSettingCategory: Joi.string(),
    backgroundVideoSettingName: Joi.string(),
    backgroundVideoSettingMon: Joi.boolean(),
    backgroundVideoSettingTue: Joi.boolean(),
    backgroundVideoSettingWed: Joi.boolean(),
    backgroundVideoSettingThu: Joi.boolean(),
    backgroundVideoSettingFri: Joi.boolean(),
    backgroundVideoSettingSat: Joi.boolean(),
    backgroundVideoSettingSun: Joi.boolean(),
});

class BackgroundVideoSettingValidator {
    async create(req, res, next) {
        const errors = [];
        try {
            await CreateBackgroundVideoSettingValidationSchema.validateAsync(
                req.body
            );
            next();
        } catch (error) {
            errors.push(error.message);
            return logger.status400(res, error, errors, system.error);
        }
    }
    async update(req, res, next) {
        const errors = [];
        try {
            await UpdateBackgroundVideoSettingValidationSchema.validateAsync(
                req.body
            );
            next();
        } catch (error) {
            errors.push(error.message);
            return logger.status400(res, error, errors, system.error);
        }
    }
}

module.exports = new BackgroundVideoSettingValidator();
