const mongoose = require('mongoose');
const videoManagePolicyModel = require('../../../../../Models/Manage/Footer/VideoManagePolicyModels');

const system = require('../../../../../Constant/General/SystemConstant');
const videoManagePolicyConstant = require('../../../../../Constant/VideoManagePolicy/VideoManagePolicyConstant');
const logger = require('../../../../../Constant/Logger/loggerConstant');

class VideoManagePolicyController {
	// [GET] /admin/manage/footer/video-manage-policy/
	async index(request, response, next) {
		const errors = [];
		try {
			const arrayVideoManagePolicy = await videoManagePolicyModel.find({});
			const totalVideoManagePolicy = await videoManagePolicyModel.countDocuments();
			const data = {
				totalVideoManagePolicy,
				arrayVideoManagePolicy,
			};
			return logger.status200(response, system.success, '', data);
		} catch (error) {
			errors.push(error.message);
			return logger.status500(response, error, errors);
		}
	}

	// [GET] /admin/manage/footer/video-manage-policy/:id
	async detail(request, response, next) {
		const paramsData = request.params;
		const errors = [];
		try {
			const videoManagePolicy = await videoManagePolicyModel.findById({
				_id: paramsData.id,
			});

			if (!videoManagePolicy) {
				return logger.status404(response, system.error, videoManagePolicyConstant.notFound(paramsData.id));
			} else {
				return logger.status200(response, system.success, '', videoManagePolicy);
			}
		} catch (error) {
			errors.push(error.message);
			return logger.status400(response, error, errors);
		}
	}

	// [POST] /admin/manage/footer/video-manage-policy/create
	async create(request, response, next) {
		const formData = request.body;
		const errors = [];
		let session = await mongoose.startSession();

		try {
			session.startTransaction();
			const videoManagePolicy = new videoManagePolicyModel(formData);
			const createVideoManagePolicy = await videoManagePolicy.save({
				session: session,
			});
			await session.commitTransaction();
			session.endSession();
			return logger.status201(response, createVideoManagePolicy);
		} catch (error) {
			await session.abortTransaction();
			session.endSession();
			errors.push(error.message);
			return logger.status400(response, error, errors, system.error);
		}
	}

	// [PUT] /admin/manage/footer/video-manage-policy/:id
	async update(request, response, next) {
		const paramsData = request.params;
		const formData = request.body;
		const errors = [];
		let session = await mongoose.startSession();
		try {
			session.startTransaction();
			const videoManagePolicy = await videoManagePolicyModel.findByIdAndUpdate({ _id: paramsData.id }, formData, {
				new: true,
				runValidators: true,
				session: session,
			});

			if (!videoManagePolicy) {
				await session.abortTransaction();
				session.endSession();
				return logger.status404(response, system.error, videoManagePolicyConstant.notFound(paramsData.id));
			}
			await session.commitTransaction();
			session.endSession();
			return logger.status200(
				response,
				system.success,
				videoManagePolicyConstant.msgUpdate(paramsData.id),
				videoManagePolicy
			);
		} catch (error) {
			await session.abortTransaction();
			session.endSession();
			errors.push(error.message);
			return logger.status400(response, error, errors);
		}
	}

	// [DELETE] /admin/manage/footer/video-manage-policy/:id
	async destroy(request, response, next) {
		const paramsData = request.params;
		const errors = [];
		let session = await mongoose.startSession();
		try {
			session.startTransaction();
			const videoManagePolicy = await videoManagePolicyModel
				.delete({
					_id: paramsData.id,
				})
				.session(session);

			if (!videoManagePolicy) {
				await session.abortTransaction();
				session.endSession();
				return logger.status404(response, system.error, videoManagePolicyConstant.notFound(paramsData.id));
			}
			await session.commitTransaction();
			session.endSession();
			return logger.status200(response, system.success, videoManagePolicyConstant.msgDelete(paramsData.id));
		} catch (error) {
			await session.abortTransaction();
			session.endSession();
			errors.push(error.message);
			return logger.status500(response, error, errors);
		}
	}
}

module.exports = new VideoManagePolicyController();
