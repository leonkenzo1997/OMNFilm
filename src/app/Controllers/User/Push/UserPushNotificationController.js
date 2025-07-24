const mongoose = require('mongoose');
const userPushNotificationModel = require('../../../Models/Push/UserPushNotificationModel');

const system = require('../../../Constant/General/SystemConstant');
const logger = require('../../../Constant/Logger/loggerConstant');
const constants = require('../../../Constant/constants');
const pushNotificationConstant = require('../../../Constant/PushNotification/PushNotificationConstant');
const businessQuery = require('../../../Business/QueryModel');
const common = require('../../../Service/common')

class UserPushNotificationContrller {
	// [GET] /user/push-notification/
	async index(request, response, next) {
		const errors = [];
		try {
			request.query.sort = 'createdAt,desc';
			request.query.receiverID = request.user._id;
			request.query.isPending = false;
			let notifications = await businessQuery.handle(userPushNotificationModel, request, {
				path: 'programID',
				select: [
					'programImageTitle',
					'programImageTitleResize1'
				]
			});

			notifications = JSON.parse(JSON.stringify(notifications))
			await Promise.all(notifications.docs.map(item => {
				// item.createdAt = new Date(new Date(item.createdAt).getTime() - 39600000)
				// item.updatedAt = new Date(new Date(item.updatedAt).getTime() - 39600000)
				if (!item.programID) {
					item.programID = {
						programImageTitle: constants.DEFAULT_THUMNAIL
					}
				} else {
					item.programID.programImageTitle = item.programID.programImageTitleResize1 || constants.DEFAULT_THUMNAIL
					delete item.programID.programImageTitleResize1
				}
			}))
			return logger.status200(response, system.success, '', notifications);
		} catch (error) {
			errors.push(error.message);
			return logger.status500(response, error, errors);
		}
	}

	// [GET] /user/push-notification/:id
	async detail(request, response, next) {
		const paramsData = request.params;
		const errors = [];
		const fieldSelect = [
			'programVideoSetting',
			'programThumbnail',
			'programImageBracter',
			'programImageTitle',
			'programImagePoster',
			'programTypeVideo',
			'programName',
			'programTitle',
			'programImagePosterNoTitle',
			'programSubTitle',
			'programSummary',
			'programTotalView',
			'linkVideo',
			'programType',
			'createdAt',
		];
		try {
			const userPushNotification = await userPushNotificationModel
				.findById({
					_id: paramsData.id,
				})
				.populate({
					path: 'programID',
					select: fieldSelect,
				});
			if (!userPushNotification) {
				return logger.status404(
					response,
					system.error,
					userPushNotificationConstant.notFound(paramsData.id)
				);
			} else {
				return logger.status200(
					response,
					system.success,
					'',
					userPushNotification
				);
			}
		} catch (error) {
			errors.push(error.message);
			return logger.status400(response, error, errors);
		}
	}

	//[POST] /user/push-notification/create
	async create(request, response, next) {
		const formData = request.body;
		const errors = [];
		let session = await mongoose.startSession();

		try {
			session.startTransaction();
			const userPushNotification = new userPushNotificationModel(formData);
			const createUserPushNotification = await userPushNotification.save({
				session: session,
			});
			await session.commitTransaction();
			session.endSession();
			return logger.status201(response, createUserPushNotification);
		} catch (error) {
			await session.abortTransaction();
			session.endSession();
			errors.push(error.message);
			return logger.status400(response, error, errors, system.error);
		}
	}

	// [PUT] /user/push-notification/:id
	async update(request, response, next) {
		const paramsData = request.params;
		const errors = [];
		let session = await mongoose.startSession();
		try {
			session.startTransaction();
			const userPushNotification = await userPushNotificationModel.findById({
				_id: paramsData.id,
			});

			if (!userPushNotification) {
				await session.abortTransaction();
				session.endSession();
				return logger.status404(
					response,
					system.error,
					pushNotificationConstant.notFound(paramsData.id)
				);
			}
			userPushNotification.isRead = true;
			await userPushNotification.save({ session: session });
			await session.commitTransaction();
			session.endSession();
			return logger.status200Msg(
				response,
				system.success,
				pushNotificationConstant.msgUpdate(paramsData.id)
			);
		} catch (error) {
			await session.abortTransaction();
			session.endSession();
			errors.push(error.message);
			return logger.status400(response, error, errors);
		}
	}
}

module.exports = new UserPushNotificationContrller();
