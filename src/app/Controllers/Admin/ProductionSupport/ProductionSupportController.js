const mongoose = require('mongoose');
const programModel = mongoose.model('ProgramSchema');
const userModel = mongoose.model('UserSchema');

const system = require('../../../Constant/General/SystemConstant');
const logger = require('../../../Constant/Logger/loggerConstant');
const challengerConstant = require('../../../Constant/Challenger/ChallengerConstant');
const constants = require('../../../Constant/constants')
const businessQuery = require('../../../Business/QueryModel');

class ProductionSupportController {
	// [GET] /admin/production-support/
	async index(request, response, next) {
		const errors = [];
		try {
			const { id, category } = request.query

			request.query.programType = constants.PROGRAM_TYPE.PRODUCTION_SUPPORT
			if (category) {
				request.query['programCategory.categoryManageId'] = mongoose.Types.ObjectId(category)
			}

			if (id) {
				const userEmail = new RegExp(id, 'i')
				const users = await userModel.distinct('_id', { userEmail })
				if (users && users.length) {
					request.query.userID = {
						$in: users
					}
				}
			}

			delete request.query.category
			delete request.query.id

			const arrayChallenger = await businessQuery.handle(programModel, request, 'userID');
			return logger.status200(response, system.success, '', arrayChallenger);
		} catch (error) {
			errors.push(error.message);
			return logger.status500(response, error, errors);
		}
	}

	// [POST] /admin/production-support/create
	async create(request, response, next) {
		const formData = request.body;
		const userData = request.user;
		const errors = [];
		try {
			let session = await mongoose.startSession();
			session.startTransaction();

			formData.programType = constants.PROGRAM_TYPE.PRODUCTION_SUPPORT;
			formData.programCurrentStatus = constants.PROGRAM_STATUS.UPLOAD;
			formData.userID = userData._id;

			const data = new programModel(formData);
			await data.save({ session: session });

			await session.commitTransaction();
			session.endSession();
			return logger.status201(response, data);
		} catch (error) {
			await session.abortTransaction();
			session.endSession();
			errors.push(error.message);
			return logger.status400(response, error, errors);
		}
	}

	// [GET] /admin/production-support/:id
	async detail(request, response, next) {
		const paramsData = request.params;
		const errors = [];
		try {
			const program = await programModel.findById({
				_id: paramsData.id,
			});
			if (!program) {
				return logger.status404(
					response,
					system.error,
					challengerConstant.notFound(paramsData.id)
				);
			} else {
				return logger.status200(response, system.success, '', program);
			}
		} catch (error) {
			errors.push(error.message);
			return logger.status400(response, error, errors);
		}
	}

	// [PUT] /admin/production-support/:id
	async update(request, response, next) {
		const paramsData = request.params;
		const formData = request.body;
		const errors = [];

		try {
			let session = await mongoose.startSession();
			session.startTransaction();

			const program = await programModel.findById(paramsData.id);
			if (!program) {
				await session.abortTransaction();
				session.endSession();
				return logger.status404(
					response,
					system.error,
					challengerConstant.notFound(paramsData.id)
				);
			}
			const update = await programModel.findByIdAndUpdate(
                { _id: paramsData.id },
                formData,
                { new: true, runValidators: true, session: session }
			);
			
			await session.commitTransaction();
			session.endSession();
			return logger.status200(
				response,
				system.success,
				challengerConstant.msgUpdate(paramsData.id),
				update
			);
		} catch (error) {
			await session.abortTransaction();
			session.endSession();
			errors.push(error.message);
			return logger.status400(response, error, errors);
		}
	}

	// [GET] /admin/production-support/status
	async status(request, response, next) {
		const errors = [];
		try {
			const createdAt = {
				$gte: new Date(request.query.date + ' 00:00:00').toUTCString(),
				$lte: new Date(request.query.date + ' 23:59:59').toUTCString()
			}
			const arrStatus = Object.values(constants.PROGRAM_STATUS)
			const result = await Promise.all(
				[...arrStatus, 'total'].map(async status => {
					const currentStatus = status
					if (status === 'total') status = /.*/
					return {
						[currentStatus]: await programModel.countDocuments({
							programType: constants.PROGRAM_TYPE.PRODUCTION_SUPPORT,
							programCurrentStatus: status,
							createdAt
						})
					}
				})
			)

			const data = Object.assign(...result)
			return logger.status200(response, system.success, '', data);
		} catch (error) {
			errors.push(error.message);
			return logger.status500(response, error, errors);
		}
	}
}

module.exports = new ProductionSupportController();
