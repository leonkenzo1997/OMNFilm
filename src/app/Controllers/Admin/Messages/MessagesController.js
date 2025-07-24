const logger = require('../../../Constant/Logger/loggerConstant');
const constants = require('../../../Constant/constants');
const system = require('../../../Constant/General/SystemConstant');
const MessagesConstant = require('../../../Constant/Messages/MessagesConstant');
const UserModel = require('../../../Models/User/UserModel');
const NotificationModel = require('../../../Models/Push/UserPushNotificationModel');
const MessageModel = require('../../../Models/Message/MessageModel');
const MembershipModel = require('../../../Models/Manage/Membership/MembershipModel');
const businessQuery = require('../../../Business/QueryModel');
const common = require('../../../Service/common');

class MessagesController {
	async getMessages(request, response) {
		const errors = [];

		try {
			let _export = null;
			let lang = null;
			request.query.status = { $ne: 'deleted' }
			if (request.query.export) {
                _export = request.query.export;
                delete request.query.export;
            }

			if (request.query.lang && request.query.lang != '') {
				lang = request.query.lang.toLowerCase();
				delete request.query.lang;
			} else {
				delete request.query.lang;
			}

			const messages = await businessQuery.handle(MessageModel, request);

            if (_export) {
				let headers = [
                    "STT", "Date Sent", "Message Type", "Message Category",
                    "Recipient", "Email Title"
                ];

				let paramField = [
                    'createdAt', 'type', 'category',
                    'receiverEmail', 'title'
                ];

				if (lang == constants.LANGUAGE.EN) {
					return common.exportExcel(
						messages.docs, headers, paramField,
						'Message User List', response, 25
					);

				} else {
					headers = [
						"연번", "전송 일자", "메시지 종류", "메시지 카테고리",
						"수신자", "메시지 제목"
					];
					let title = "보낸 메시지";
					if (request.query.isSchedule == 'true') {
						title = "예약 메시지";
					}
					return common.exportExcel(
						messages.docs, headers, paramField, 'Message User List', 
						response, 25, title
					);
				}
            }
			
			return logger.status200(response, system.success, '', messages);
		} catch (error) {
			errors.push(error.message);
			return logger.status400(response, error, errors);
		}
	}

	async getDeletedMessages(request, response) {
		const errors = [];

		try {
			let _export = null;
			let lang = null;
			request.query.status = 'deleted';
			if (request.query.export) {
                _export = request.query.export;
                delete request.query.export;
            }

			if (request.query.lang && request.query.lang != '') {
				lang = request.query.lang.toLowerCase();
				delete request.query.lang;
			} else {
				delete request.query.lang;
			}
			
			const messages = await businessQuery.handle(MessageModel, request);

			if (_export) {
                let headers = [
                    "STT", "Deleted Date", "Message Type",
                    "Recipient", "Email Title"
                ];
                let paramField = [
                    'updatedAt', 'type',
                    'receiverEmail', 'title'
                ];

				if (lang == constants.LANGUAGE.EN) {
					return common.exportExcel(messages.docs, headers, paramField, 'Message User List Deleted', response, 25);
				} else {
					headers = [
						"연번", "삭제된 날짜", "메시지 카테고리",
						"수신자", "메시지 제목"
					];
					return common.exportExcel(
						messages.docs, headers, paramField, 'Message User List Deleted', 
						response, 25, "삭제된 메시지"
					);
				}
            }

			return logger.status200(response, system.success, '', messages);
		} catch (error) {
			errors.push(error.message);
			return logger.status400(response, error, errors);
		}
	}

	async deleteMessage(request, response) {
		const errors = [];
		try {
			const message = await MessageModel.findById(request.params.id)

			if (!message) {
				return logger.status400(response, system.error, 'ID message not found');
			}
			message.status = 'deleted'
			await message.save()
			return logger.status200Msg(response, system.success, 'Delete success');
		} catch (error) {
			errors.push(error.message);
			return logger.status400(response, error, errors);
		}
	}

