const mongoose = require('mongoose');
const employeeModel = require('../../../../Models/Manage/Access/EmployeeModel');

const system = require('../../../../Constant/General/SystemConstant');
const employeeConstant = require('../../../../Constant/Employee/EmployeeConstant');
const logger = require('../../../../Constant/Logger/loggerConstant');

class employeeController {
	// [GET] /admin/manage/access/employee/
	async index(request, response, next) {
		const errors = [];

		try {
			const arrayEmployee = await employeeModel.find({});
			const totalEmployee = await employeeModel.countDocuments();
			const data = {
				totalEmployee,
				arrayEmployee,
			};
			return logger.status200(response, system.success, '', data);
		} catch (error) {
			errors.push(error.message);
			return logger.status500(response, error, errors);
		}
	}

	// [GET] /admin/manage/access/employee/:id
	async detail(request, response, next) {
		const paramsData = request.params;
		const errors = [];
		try {
			const employee = await employeeModel.findById({
				_id: paramsData.id,
			});
			if (!employee) {
				return logger.status404(
					response,
					system.error,
					employeeConstant.notFound(paramsData.id)
				);
			} else {
				return logger.status200(response, system.success, '', employee);
			}
		} catch (error) {
			errors.push(error.message);
			return logger.status400(response, error, errors);
		}
	}

	// [POST] //admin/manage/access/employee/create
	async create(request, response, next) {
		const formData = request.body;
		const errors = [];
		let session = await mongoose.startSession();

		try {
			session.startTransaction();
			const employee = new employeeModel(formData);
			const createEmployee = await employee.save({
				session: session,
			});
			await session.commitTransaction();
			session.endSession();
			return logger.status201(response, createEmployee);
		} catch (error) {
			await session.abortTransaction();
			session.endSession();
			errors.push(error.message);
			return logger.status400(response, error, errors);
		}
	}

	// [PUT] /admin/manage/access/employee/:id
	async update(request, response, next) {
		const paramsData = request.params;
		const formData = request.body;
		const errors = [];
		let session = await mongoose.startSession();
		try {
			session.startTransaction();
			const employee = await employeeModel.findByIdAndUpdate(
				{ _id: paramsData.id },
				formData,
				{
					new: true,
					runValidators: true,
					session: session,
				}
			);

			if (!employee) {
				await session.abortTransaction();
				session.endSession();
				return logger.status404(
					response,
					system.error,
					employeeConstant.notFound(paramsData.id)
				);
			}
			await session.commitTransaction();
			session.endSession();
			return logger.status200(
				response,
				system.success,
				employeeConstant.msgUpdate(paramsData.id),
				formData
			);
		} catch (error) {
			await session.abortTransaction();
			session.endSession();
			errors.push(error.message);
			return logger.status400(response, error, errors);
		}
	}

	// [DELETE] /admin/manage/access/employee/:id
	async destroy(request, response, next) {
		const paramsData = request.params;
		const errors = [];
		let session = await mongoose.startSession();
		try {
			session.startTransaction();
			const employee = await employeeModel
				.delete({
					_id: paramsData.id,
				})
				.session(session);

			if (!employee.nModified) {
				await session.abortTransaction();
				session.endSession();
				return logger.status404(
					response,
					system.error,
					employeeConstant.notFound(paramsData.id)
				);
			}
			await session.commitTransaction();
			session.endSession();
			return logger.status200(
				response,
				system.success,
				employeeConstant.msgDelete(paramsData.id)
			);
		} catch (error) {
			await session.abortTransaction();
			session.endSession();
			errors.push(error.message);
			return logger.status500(response, error, errors);
		}
	}
}

module.exports = new employeeController();
