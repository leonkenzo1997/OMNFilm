const mongoose = require('mongoose');

const deptModel = require('../../../../Models/Manage/Access/DepartmentModel');

const system = require('../../../../Constant/General/SystemConstant');
const deptConstant = require('../../../../Constant/Dept/DeptConstant');
const logger = require('../../../../Constant/Logger/loggerConstant');

class DepartmentController {
	// [GET] /admin/manage/access/dept/
	async index(request, response, next) {
		const errors = [];
		try {
			const arrayDept = await deptModel.find({});
			const totalDept = await deptModel.countDocuments();
			const data = {
				totalDept,
				arrayDept,
			};
			return logger.status200(response, system.success, '', data);
		} catch (error) {
			errors.push(error.message);
			return logger.status500(response, error, errors);
		}
	}

	// [GET] /admin/manage/access/dept/:id
	async detail(request, response, next) {
		const paramsData = request.params;
		const errors = [];
		try {
			const dept = await deptModel.findById({
				_id: paramsData.id,
			});
			if (!dept) {
				return logger.status404(
					response,
					system.error,
					deptConstant.notFound(paramsData.id)
				);
			} else {
				return logger.status200(response, system.success, '', dept);
			}
		} catch (error) {
			errors.push(error.message);
			return logger.status400(response, error, errors);
		}
	}

	// [POST] //admin/manage/access/dept/create
	async create(request, response, next) {
		const formData = request.body;
		const errors = [];
		let session = await mongoose.startSession();
		try {
			session.startTransaction();
			const dept = new deptModel(formData);
			const createDept = await dept.save({ session: session });
			await session.commitTransaction();
			session.endSession();
			return logger.status201(response, createDept);
		} catch (error) {
			await session.abortTransaction();
			session.endSession();
			errors.push(error.message);
			return logger.status400(response, error, errors);
		}
	}

	// [PUT] /admin/manage/access/dept/:id
	async update(request, response, next) {
		const paramsData = request.params;
		const formData = request.body;
		const errors = [];
		let session = await mongoose.startSession();
		try {
			session.startTransaction();
			const dept = await deptModel.findByIdAndUpdate(
				{ _id: paramsData.id },
				formData,
				{
					new: true,
					runValidators: true,
					session: session,
				}
			);

			if (!dept) {
                await session.abortTransaction();
				session.endSession();
				return logger.status404(
					response,
					system.error,
					deptConstant.notFound(paramsData.id)
				);
			}
			// await session.abortTransaction();
			await session.commitTransaction();
			session.endSession();
			return logger.status200(
				response,
				system.success,
				deptConstant.msgUpdate(paramsData.id),
				formData
			);
		} catch (error) {
			await session.abortTransaction();
			session.endSession();
			errors.push(error.message);
			return logger.status400(response, error, errors);
		}
	}

	// [DELETE] /admin/manage/access/dept/:id
	async destroy(request, response, next) {
		const paramsData = request.params;
		const errors = [];
		let session = await mongoose.startSession();

		try {
			session.startTransaction();
			const dept = await deptModel
				.delete({
					_id: paramsData.id,
				})
				.session(session);

			if (!dept.nModified) {
                await session.abortTransaction();
				session.endSession();
				return logger.status404(
					response,
					system.error,
					deptConstant.notFound(paramsData.id)
				);
			}
			await session.commitTransaction();
			session.endSession();

			return logger.status200(
				response,
				system.success,
				deptConstant.msgDelete(paramsData.id)
			);
		} catch (error) {
			await session.abortTransaction();
			session.endSession();
			errors.push(error.message);
			return logger.status500(response, error, errors);
		}
	}
}

module.exports = new DepartmentController();
