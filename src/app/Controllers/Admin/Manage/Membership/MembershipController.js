const mongoose = require('mongoose');
const membershipModel = require('../../../../Models/Manage/Membership/MembershipModel');

const system = require('../../../../Constant/General/SystemConstant');
const membershipConstant = require('../../../../Constant/Membership/MembershipConstant');
const logger = require('../../../../Constant/Logger/loggerConstant');

class membershipController {
	// [GET] /admin/membership/
	async index(request, response, next) {
		const errors = [];

		try {
			const arrayMembership = await membershipModel.find({});
			const totalMembership = await membershipModel.countDocuments();
			const data = {
				totalMembership,
				arrayMembership,
			};
			return logger.status200(response, system.success, '', data);
		} catch (error) {
			errors.push(error.message);
			return logger.status500(response, error, errors);
		}
	}

	// [GET] /admin/membership/:id
	async detail(request, response, next) {
		const paramsData = request.params;
		const errors = [];
		try {
			const membership = await membershipModel.findById({
				_id: paramsData.id,
			});
			if (!membership) {
				return logger.status404(response, system.error, membershipConstant.notFound(paramsData.id));
			} else {
				return logger.status200(response, system.success, '', membership);
			}
		} catch (error) {
			errors.push(error.message);
			return logger.status400(response, error, errors);
		}
	}

	// [POST] /admin/membership/create
	async create(request, response, next) {
		const formData = request.body;
		const errors = [];
		let session = await mongoose.startSession();

		try {
			session.startTransaction();
			const membership = new membershipModel(formData);
			const createMembership = await membership.save({ session: session });
			await session.commitTransaction();
			session.endSession();
			return logger.status201(response, createMembership);
		} catch (error) {
			await session.abortTransaction();
			session.endSession();
			errors.push(error.message);
			return logger.status400(response, error, errors, system.error);
		}
	}

	// [PUT] /admin/membership/:id
	async update(request, response, next) {
		const paramsData = request.params;
		const formData = request.body;
		const errors = [];
		let session = await mongoose.startSession();
		try {
			session.startTransaction();
			const membership = await membershipModel.findByIdAndUpdate({ _id: paramsData.id }, formData, {
				new: true,
				runValidators: true,
				session: session,
			});

			if (!membership) {
				await session.abortTransaction();
				session.endSession();
				return logger.status404(response, system.error, membershipConstant.notFound(paramsData.id));
			}
			await session.commitTransaction();
			session.endSession();
			return logger.status200(response, system.success, membershipConstant.msgUpdate(paramsData.id), formData);
		} catch (error) {
			await session.abortTransaction();
			session.endSession();
			errors.push(error.message);
			return logger.status400(response, error, errors);
		}
	}
}

module.exports = new membershipController();
