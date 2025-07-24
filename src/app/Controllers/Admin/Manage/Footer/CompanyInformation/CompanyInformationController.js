const mongoose = require('mongoose');

const companyInforModel = require('../../../../../Models/Manage/Footer/CompanyInformationModel');

const system = require('../../../../../Constant/General/SystemConstant');
const companyInforConstant = require('../../../../../Constant/CompanyInformation/CompanyInforConstant');
const logger = require('../../../../../Constant/Logger/loggerConstant');

class CompanyInforController {
	// [GET] /admin/manage/footer/company-information/
	async index(request, response, next) {
		const errors = [];
		try {
			const arrayCompanyInfor = await companyInforModel.find({});
			const totalCompanyInfor = await companyInformationModel.countDocuments();
			const data = {
				totalCompanyInfor,
				arrayCompanyInfor,
			};
			return logger.status200(response, system.success, '', data);
		} catch (error) {
			errors.push(error.message);
			return logger.status500(response, error, errors);
		}
	}

	// [GET] /admin/manage/footer/company-information/:id
	async detail(request, response, next) {
		const paramsData = request.params;
		const errors = [];
		try {
			const companyInfor = await companyInforModel.findById({
				_id: paramsData.id,
			});

			if (!companyInfor) {
				return logger.status404(response, system.error, companyInforConstant.notFound(paramsData.id));
			} else {
				return logger.status200(response, system.success, '', companyInfor);
			}
		} catch (error) {
			errors.push(error.message);
			return logger.status400(response, error, errors);
		}
	}

	// [POST] /admin/manage/footer/company-information/create
	async create(request, response, next) {
		const formData = request.body;
		const errors = [];
		let session = await mongoose.startSession();

		try {
			session.startTransaction();
			const companyInfor = new companyInforModel(formData);
			const createCompanyInfor = await companyInfor.save({ session: session });
			await session.commitTransaction();
			session.endSession();
			return logger.status201(response, createCompanyInfor);
		} catch (error) {
			await session.abortTransaction();
			session.endSession();
			errors.push(error.message);
			return logger.status400(response, error, errors);
		}
	}

	// [PUT] /admin/manage/footer/company-information/:id
	async update(request, response, next) {
		const paramsData = request.params;
		const formData = request.body;
		const errors = [];
		let session = await mongoose.startSession();
		try {
			session.startTransaction();
			const companyInfor = await companyInforModel.findByIdAndUpdate({ _id: paramsData.id }, formData, {
				new: true,
				runValidators: true,
				session: session,
			});

			if (!companyInfor) {
				await session.abortTransaction();
				session.endSession();
				return logger.status404(response, system.error, companyInforConstant.notFound(paramsData.id));
			}
			await session.commitTransaction();
			session.endSession();
			return logger.status200(
				response,
				system.success,
				companyInforConstant.msgUpdate(paramsData.id),
				companyInfor
			);
		} catch (error) {
			await session.abortTransaction();
			session.endSession();
			errors.push(error.message);
			return logger.status400(response, error, errors);
		}
	}

	// [DELETE] /admin/manage/footer/company-information/:id
	async destroy(request, response, next) {
		const paramsData = request.params;
		const errors = [];
		let session = await mongoose.startSession();
		try {
			session.startTransaction();
			const companyInfor = await companyInforModel
				.delete({
					_id: paramsData.id,
				})
				.session(session);

			if (!companyInfor.nModified) {
				await session.abortTransaction();
				session.endSession();
				return logger.status404(response, system.error, companyInforConstant.notFound(paramsData.id));
			}
			await session.commitTransaction();
			session.endSession();
			return logger.status200Msg(response, system.success, companyInforConstant.msgDelete(paramsData.id));
		} catch (error) {
			await session.abortTransaction();
			session.endSession();
			errors.push(error.message);
			return logger.status500(response, error, errors);
		}
	}
}

module.exports = new CompanyInforController();
