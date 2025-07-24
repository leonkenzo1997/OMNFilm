const Joi = require("joi");
const logger = require("../../Constant/Logger/loggerConstant");
const system = require("../../Constant/General/SystemConstant");

const SearchProgramValidationSchema = Joi.object({
    programName: Joi.string().required(),
    programType: Joi.string().valid("upload", "challenger").required(),
    programTitle: Joi.string().allow(""),
    programSubTitle: Joi.string().allow(""),
    programSummary: Joi.string().allow(""),
    programEpisodeSummary: Joi.string().allow(""),
    slugName: Joi.string().allow(""),
    programTypeVideo: Joi.string().valid("stand alone", "season").allow(""),
    fromAt: Joi.date().allow(""),
    toAt: Joi.date().allow(""),
    limit: Joi.string().allow(""),
    page: Joi.string().allow(""),
});

class ProgramValidator {
    async search(req, res, next) {
        const errors = [];
        try {
            await SearchProgramValidationSchema.validateAsync(req.query);
            next();
        } catch (error) {
            errors.push(error.message);
            return logger.status400(res, error, errors, system.error);
        }
    }
}
module.exports = new ProgramValidator();
