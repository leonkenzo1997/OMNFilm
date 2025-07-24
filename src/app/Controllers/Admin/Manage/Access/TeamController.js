const mongoose = require('mongoose');

const teamModel = require('../../../../Models/Manage/Access/TeamModel');

const system = require('../../../../Constant/General/SystemConstant');
const teamConstant = require('../../../../Constant/Team/TeamConstant');
const logger = require('../../../../Constant/Logger/loggerConstant');

class teamController {
	// [GET] /admin/manage/access/team/
	async index(request, response, next) {
		const errors = [];

		try {
			const arrayTeam = await teamModel.find({});
			const totalTeam = await teamModel.countDocuments();
			const data = {
				totalTeam,
				arrayTeam,
			};
			return logger.status200(response, system.success, '', data);
		} catch (error) {
			errors.push(error.message);
			return logger.status500(response, error, errors);
		}
	}

	// [GET] /admin/manage/access/team/:id
	async detail(request, response, next) {
		const paramsData = request.params;
		const errors = [];
		try {
			const team = await teamModel.findById({
				_id: paramsData.id,
			});
			if (!team) {
				return logger.status404(
					response,
					system.error,
					teamConstant.notFound(paramsData.id)
				);
			} else {
				return logger.status200(response, system.success, '', team);
			}
		} catch (error) {
			errors.push(error.message);
			return logger.status400(response, error, errors);
		}
	}

	// [POST] //admin/manage/access/team/create
	async create(request, response, next) {
		const formData = request.body;
		const errors = [];
		let session = await mongoose.startSession();

		try {
			session.startTransaction();
			const team = new teamModel(formData);
			const createTeam = await team.save({ session: session });
			await session.commitTransaction();
			session.endSession();
			return logger.status201(response, createTeam);
		} catch (error) {
			await session.abortTransaction();
			session.endSession();
			errors.push(error.message);
			return logger.status400(response, error, errors);
		}
	}

	// [PUT] /admin/manage/access/team/:id
	async update(request, response, next) {
		const paramsData = request.params;
		const formData = request.body;
		const errors = [];
		let session = await mongoose.startSession();

		try {
			session.startTransaction();
			const team = await teamModel.findByIdAndUpdate(
				{ _id: paramsData.id },
				formData,
				{
					new: true,
					runValidators: true,
					session: session,
				}
			);

			if (!team) {
				await session.abortTransaction();
				session.endSession();
				return logger.status404(
					response,
					system.error,
					teamConstant.notFound(paramsData.id)
				);
			}
			await session.commitTransaction();
			session.endSession();
			return logger.status200(
				response,
				system.success,
				teamConstant.msgUpdate(paramsData.id),
				formData
			);
		} catch (error) {
			await session.abortTransaction();
			session.endSession();
			errors.push(error.message);
			return logger.status400(response, error, errors);
		}
	}

	// [DELETE] /admin/manage/access/team/:id
	async destroy(request, response, next) {
		const paramsData = request.params;
		const errors = [];
		let session = await mongoose.startSession();

		try {
			session.startTransaction();
			const team = await teamModel
				.delete({
					_id: paramsData.id,
				})
				.session(session);

			if (!team.nModified) {
				await session.abortTransaction();
				session.endSession();
				return logger.status404(
					response,
					system.error,
					teamConstant.notFound(paramsData.id)
				);
			}
			await session.commitTransaction();
			session.endSession();
			return logger.status200(
				response,
				system.success,
				teamConstant.msgDelete(paramsData.id)
			);
		} catch (error) {
			await session.abortTransaction();
			session.endSession();
			errors.push(error.message);
			return logger.status500(response, error, errors);
		}
	}
}

module.exports = new teamController();
