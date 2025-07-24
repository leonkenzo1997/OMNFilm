const Joi = require('joi');
const logger = require('../../Constant/Logger/loggerConstant');
const system = require('../../Constant/General/SystemConstant');
const constants = require('../../Constant/constants');

const CreateProgramSampleValidationSchema = Joi.object({
	programType: Joi.string()
		.valid(
			constants.PROGRAM_TYPE.CHALLENGER,
			constants.PROGRAM_TYPE.UPLOAD,
			constants.PROGRAM_TYPE.SAMPLE,
			constants.PROGRAM_TYPE.PRODUCTION_SUPPORT,
			constants.PROGRAM_TYPE.SEFT_PRODUCTION
		)
		.required()
		.allow(''),
	programTitle: Joi.string().allow(''),
	programName: Joi.string().required().allow(''),
	slugName: Joi.string().required().allow(''),
	programSummary: Joi.string().required().allow(''),
	programElement: Joi.array().required().allow(''),
	programImagePoster: Joi.string().required().allow(''),
	programImagePosterNoTitle: Joi.string().required().allow(''),
	programImageTitle: Joi.string().required().allow(''),
	programImageBracter: Joi.string().required().allow(''),
	programSubTitle: Joi.string().required().allow(''),
	programCategory: Joi.any().required().allow(''),
	programParticipants: Joi.any().required().allow(''),
	programTypeVideo: Joi.string()
		.valid(constants.TYPE_VIDEO.SA, constants.TYPE_VIDEO.SP, constants.TYPE_VIDEO.SS)
		.required()
		.allow(''),
	programThumbnail: Joi.any().allow(''),
	programVideoSetting: Joi.object().allow(''),
	programEpisodeSummary: Joi.string().required().allow(''),
	programMusicInfo: Joi.array()
		.items(
			Joi.object({
				musicName: Joi.string().required().allow(''),
				musicArtist: Joi.string().required().allow(''),
			})
		)
		.min(1)
		.required()
		.allow(''),
});

const UpdateProgramSampleValidationSchema = Joi.object({
	_id: Joi.string().required(),
	programType: Joi.string()
		.valid(
			constants.PROGRAM_TYPE.CHALLENGER,
			constants.PROGRAM_TYPE.UPLOAD,
			constants.PROGRAM_TYPE.SAMPLE,
			constants.PROGRAM_TYPE.PRODUCTION_SUPPORT,
			constants.PROGRAM_TYPE.SEFT_PRODUCTION
		)
		.required(),
	programTitle: Joi.string(),
	programName: Joi.string().required(),
	slugName: Joi.string().required().allow(''),
	programSummary: Joi.string().required(),
	programElement: Joi.array().required(),
	programImagePoster: Joi.string().required(),
	programImagePosterNoTitle: Joi.string().required().allow(''),
	programImageTitle: Joi.string().required(),
	programImageBracter: Joi.string().required(),
	programSubTitle: Joi.string().required(),
	programCategory: Joi.any().required(),
	programParticipants: Joi.any().required(),
	programTypeVideo: Joi.string()
		.valid(constants.TYPE_VIDEO.SA, constants.TYPE_VIDEO.SP, constants.TYPE_VIDEO.SS)
		.required(),
	programThumbnail: Joi.any().allow(''),
	programVideoSetting: Joi.object().allow(''),
	programEpisodeSummary: Joi.string().required(),
	programMusicInfo: Joi.array()
		.items(
			Joi.object({
				musicName: Joi.string().required(),
				musicArtist: Joi.string().required(),
			})
		)
		.min(1)
		.required(),
});

class ProgramSampleValidator {
	async create(req, res, next) {
		const errors = [];
		try {
			await CreateProgramSampleValidationSchema.validateAsync(req.body);
			next();
		} catch (error) {
			errors.push(error.message);
			return logger.status400(res, error, errors, system.error);
		}
	}
	async update(req, res, next) {
		const errors = [];
		try {
			await UpdateProgramSampleValidationSchema.validateAsync(req.body);
			next();
		} catch (error) {
			errors.push(error.message);
			return logger.status400(res, error, errors, system.error);
		}
	}
}

module.exports = new ProgramSampleValidator();
