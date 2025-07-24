const NotificationModel = require('../../../../Models/Push/UserPushNotificationModel');

const system = require('../../../../Constant/General/SystemConstant');
const logger = require('../../../../Constant/Logger/loggerConstant');
const businessQuery = require('../../../../Business/QueryModel');

const constants = require('../../../../Constant/constants')

class UploadController {
	// [GET] /offline/omner/messages
	async index(request, response, next) {
		const errors = [];
		try {
			request.query.receiverID = request.user._id
			request.query.isPending = false

			request.query.display = constants.DISPLAY_NOTIFICATION.OFFLINE
			request.query['body.type'] = constants.NOTIFICATION_BODY_TYPE.MESSAGE_FROM_ADMIN

			request.query.category = parseInt(request.query.category)
			if (request.query.category) {
				request.query['body.category'] = request.query.category
			}
			delete request.query.category

			const result = await businessQuery.handle(
				NotificationModel,
				request,
				{
					path: 'programID',
					select: 'programImageTitle'
				}
			);

			const notifications = []
			await Promise.all(result.docs.map(item => {
				notifications.push({
					_id: item._id,
					category: item.body.category,
					title: item.body.title,
					message: item.body.message,
					thumbnail: item.programID && item.programID.programImageTitle || constants.DEFAULT_THUMNAIL
				})
			}))

			result.docs = notifications
			return logger.status200(response, system.success, '', result);
		} catch (error) {
			errors.push(error.message);
			return logger.status500(response, error, errors);
		}
	}

	// [GET] /offline/omner/messages/:id
	async detail(request, response, next) {
		const errors = [];
		try {
			const selectFields = [
				'_id',
				'body',
				'createdAt',
				'updatedAt'
			]
			const result = await NotificationModel.findById(request.params.id)
				.select(selectFields)
				.lean()

			if (!result) {
				return logger.status404(response, system.error, 'Not found');
			}

			const notification = {
				...result,
				...result.body
			}

			delete notification.body
			delete notification.userIDs
			delete notification.groupID
			return logger.status200(response, system.success, '', notification);
		} catch (error) {
			errors.push(error.message);
			return logger.status500(response, error, errors);
		}
	}
}

module.exports = new UploadController();
