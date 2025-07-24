const mongoose = require('mongoose');
const categoryManageModel = require('../../../../Models/Manage/CategoryManage/CategoryManageModel');

const system = require('../../../../Constant/General/SystemConstant');
const logger = require('../../../../Constant/Logger/loggerConstant');

const categoryManageConstant = require('../../../../Constant/CategoryManage/CategoryManageConstant');

class CategoryManageController {
	// [GET] /admin/manage/category-manage/
	async index(request, response, next) {
		const errors = [];
		try {
			const arrayCategoryManage = await categoryManageModel.find({});
			const totalCategoryManage = await categoryManageModel.countDocuments();
			const data = {
				totalCategoryManage,
				arrayCategoryManage,
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
			const categoryManageData = new categoryManageModel(formData);
			const createCategoryManageData = await categoryManageData.save({
				session: session,
			});
			if (!categoryManageData) {
				session.endSession();
				return logger.status200(
					response,
					system.error,
					categoryManageConstant.errorCreate
				);
			}
			await session.commitTransaction();
			session.endSession();
			return logger.status201(response, createCategoryManageData);
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
			const category = await categoryManageModel
				.findById({
					_id: paramsData.id,
				})
				.populate({
					path: 'categoryMangeArrayTag',
				});
			if (!category) {
				return logger.status404(
					response,
					system.error,
					categoryManageConstant.notFound(paramsData.id)
				);
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
			const categoryManage = await categoryManageModel.findByIdAndUpdate(
				{ _id: paramsData.id },
				formData,
				{ new: true, runValidators: true, session: session }
			);

			if (!categoryManage) {
				session.endSession();
				return logger.status404(
					response,
					system.error,
					categoryManageConstant.notFound(paramsData.id)
				);
			}
			await session.commitTransaction();
			session.endSession();
			return logger.status200(
				response,
				system.success,
				categoryManageConstant.msgUpdate(paramsData.id),
				categoryManage
			);
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
			const categoryManage = await categoryManageModel
				.delete({
					_id: paramsData.id,
				})
				.session(session);

			if (!categoryManage.nModified) {
				session.endSession();
				return logger.status404(
					response,
					system.error,
					categoryManageConstant.notFound(paramsData.id)
				);
			}
			await session.commitTransaction();
			session.endSession();
			return logger.status200(
				response,
				system.success,
				categoryManageConstant.msgDelete(paramsData.id)
			);
		} catch (error) {
			await session.abortTransaction();
			session.endSession();
			errors.push(error.message);
			return logger.status500(response, error, errors);
		}
	}
}

module.exports = new CategoryManageController();
