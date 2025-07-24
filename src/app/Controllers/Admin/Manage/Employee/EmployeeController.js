const mongoose = require('mongoose');
const userModel = mongoose.model('UserSchema');

const system = require('../../../../Constant/General/SystemConstant');
const logger = require('../../../../Constant/Logger/loggerConstant');

const employeeConstant = require('../../../../Constant/Employee/EmployeeConstant');
const constants = require('../../../../Constant/constants');
const userConstant = require('../../../../Constant/User/UserConstant');
const businessQuery = require('../../../../Business/QueryModel');
class EmployeeController {
	// [GET] /admin/manage/employee/
	async index(request, response, next) {
		const errors = [];
		try {
			request.query['userType'] = constants.USER_TYPE.EMPLOYEE;
			const data = await businessQuery.handle(userModel, request);
			return logger.status200(response, system.success, '', data);
		} catch (error) {
			errors.push(error.message);
			return logger.status500(response, error, errors);
		}
	}

	// [POST] /admin/manage/employee/create
	async create(request, response, next) {
		const formData = request.body;
		const errors = [];
		let session = await mongoose.startSession();

		try {
			session.startTransaction();
			const userPhoneNumber = {
				areaCode: formData.areaCode,
				phoneNumber: formData.phoneNumber,
			};
			formData.userPhoneNumber = userPhoneNumber;
			formData.userType = constants.USER_TYPE.EMPLOYEE;

			const employeeData = new userModel(formData);
			await employeeData.save({ session: session });
			if (!employeeData) {
				await session.abortTransaction();
				session.endSession();
				return logger.status200(
					response,
					system.error,
					employeeConstant.errorCreate
				);
			}
			await session.commitTransaction();
			session.endSession();
			return logger.status201(response, employeeData);
		} catch (error) {
			await session.abortTransaction();
			session.endSession();
			errors.push(error.message);
			return logger.status400(response, error, errors);
		}
	}

	// [GET] /admin/manage/employee/:id
	async detail(request, response, next) {
		const paramsData = request.params;
		const errors = [];
		try {
			const employee = await userModel.findById({
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

	// [PUT] /admin/manage/employee/:id
	async update(request, response, next) {
		const paramsData = request.params;
		const formData = request.body;
		const errors = [];
		let session = await mongoose.startSession();
		try {
			session.startTransaction();
			const userPhoneNumber = {
				areaCode: formData.areaCode,
				phoneNumber: formData.phoneNumber,
			};

			if (formData.areaCode && formData.phoneNumber) {
				formData.userPhoneNumber = userPhoneNumber;
			}

			const employee = await userModel.findById(paramsData.id);
			if (!employee) {
				await session.abortTransaction();
				session.endSession();
				return logger.status404(
					response,
					system.error,
					employeeConstant.notFound(paramsData.id)
				);
			}

			const checkDuplicatePhone = await userModel.findOne({
				userPhoneNumber,
			});

			if (checkDuplicatePhone && checkDuplicatePhone.id !== employee.id) {
				session.endSession();
				return logger.status404(
					response,
					system.error,
					userConstant.existPhoneNumber,
					userPhoneNumber
				);
			}

			const update = await userModel.findByIdAndUpdate(
				{ _id: paramsData.id },
				formData,
				{ new: true, runValidators: true, session: session }
			);

			if (!update) {
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
				update
			);
		} catch (error) {
			await session.abortTransaction();
			session.endSession();
			errors.push(error.message);
			return logger.status400(response, error, errors);
		}
	}
}

module.exports = new EmployeeController();
