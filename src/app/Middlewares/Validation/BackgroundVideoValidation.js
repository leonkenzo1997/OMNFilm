const Joi = require('joi');
const logger = require('../../Constant/Logger/loggerConstant');
const system = require('../../Constant/General/SystemConstant');

const CreateBackgroundVideoValidationSchema = Joi.object({
    backgroundVideoTrailer: Joi.string().allow(""),
    backgroundVideoProgramID: Joi.string().required(),
    // backgroundVideoUploadTrailer: Joi.date().allow(""),
});

const UpdateBackgroundVideoValidationSchema = Joi.object({
    backgroundVideoTrailer: Joi.string().allow(''),
    // backgroundVideoProgramID: Joi.string(),
    // backgroundVideoUploadTrailer: Joi.date().allow(''),
    // backgroundVideoTrailerStatus: Joi.boolean(),
});

class BackgroundVideoValidator {
    async create(req, res, next) {
        const errors = [];
        try {
            await CreateBackgroundVideoValidationSchema.validateAsync(req.body);
            next();
        } catch (error) {
            errors.push(error.message);
            return logger.status400(res, error, errors, system.error);
        }
    }
    async update(req, res, next) {
        const errors = [];
        try {
            await UpdateBackgroundVideoValidationSchema.validateAsync(req.body);
            next();
        } catch (error) {
            errors.push(error.message);
            return logger.status400(res, error, errors, system.error);
        }
    }
}

module.exports = new BackgroundVideoValidator();
