const logger = require('../../../Constant/Logger/loggerConstant');
const constants = require('../../../Constant/constants');
const system = require('../../../Constant/General/SystemConstant');
const programSampleModel = require('../../../Models/ProgrameSample/ProgramSampleModel');
const mongoose = require('mongoose');
const programModel = require('../../../Models/Program/ProgramModel');

const programSampleConstant = require('../../../Constant/ProgramSample/ProgramSampleConstant');
class ProgramSampleController {
	async create(request, response) {
		const errors = [];
		let session = await mongoose.startSession();
		session.startTransaction();
		try {
			let checkLength = await programSampleModel.find({
				$or: [
					{
						programType: 'challenger',
					},
					{
						programType: 'upload',
					},
					{
						programType: 'self production',
					},
					{
						programType: 'sample',
					},
				],
			});
			if (checkLength.length > 6) {
				errors.push(programSampleConstant.limitCreateProgramSample);
				await session.abortTransaction();
				session.endSession();
				return logger.status400(response, programSampleConstant.limitCreateProgramSample, errors);
			}
			let programSampleData = new programSampleModel(request.body);
			await programSampleData.save({ session: session });

			await session.commitTransaction();
			session.endSession();
			return logger.status200(response, system.success, '', programSampleData);
		} catch (error) {
			errors.push(error.message);
			await session.abortTransaction();
			session.endSession();
			return logger.status400(response, error, errors);
		}
	}

	async getById(request, response) {
		const errors = [];
		try {
			let programSampleData = await programSampleModel
				.findById(request.params.id)
				.populate([
					{
						path: 'programCategory.categoryArrayTag',
						select: 'tagName',
					},
					{
						path: 'programCategory.categoryManageId',
						select: 'categoryMangeName',
					},
				]);
			return logger.status200(response, system.success, '', programSampleData);
		} catch (error) {
			errors.push(error.message);
			return logger.status400(response, error, errors);
		}
	}

	async update(request, response) {
		const errors = [];
		let session = await mongoose.startSession();
		session.startTransaction();
		try {
			let programSampleData = await programSampleModel.findByIdAndUpdate(
				request.body._id,
				{ $set: request.body },
				{
					new: true,
					upsert: true,
					session: session,
				}
			);
			await session.commitTransaction();
			session.endSession();
			return logger.status200(response, system.success, '', programSampleData);
		} catch (error) {
			errors.push(error.message);
			await session.abortTransaction();
			session.endSession();
			return logger.status400(response, error, errors);
		}
	}

	async find(request, response) {
		const errors = [];
		try {
			const { limit, page } = request.query;

			let limitDoc = parseInt(limit) || 10;
			let pageDoc = parseInt(page) || 1;

			let programSampleData = await programSampleModel.paginate(
				{
					programSeasonChild: false,
					$or: [
						{
							programType: 'challenger',
						},
						{
							programType: 'upload',
						},
						{
							programType: 'self production',
						},
						{
							programType: 'sample',
						},
					],
				},
				{
					limit: limitDoc,
					page: pageDoc,
					populate: [
						{
							path: 'programCategory.categoryArrayTag',
							select: 'tagName',
						},
						{
							path: 'programCategory.categoryManageId',
							select: 'categoryMangeName',
						},
					],
				}
			);

			return logger.status200(response, system.success, '', programSampleData);
		} catch (error) {
			errors.push(error.message);
			return logger.status400(response, error, errors);
		}
	}

	async search(request, response, next) {
		let errors = [];
		try {
			const {
				limit,
				page,
				programName,
				programType,
				programTitle,
				programSubTitle,
				programSummary,
				programEpisodeSummary,
				slugName,
				programTypeVideo,
				programTypeEpisode,
				fromAt,
				toAt,
			} = request.query;

			let limitDoc = parseInt(limit) || 10;
			let pageDoc = parseInt(page) || 1;

			let filters = [
				{
					programCurrentStatus: {
						$in: ['approval', 'omn', 'instant'],
					},
					programTypeVideo: {
						$in: [constants.TYPE_VIDEO.SA],
					},
				},
			];
			if (programName) {
				filters.push({
					programName: {
						$regex: programName,
						$options: 'i',
					},
				});
			}

			if (programType) {
				filters.push({
					programType: programType,
				});
			}

			if (programTitle) {
				filters.push({
					programTitle: {
						$regex: programTitle,
						$options: 'i',
					},
				});
			}

			if (programSubTitle) {
				filters.push({
					programSubTitle: {
						$regex: programSubTitle,
						$options: 'i',
					},
				});
			}

			if (programSummary) {
				filters.push({
					programSummary: {
						$regex: programSummary,
						$options: 'i',
					},
				});
			}

			if (programEpisodeSummary) {
				filters.push({
					programEpisodeSummary: {
						$regex: programEpisodeSummary,
						$options: 'i',
					},
				});
			}

			if (slugName) {
				filters.push({
					slugName: {
						$regex: slugName,
						$options: 'i',
					},
				});
			}

			if (programTypeEpisode) {
				filters.push({
					programTypeEpisode: programTypeEpisode,
				});
			}

			if (fromAt) {
				filters.push({
					createdAt: { $gte: new Date(fromAt) },
				});
			}

			if (toAt) {
				filters.push({
					createdAt: { $lte: new Date(toAt) },
				});
			}

			let data = await programModel.paginate(
				{ $and: filters },
				{
					limit: limitDoc,
					page: pageDoc,
					populate: [
						{
							path: 'programCategory.categoryArrayTag',
							select: 'tagName',
						},
						{
							path: 'programCategory.categoryManageId',
							select: 'categoryMangeName',
						},
					],
				}
			);
			return logger.status200(response, system.success, '', data);
		} catch (error) {
			errors.push(error.message);
			return logger.status500(response, error, errors, system.error);
		}
	}
}

module.exports = new ProgramSampleController();
