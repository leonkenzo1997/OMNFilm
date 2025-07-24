const system = require('../../../Constant/General/SystemConstant');
const logger = require('../../../Constant/Logger/loggerConstant');
const constants = require('../../../Constant/constants');
const NotificationModel = require('../../../Models/Push/UserPushNotificationModel')
const NotificationConstant = require('../../../Constant/Notification/NotificationConstant')
const historyProgramModel = require('../../../Models/Program/HistoryProgramModel');

class NotificationController {
    // GET /offline/notification/count-noti
    async countNotification(request, response, next) {
        const errors = [];
        try {
            const count = await NotificationModel.countDocuments({
                receiverID: request.user._id,
                isRead: false,
                isPending: false,
                display: constants.DISPLAY_NOTIFICATION.OFFLINE
            })
            return logger.status200(response, system.error, '', { total: count });
        } catch (error) {
            errors.push(error.message);
            return logger.status500(response, error, errors, system.error);
        }
    }

    // PUT /offline/notification/clear-noti?id=613b10808cd8a30082a9b4ce
    async clearNotification(request, response, next) {
        const errors = [];
        try {
            let time = new Date()
            if (request.query.id) {
                const noti = await NotificationModel.findById(request.query.id)
    
                if (!noti) {
                    return logger.status404(response, system.error, NotificationConstant.idNotFound);
                }
                time = noti.createdAt
            }
            await NotificationModel.updateMany({
                receiverID: request.user._id,
                display: constants.DISPLAY_NOTIFICATION.OFFLINE,
                isPending: false,
                createdAt: { $lte: time },
                isRead: false
            }, { $set: { isRead: true } })
            return logger.status200(response, system.error, NotificationConstant.clearNotificationSuccess);
        } catch (error) {
            errors.push(error.message);
            return logger.status500(response, error, errors, system.error);
        }
    }

    // GET /offline/notification/check-indicator
    async checkIndicator(request, response, next) {
        const errors = [];
        const userData = request.user
        try {
            // Message
            const message = await NotificationModel.countDocuments({
                receiverID: userData._id,
                'body.type': {
                    $in: [
                        constants.NOTIFICATION_BODY_TYPE.ORIGINAL_APPROVE,
                        constants.NOTIFICATION_BODY_TYPE.PROFIT,
                        constants.NOTIFICATION_BODY_TYPE.MESSAGE_FROM_ADMIN,
                        constants.NOTIFICATION_BODY_TYPE.PROGRAM_UPLOAD
                    ]
                },
                seen: false,
                display: constants.DISPLAY_NOTIFICATION.OFFLINE
            })

            // Program
            const program = await historyProgramModel.countDocuments({
                receiverID: userData._id,
                seen: false,
                typeProgram: {
                    $in: [
                        constants.TYPE_PROGRAM_HISTORY.UPLOAD,
                        constants.TYPE_PROGRAM_HISTORY.UPLOAD_PROGRAM,
                    ]
                }
            })

            return logger.status200(response, system.error, '', { omniverse: false, program: !!program, payment: false, message: !!message });
        } catch (error) {
            errors.push(error.message);
            return logger.status500(response, error, errors, system.error);
        }
    }

    // PUT /offline/notification/clear-indicator
    async clearIndicator(request, response, next) {
        const errors = [];
        const userData = request.user
        const query = request.query
        try {

            switch (query.type) {
                case 'message':
                    // OMNiverse
                    await NotificationModel.updateMany({
                        receiverID: userData._id,
                        'body.type': {
                            $in: [
                                constants.NOTIFICATION_BODY_TYPE.ORIGINAL_APPROVE,
                                constants.NOTIFICATION_BODY_TYPE.PROFIT,
                                constants.NOTIFICATION_BODY_TYPE.MESSAGE_FROM_ADMIN,
                                constants.NOTIFICATION_BODY_TYPE.PROGRAM_UPLOAD,
                            ]
                        },
                        seen: false,
                        display: constants.DISPLAY_NOTIFICATION.OFFLINE
                    }, { $set: { seen: true } })
                    break;
                case 'program':
                    await historyProgramModel.updateMany({
                        receiverID: request.user._id,
                        seen: false,
                        typeProgram: {
                            $in: [
                                constants.TYPE_PROGRAM_HISTORY.UPLOAD,
                                constants.TYPE_PROGRAM_HISTORY.UPLOAD_PROGRAM,
                            ]
                        }
                    }, { $set: { seen: true } })
                    break;
                case 'omniverse':
                case 'payment':
                    break;
                default:
                    break;
            }
            return logger.status200(response, system.error, NotificationConstant.clearIndicatorSuccess);
        } catch (error) {
            errors.push(error.message);
            return logger.status500(response, error, errors, system.error);
        }
    }
}

module.exports = new NotificationController();
