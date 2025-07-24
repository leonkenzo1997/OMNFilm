const adminModel = require('../../../Models/User/UserModel');
const system = require('../../../Constant/General/SystemConstant');
const constantAdmin = require('../../../Constant/Admin/AdminConstant');
const logger = require('../../../Constant/Logger/loggerConstant');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const constants = require('../../../Constant/constants');
class AdminController {
	// [GET] /admin/
	async index(request, response, next) {
		const errors = [];
		try {
			const adminArray = await adminModel.find({}).sortable(request);
			const adminTotal = await adminModel.countDocuments();
			const data = {
				adminTotal,
				adminArray,
			};
			return logger.status200(response, system.success, '', data);
		} catch (error) {
			errors.push(error.message);
			return logger.status500(response, error, errors, system.error);
		}
	}

	// [GET] /admin/me
	async profile(request, response, next) {
		const admin = request.user;
		return logger.status200(response, system.success, '', admin);
	}

	// [POST] /admin/register
	async register(request, response, next) {
		const formData = request.body;
		const errors = [];
		formData['userType'] = 1;
		let session = await mongoose.startSession();
		session.startTransaction();
		try {
			const admin = new adminModel(formData);
			const createAdmin = await admin.save({ session: session });
			const token = await admin.generateAuthenticationToken(session, formData);

			await session.commitTransaction();
			session.endSession();

			let temporary = createAdmin.toJSON();
			const data = Object.assign(temporary, { token });
			return response.status(201).json({
				status: system.success,
				msg: system.registerAdmin,
				data: data,
			});
		} catch (error) {
			await session.abortTransaction();
			session.endSession();
			errors.push(error.message);
			return logger.status400(response, error, errors, system.error);
		}
	}

	// [POST] /admin/login
	async login(request, response, next) {
		const formData = request.body;
		const errors = [];
		let session = await mongoose.startSession();
		session.startTransaction();

		try {
			// call function findByCredentials in admin model to check email and password
			const admin = await adminModel.findByCredentials(
				{ userEmail: formData.userEmail },
				{ userPassword: formData.userPassword },
				{ errors: errors }
			);

			if (!admin.data) {
				session.endSession();
				return logger.status200(response, system.error, admin.errors);
			}

			if (!admin.password) {
				session.endSession();
				return logger.status200(response, system.error, admin.errors);
			}

			if (![constants.USER_TYPE.SUPPERADMIN, constants.USER_TYPE.ADMIN].includes(admin.data.userType)) {
				return logger.status403(response, system.permission);
			}

			const token = await admin.data.generateAuthenticationToken(session, formData);
			await session.commitTransaction();
			session.endSession();
			let temporary = admin.data.toJSON();
			let data = Object.assign(temporary, { token });
			let userDepartment = [];
			data.userDeparment.forEach((it) => {
				userDepartment.push(it.departmentCode);
			});
			delete data.userDeparment;
			data.userDepartment = userDepartment;
			return logger.status200(response, system.success, system.login, data);
		} catch (error) {
			await session.abortTransaction();
			session.endSession();
			errors.push(error.message);
			return logger.status400(response, error, errors, system.error);
		}
	}

	// [POST] /admin/logout
	async logout(request, response, next) {
		const errors = [];
		const admin = request.user;
		const tokenLogout = request.token;
		let session = await mongoose.startSession();
		session.startTransaction();

		try {
			// purpose: create new adminToken array to contain tokens still login
			admin.userToken = admin.userToken.filter((token) => {
				// check token want logout if return true, the value will be added in new adminTokens array
				// otherwise it will be removed.
				return token.token !== tokenLogout;
			});
			await admin.save({ session: session });
			await session.commitTransaction();
			session.endSession();
			return logger.status200(response, system.success, system.logout);
		} catch (error) {
			await session.abortTransaction();
			session.endSession();
			errors.push(error.message);
			return logger.status500(response, error, errors, system.error);
		}
	}

	// [POST] /admin/logout
	async logoutAll(request, response, next) {
		const admin = request.user;
		const errors = [];
		let session = await mongoose.startSession();
		session.startTransaction();

		try {
			admin.adminToken = [];
			await admin.save({ session: session });
			await session.commitTransaction();
			session.endSession();
			return logger.status200(response, system.success, system.logoutAll);
		} catch (error) {
			await session.abortTransaction();
			session.endSession();
			errors.push(error.message);
			return logger.status500(response, error, errors, system.error);
		}
	}

	// [PUT] /admin/:id
	async update(request, response, next) {
		const paramsData = request.params;
		const formData = request.body;
		const admin = request.user;
		const errors = [];

		// get key in array formData
		const updates = request.keyData;
		let session = await mongoose.startSession();
		session.startTransaction();

		try {
			// loop each key in array of formData and assign
			updates.forEach((update) => {
				// admin[update]: is old data
				// formData[update]: new data
				// change old data by assigning new data
				return (admin[update] = formData[update]);
			});

			const dataAdmin = await admin.save({ session: session });
			await session.commitTransaction();
			session.endSession();

			return logger.status200(response, system.success, constantAdmin.msgUpdateAdmin(admin._id), dataAdmin);
		} catch (error) {
			await session.abortTransaction();
			session.endSession();
			errors.push(error.message);
			return logger.status400(response, error, errors, system.error);
		}
	}

	// [DELETE] /admin/me
	async destroy(request, response, next) {
		const paramsData = request.params;
		const admin = request.user;
		const errors = [];
		let session = await mongoose.startSession();
		session.startTransaction();

		try {
			const adminDelete = await adminModel.delete({ _id: admin._id }).session(session);

			if (!adminDelete) {
				return logger.status404(response, system.error, system.notFound(admin._id));
			}
			await session.commitTransaction();
			session.endSession();
			return logger.status200(response, system.success, constantAdmin.msgDeleteAdmin(admin._id));
		} catch (error) {
			await session.abortTransaction();
			session.endSession();
			errors.push(error.message);
			return logger.status400(response, error, errors, system.error);
		}
	}

	// [POST] /admin/confirm-password
	async confirmPassword(request, response, next) {
		const admin = request.user;
		const errors = [];
		const formData = request.body;

		try {
			const result = {
				data: admin,
				isPassword: false,
			};

			const isMatch = await bcrypt.compare(formData.userPassword, admin.userPassword);
			result.password = isMatch;

			if (!isMatch) {
				errors.push(
					'Email or Password is wrong. Unable to login. Please enter email and password again!!!'
				);
				return logger.status400(response, '', errors, system.error);
			}

			return logger.status200(response, system.success, system.confirmPassword, result);
		} catch (error) {
			errors.push(error.message);
			return logger.status400(response, error, errors, system.error);
		}
	}
}

module.exports = new AdminController();
