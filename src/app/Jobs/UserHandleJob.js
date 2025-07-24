const NotificationModel = require('../Models/Push/UserPushNotificationModel');
const MessageModel = require('../Models/Message/MessageModel');
const constants = require('../Constant/constants');

class UserHandleJob {
	async sendMessages() {
		try {
			const now = Date.now();
			const min = parseInt(now / 100000) * 100;
			const max = parseInt(now / 100000) * 100 + 9;

			const userIDs = await NotificationModel.distinct('receiverID', {
				'body.schedule': {
					$lte: max,
					$gte: min,
				},
				display: constants.DISPLAY_NOTIFICATION.OFFLINE,
				isPending: true,
			});

			await NotificationModel.updateMany(
				{
					'body.schedule': {
						$lte: max,
						$gte: min,
					},
					display: constants.DISPLAY_NOTIFICATION.OFFLINE,
					isPending: true
				},
				{
					$set: {
						isPending: false,
					},
				}
			);

			await MessageModel.updateMany(
				{
					schedule: {
						$lte: max,
						$gte: min,
					},
					status: { $ne: 'deleted' },
					display: constants.DISPLAY_NOTIFICATION.OFFLINE,
					isPending: true
				},
				{
					$set: {
						isPending: false,
					},
				}
			);

			if (userIDs && userIDs.length) {
				// Push for tab messages in omner ofline
				if (sockets) {
					sockets.emit(constants.MESSAGES_NOTIFICATION.OTHER_MESSAGES, { userIDs });
					sockets.emit(constants.MESSAGES_NOTIFICATION.OFFLINE, { userIDs });
				}
				// End
			}
		} catch (error) {
			console.log(error.message);
		}
	}
}

module.exports = new UserHandleJob();
