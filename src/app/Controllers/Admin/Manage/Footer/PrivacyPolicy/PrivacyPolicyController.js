const mongoose = require('mongoose');

const privacyPolicyModel = require('../../../../../Models/Manage/Footer/PrivacyPolicyModel');

const system = require('../../../../../Constant/General/SystemConstant');
const privacyPolicyConstant = require('../../../../../Constant/PrivacyPolicy/PrivacyPolicyConstant');
const logger = require('../../../../../Constant/Logger/loggerConstant');

class PrivacyPolicyController {
	// [GET] /admin/manage/footer/privacy-policy/
	async index(request, response, next) {
		const errors = [];
		try {
			const arrayPrivacyPolicy = await privacyPolicyModel.find({});
			const totalPrivacyPolicy = await privacyPolicyModel.countDocuments();
			const data = {
				totalPrivacyPolicy,
				arrayPrivacyPolicy,
			};
			return logger.status200(response, system.success, '', data);
		} catch (error) {
			errors.push(error.message);
			return logger.status500(response, error, errors);
		}
	}

	// [GET] /admin/manage/footer/privacy-policy/:id
	async detail(request, response, next) {
		const paramsData = request.params;
		const errors = [];
		try {
			const privacyPolicy = await privacyPolicyModel.findById({
				_id: paramsData.id,
			});

			if (!privacyPolicy) {
				return logger.status404(response, system.error, privacyPolicyConstant.notFound(paramsData.id));
			} else {
				return logger.status200(response, system.success, '', privacyPolicy);
			}
		} catch (error) {
			errors.push(error.message);
			return logger.status400(response, error, errors);
		}
	}

	// [POST] /admin/manage/footer/privacy-policy/create
	async create(request, response, next) {
		const formData = request.body;
		const errors = [];
		let session = await mongoose.startSession();

		try {
			session.startTransaction();
			const privacyPolicy = new privacyPolicyModel(formData);
			const createPrivacyPolicy = await privacyPolicy.save({ session: session });
			await session.commitTransaction();
			session.endSession();
			return logger.status201(response, createPrivacyPolicy);
		} catch (error) {
			await session.abortTransaction();
			session.endSession();
			errors.push(error.message);
			return logger.status400(response, error, errors, system.error);
		}
	}

	// [PUT] /admin/manage/footer/privacy-policy/:id
	async update(request, response, next) {
		const paramsData = request.params;
		const formData = request.body;
		const errors = [];
		let session = await mongoose.startSession();
		try {
			session.startTransaction();
			const privacyPolicy = await privacyPolicyModel.findByIdAndUpdate({ _id: paramsData.id }, formData, {
				new: true,
				runValidators: true,
				session: session,
			});

			if (!privacyPolicy) {
				await session.abortTransaction();
				session.endSession();
				return logger.status404(response, system.error, privacyPolicyConstant.notFound(paramsData.id));
			}
			await session.commitTransaction();
			session.endSession();
			return logger.status200(response, system.success, privacyPolicyConstant.msgUpdate(paramsData.id), formData);
		} catch (error) {
			await session.abortTransaction();
			session.endSession();
			errors.push(error.message);
			return logger.status400(response, error, errors);
		}
	}

	// [DELETE] /admin/manage/footer/privacy-policy/:id
	async destroy(request, response, next) {
		const paramsData = request.params;
		const errors = [];
		let session = await mongoose.startSession();
		try {
			session.startTransaction();
			const privacyPolicy = await privacyPolicyModel
				.delete({
					_id: paramsData.id,
				})
				.session(session);

			if (!privacyPolicy.nModified) {
				await session.abortTransaction();
				session.endSession();
				return logger.status404(response, system.error, privacyPolicyConstant.notFound(paramsData.id));
			}
			await session.commitTransaction();
			session.endSession();
			return logger.status200(response, system.success, privacyPolicyConstant.msgDelete(paramsData.id));
		} catch (error) {
			await session.abortTransaction();
			session.endSession();
			errors.push(error.message);
			return logger.status500(response, error, errors);
		}
	}
}

module.exports = new PrivacyPolicyController();
