const mongoose = require('mongoose');
const tagModel = require('../../../../Models/Manage/Tag/TagModel');

const system = require('../../../../Constant/General/SystemConstant');
const logger = require('../../../../Constant/Logger/loggerConstant');

const tagConstant = require('../../../../Constant/Tag/TagConstant');

class TagController {
	// [GET] /admin/manage/category-manage/
	async index(request, response, next) {
		const errors = [];
		try {
			const arrayTag = await tagModel.find({});
			const totalTag = await tagModel.countDocuments();
			const data = {
				totalTag,
				arrayTag,
			};
			return logger.status200(response, system.success, '', data);
		} catch (error) {
			errors.push(error.message);
			return logger.status500(response, error, errors);
		}
	}

	// [POST] /admin/manage/category-manage/create
	async create(request, response, next) {
		const formData = request.body;
		const errors = [];
		let session = await mongoose.startSession();

		try {
			session.startTransaction();
			const tagData = new tagModel(formData);
			const createTagData = await tagData.save({ session: session });
			if (!tagData) {
				await session.abortTransaction();
				session.endSession();
				return logger.status200(response, system.error, tagConstant.errorCreate);
			}
			await session.commitTransaction();
			session.endSession();
			return logger.status201(response, createTagData);
		} catch (error) {
			await session.abortTransaction();
			session.endSession();
			errors.push(error.message);
			return logger.status400(response, error, errors);
		}
	}

	// [GET] /admin/manage/category-manage/:id
	async detail(request, response, next) {
		const paramsData = request.params;
		const errors = [];
		try {
			const category = await tagModel.findById({
				_id: paramsData.id,
			});
			if (!category) {
				return logger.status404(response, system.error, tagConstant.notFound(paramsData.id));
			} else {
				return logger.status200(response, system.success, '', category);
			}
		} catch (error) {
			errors.push(error.message);
			return logger.status400(response, error, errors);
		}
	}

	// [PUT] /admin/manage/category-manage/:id
	async update(request, response, next) {
		const paramsData = request.params;
		const formData = request.body;
		const errors = [];
		let session = await mongoose.startSession();
		try {
			session.startTransaction();
			const tag = await tagModel.findByIdAndUpdate({ _id: paramsData.id }, formData, {
				new: true,
				runValidators: true,
				session: session,
			});

			if (!tag) {
				await session.abortTransaction();
				session.endSession();
				return logger.status404(response, system.error, tagConstant.notFound(paramsData.id));
			}
			await session.commitTransaction();
			session.endSession();
			return logger.status200(response, system.success, tagConstant.msgUpdate(paramsData.id), tag);
		} catch (error) {
			await session.abortTransaction();
			session.endSession();
			errors.push(error.message);
			return logger.status400(response, error, errors);
		}
	}

	// [DELETE] /admin/manage/category-manage/:id/
	async destroy(request, response, next) {
		const paramsData = request.params;
		const errors = [];
		let session = await mongoose.startSession();
		try {
			session.startTransaction();
			const tag = await tagModel
				.delete({
					_id: paramsData.id,
				})
				.session(session);

			if (!tag.nModified) {
				await session.abortTransaction();
				session.endSession();
				return logger.status404(response, system.error, tagConstant.notFound(paramsData.id));
			}
			await session.commitTransaction();
			session.endSession();
			return logger.status200(response, system.success, tagConstant.msgDelete(paramsData.id));
		} catch (error) {
			await session.abortTransaction();
			session.endSession();
			errors.push(error.message);
			return logger.status500(response, error, errors);
		}
	}
}

module.exports = new TagController();
