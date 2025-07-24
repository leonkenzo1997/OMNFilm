const Joi = require('joi');
const logger = require('../../Constant/Logger/loggerConstant');
const system = require('../../Constant/General/SystemConstant');
const constants = require('../../Constant/constants');

const CreateProductionSupportSampleValidationSchema = Joi.object({
	programName: Joi.string().required().allow(''),
	slugName: Joi.string().required().allow(''),
	programSummary: Joi.string().required().allow(''),
	programElement: Joi.array().required().allow(''),
	programImagePoster: Joi.string().required().allow(''),
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
	programVideoSetting: Joi.number().allow(0),
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

const UpdateProductionSupportSampleValidationSchema = Joi.object({
	_id: Joi.string().required(),
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
	programVideoSetting: Joi.number().allow(0),
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

class ProductionSupportSampleValidator {
	async create(req, res, next) {
		const errors = [];
		try {
			await CreateProductionSupportSampleValidationSchema.validateAsync(req.body);
			next();
		} catch (error) {
			errors.push(error.message);
			return logger.status400(res, error, errors, system.error);
		}
	}
	async update(req, res, next) {
		const errors = [];
		try {
			await UpdateProductionSupportSampleValidationSchema.validateAsync(req.body);
			next();
		} catch (error) {
			errors.push(error.message);
			return logger.status400(res, error, errors, system.error);
		}
	}
}

module.exports = new ProductionSupportSampleValidator();
