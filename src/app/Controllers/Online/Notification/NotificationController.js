const system = require('../../../Constant/General/SystemConstant');
const logger = require('../../../Constant/Logger/loggerConstant');
const constants = require('../../../Constant/constants');
const NotificationModel = require('../../../Models/Push/UserPushNotificationModel')
const NotificationConstant = require('../../../Constant/Notification/NotificationConstant')

class NotificationController {
    async countNotification(request, response, next) {
        const errors = [];
        try {
            const count = await NotificationModel.countDocuments({
                receiverID: request.user._id,
                isRead: false,
                isPending: false,
                display: constants.DISPLAY_NOTIFICATION.ONLINE
            })
            return logger.status200(response, system.error, '', { total: count });
        } catch (error) {
            errors.push(error.message);
            return logger.status500(response, error, errors, system.error);
        }
    }

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
                display: constants.DISPLAY_NOTIFICATION.ONLINE,
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
}

module.exports = new NotificationController();
