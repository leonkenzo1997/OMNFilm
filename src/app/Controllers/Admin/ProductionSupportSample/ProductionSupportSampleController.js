const logger = require('../../../Constant/Logger/loggerConstant');
const constants = require('../../../Constant/constants');
const system = require('../../../Constant/General/SystemConstant');
const programSampleModel = require('../../../Models/ProgrameSample/ProgramSampleModel');
const mongoose = require('mongoose');

const productSupportSample = require('../../../Constant/ProductSupportSample/ProductSupportSampleConstant');
class ProductionSupportSample {
	async create(request, response) {
		const errors = [];
		try {
			const checkLength = await programSampleModel.find({
				programType: constants.PROGRAM_TYPE.PRODUCTION_SUPPORT_SAMPLE,
			});
			if (checkLength.length > 6) {
				errors.push(productSupportSample.limitProductSupportSample);
				return logger.status400(response, productSupportSample.limitProductSupportSample, errors);
			}
			const productionSupportSampleData = new programSampleModel(
				Object.assign({ programType: constants.PROGRAM_TYPE.PRODUCTION_SUPPORT_SAMPLE }, request.body)
			);
			await productionSupportSampleData.save();
			return logger.status200(response, system.success, '', productionSupportSampleData);
		} catch (error) {
			errors.push(error.message);
			return logger.status400(response, error, errors);
		}
	}

	async getById(request, response) {
		const errors = [];
		try {
			const programSampleData = await programSampleModel
				.findOne({
					$and: [
						{ _id: request.params.id },
						{
							programType: constants.PROGRAM_TYPE.PRODUCTION_SUPPORT_SAMPLE,
						},
					],
				})
				.populate([
					{
						path: 'programCategory.categoryArrayTag',
						select: 'tagName',
					},
					{
						path: 'programCategory.categoryManageId',
						select: 'categoryMangeName',
					},
					{
						path: 'userID',
						select: [
							'userEmail',
							'userName',
							'userType',
							'userGender',
							'userDOB'
						]
					}
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
			const programSampleData = await programSampleModel.findByIdAndUpdate(
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

			const limitDoc = parseInt(limit) || 10;
			const pageDoc = parseInt(page) || 1;

			const programSampleData = await programSampleModel.paginate(
				{
					programType: constants.PROGRAM_TYPE.PRODUCTION_SUPPORT_SAMPLE,
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
						{
							path: 'userID',
							select: [
								'userEmail',
								'userName',
								'userType',
								'userGender',
								'userDOB'
							]
						}
					],
				}
			);

			return logger.status200(response, system.success, '', programSampleData);
		} catch (error) {
			errors.push(error.message);
			return logger.status400(response, error, errors);
		}
	}
}

module.exports = new ProductionSupportSample();