	async getDetailMessage(request, response) {
		const errors = [];
		try {
			const message = await MessageModel.findById(request.params.id)
			return logger.status200(response, system.success, '', message);
		} catch (error) {
			errors.push(error.message);
			return logger.status400(response, error, errors);
		}
	}

	async sendMessages(request, response) {
		const errors = [];
		const { body } = request;
		try {
			if (!body.typeSend || !Object.values(constants.TYPE_SEND_NOTIFICATION).includes(body.typeSend)) {
				return logger.status400(response, system.error, MessagesConstant.invalidTypeNotification);
			}

			if (!body.category || !Object.values(constants.CATEGORY_NOTIFICATION).includes(body.category)) {
				return logger.status400(response, system.error, MessagesConstant.invalidCategoryNotification);
			}

			let users = [];
			switch (body.typeSend) {
				case constants.TYPE_SEND_NOTIFICATION.PREMIUM:
				case constants.TYPE_SEND_NOTIFICATION.STANDARD:
				case constants.TYPE_SEND_NOTIFICATION.BASIC:
					const membership = await MembershipModel.findOne({ packageName: body.typeSend });

					users = await UserModel.find({
						userMembership: membership && membership._id,
						deleted: false,
						userType: constants.USER_TYPE.USER,
					});
					break;
				case constants.TYPE_SEND_NOTIFICATION.ALL:
					users = await UserModel.find({
						deleted: false,
						userType: constants.USER_TYPE.USER,
					});
					break;
				case constants.TYPE_SEND_NOTIFICATION.DIRECT_INPUT:
					users = await UserModel.find({
						_id: body.userIDs,
						deleted: false,
						userType: constants.USER_TYPE.USER,
					});
					break;
				default:
					break;
			}

			const userIDs = [];
			const groupID = Date.now();
			let pushNow = true
			await Promise.all(
				users.map(async (user) => {
					const data = {
						senderID: request.user._id,
						receiverID: user._id,
						programID: undefined,
						title: body.title,
						body: {
							...body,
							type: constants.NOTIFICATION_BODY_TYPE.MESSAGE_FROM_ADMIN,
							groupID,
						},
						type: constants.NOTIFICATION_BODY_TYPE.MESSAGE_FROM_ADMIN,
						display: constants.DISPLAY_NOTIFICATION.OFFLINE,
						isPending: true,
					};

					// Show online
					const notification = new NotificationModel(data);

					// Show admin
					const message = new MessageModel({
						title: body.title,
						content: body.message,
						receiver: user._id,
						receiverEmail: user.userEmail,
						sender: request.user._id,
						isPending: true,
						type: constants.MESSAGE_TYPE.MANUAL,
						category: constants.MESSAGE_CATEGORY.OTHER,
						display: constants.DISPLAY_NOTIFICATION.OFFLINE,
						schedule: body.schedule,
						isSchedule: true
					})

					if (!body.schedule) {
						userIDs.push(user._id);
						notification.isPending = false;
						message.isPending = false;
						message.isSchedule = false
						pushNow = false
					}
					await notification.save();
					await message.save();
				})
			);

			if (userIDs && userIDs.length && pushNow) {
				// Push for tab messages in omner ofline
				if (sockets) sockets.emit(constants.MESSAGES_NOTIFICATION.OTHER_MESSAGES, { userIDs });
				// End
			}

			return logger.status200Msg(response, system.success, MessagesConstant.createSuccess);
		} catch (error) {
			errors.push(error.message);
			return logger.status400(response, error, errors);
		}
	}

	async searchUsers(request, response) {
		const errors = [];
		try {
			request.query.userType = constants.USER_TYPE.USER;
			request.query.deleted = false;

			const selectFields = [
				'userEmail',
				'userName',
				'userPhoneNumber'
			];

			const data = await businessQuery.handle(
				UserModel,
				request,
				null,
				selectFields
			);

			return logger.status200(response, system.success, '', data);
		} catch (error) {
			errors.push(error.message);
			return logger.status400(response, error, errors);
		}
	}
}

module.exports = new MessagesController();
