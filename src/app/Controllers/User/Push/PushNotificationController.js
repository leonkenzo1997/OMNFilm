const mongoose = require('mongoose');

const logger = require('../../../Constant/Logger/loggerConstant');
const admin = require('firebase-admin');
const system = require('../../../Constant/General/SystemConstant');

const serviceAccount = require('../../../../../omn-firebase-adminsdk.json');

const userPushNotificationModel = require('../../../Models/Push/UserPushNotificationModel');
const UserModel = require('../../../Models/User/UserModel');
const RecentVideoModel = require('../../../Models/RecentVideo/RecentVideoModel');
const constants = require('../../../Constant/constants');
const userModel = require('../../../Models/User/UserModel');

class PushNotificationController {
    async pushMessage(request, response, next) {
        const errors = [];
        const formData = request.body;
        const body = formData.body;
        const title = formData.title;
        const idToken = formData.idToken;
        try {
            if (!admin.apps.length) {
                await admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount),
                    databaseURL: 'https://omn-application.firebaseio.com',
                });
            }

            let registrationToken = idToken;
            let payload = {
                notification: {
                    title: title,
                    body: body,
                },
            };
            let options = {
                priority: 'high',
                timeToLive: 60 * 60 * 24,
            };
            await admin
                .messaging()
                .sendToDevice(registrationToken, payload, options)
                .then(function (res) {
                    return logger.status200(response, system.success, '', res);
                })
                .catch(function (error) {
                    return logger.status200(response, system.error, '', error);
                });
        } catch (error) {
            errors.push(error.message);
            return logger.status500(response, error, errors);
        }
    }

    async pushSubscribeToTopic(request, response, next) {
        const errors = [];
        try {
            let registrationToken = ''; // maybe array
            let topic = '';
            if (!admin.apps.length) {
                admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount),
                    databaseURL: 'https://omn-application.firebaseio.com',
                });
            }
            admin
                .messaging()
                .subscribeToTopic(registrationToken, topic)
                .then(function (response) {
                    return logger.status200(response, system.error, '', response);
                })
                .catch(function (error) {
                    return logger.status200(response, system.error, '', error);
                });
        } catch (error) {
            errors.push(error.message);
            return logger.status500(response, error, errors);
        }
    }

    async pushTopic(request, response, next) {
        const errors = [];
        try {
            // var payload = {
            // 	notification: {
            // 	  title: "NASDAQ News",
            // 	  body: "The NASDAQ climbs for the second day. Closes up 0.60%."
            // 	}
            //   };
            // var topic = "finance";
            let payload = {};
            let topic = '';
            if (!admin.apps.length) {
                await admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount),
                    databaseURL: 'https://omn-application.firebaseio.com',
                });
            }
            await admin
                .messaging()
                .sendToTopic(topic, payload)
                .then(function (response) {
                    return logger.status200(response, system.error, '', response);
                })
                .catch(function (error) {
                    return logger.status200(response, system.error, '', error);
                });
        } catch (error) {
            errors.push(error.message);
            return logger.status500(response, error, errors);
        }
    }

    async pushCondition(request, response, next) {
        const errors = [];
        try {
            let payload = {};
            let topic = '';
            // var condition = "'news' in topics && ('finance' in topics || 'politics' in topics')";
            let condition = '';
            if (!admin.apps.length) {
                await admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount),
                    databaseURL: 'https://omn-application.firebaseio.com',
                });
            }
            await admin
                .messaging()
                .sendToCondition(condition, payload)
                .then(function (response) {
                    return logger.status200(response, system.error, '', response);
                })
                .catch(function (error) {
                    return logger.status200(response, system.error, '', error);
                });
        } catch (error) {
            errors.push(error.message);
            return logger.status500(response, error, errors);
        }
    }

    // Admin change status program to Instant
    async pushNotificationNewProgram(program = {}, user = {}) {
        try {
            const listUsers = await RecentVideoModel.distinct('userID', {
                categoryID: program.programCategory.categoryManageId,
            });

            const listTokenUsers = await UserModel.distinct('userToken.deviceToken', {
                _id: { $in: listUsers },
                'userToken.deviceToken': { $nin: [null, ''] },
            });

            const body = {
                programID: program._id.toString(),
                type: constants.NOTIFICATION_BODY_TYPE.PROGRAM_UPLOAD,
            };
            const title = `New film ${program.programName} was upload`;
            const registrationToken = listTokenUsers;

            // Save notification
            await Promise.all(
                listUsers.map(async (idUser) => {
                    const dataPushNotification = {
                        senderID: user._id || undefined,
                        receiverID: idUser || undefined,
                        programID: program._id.toString() || undefined,
                        title: title,
                        body: body,
                        display: constants.DISPLAY_NOTIFICATION.ONLINE,
                    };
                    let session = await mongoose.startSession();
                    session.startTransaction();

                    const userPushNotification = new userPushNotificationModel(
                        dataPushNotification
                    );
                    await userPushNotification.save({ session: session });

                    await session.commitTransaction();
                    session.endSession();
                })
            );
            // End

            // Push notification for bell
            if (sockets)
                sockets.emit(constants.MESSAGES_NOTIFICATION.ONLINE, {
                    data: 'New program notification online',
                });
            // End

            if (!listTokenUsers || !listTokenUsers.length) {
                return;
            }

            if (!admin.apps.length) {
                await admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount),
                    databaseURL: 'https://omn-application.firebaseio.com',
                });
            }

            const payload = {
                notification: {
                    title: title,
                    ...body,
                },
            };
            const options = {
                priority: 'high',
                timeToLive: 60 * 60 * 24,
            };
            admin
                .messaging()
                .sendToDevice(registrationToken, payload, options)
                .then(function (res) {
                    console.log('DONE: ', res);
                })
                .catch(function (error) {
                    console.log('ERROR: ', error);
                });
        } catch (error) {
            console.log(error);
        }
    }

    // Admin change status
    async pushNotificationChangeStatus(program = {}, user = {}, title, body, history = {}, session) {
        // const session = await mongoose.startSession();
        // session.startTransaction();
        try {
            // Push for tab program in omner ofline
            if (sockets)
                sockets.emit(constants.MESSAGES_NOTIFICATION.OFFLINE, {
                    userIDs: [program.userID._id],
                });
            // End

            // Get token device
            const listTokenUsers = program.userID
                ? program.userID.userToken.filter((item) => item.deviceToken)
                : [];

            const registrationToken = listTokenUsers;

            // Create record in table notification
            const dataPushNotification = {
                senderID: user._id,
                receiverID: program.userID && program.userID._id,
                programID: program._id.toString(),
                historyID: history._id || undefined,
                title: title,
                body: {
                    type: constants.NOTIFICATION_BODY_TYPE.PROGRAM_UPLOAD,
                    title: title,
                    message: body,
                    category: constants.CATEGORY_NOTIFICATION.PROGRAM,
                },
                display: constants.DISPLAY_NOTIFICATION.OFFLINE,
            };

            const userPushNotification = new userPushNotificationModel(
                dataPushNotification
            );
            await userPushNotification.save({ session: session });

            // End create notification

            if (!registrationToken || !registrationToken.length) {
                return;
            }
            if (!admin.apps.length) {
                await admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount),
                    databaseURL: 'https://omn-application.firebaseio.com',
                });
            }

            const payload = {
                notification: {
                    title: title,
                    body: body,
                },
            };
            const options = {
                priority: 'high',
                timeToLive: 60 * 60 * 24,
            };
            admin
                .messaging()
                .sendToDevice(registrationToken, payload, options)
                .then(function (res) {
                    console.log('DONE: ', res);
                })
                .catch(function (error) {
                    console.log('ERROR: ', error);
                });
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            console.log(error);
        }
    }

    // Admin change status
    async pushNotificationPaymentProblem(userID = '', problem) {
        try {
            // Get token device
            const user = await userModel.findById(userID);

            if (!user) return;
            const registrationToken = user.userToken.filter((item) => item.deviceToken);

            const sender = await userModel.findOne({
                userType: constants.USER_TYPE.ADMIN,
                deleted: false,
            });
            const body = {
                type: constants.NOTIFICATION_BODY_TYPE.PAYMENT_PROBLEM,
            };

            // Set title
            let title = '';
            switch (problem) {
                case constants.PAYMENT_PROBLEM.ERROR:
                    title = `Payment eror`;
                    break;
                case constants.PAYMENT_PROBLEM.UNAUTHEN:
                    title = `Billing fail, unauthenticate`;
                    break;
                case constants.PAYMENT_PROBLEM.APPROVAL_FAIL:
                    title = `Billing approval fail`;
                    break;
                default:
                    break;
            }

            // Create record in table notification
            const dataPushNotification = {
                senderID: sender._id,
                receiverID: userID || undefined,
                title: title,
                body: body,
                message: 'Please check the reason!',
                display: constants.DISPLAY_NOTIFICATION.ONLINE,
            };
            const userPushNotification = new userPushNotificationModel(
                dataPushNotification
            );
            await userPushNotification.save();
            // End create notification

            // Push notification for bell
            if (sockets) sockets.emit('payment_problem', { data: 'Payment problem' });
            // End

            if (!registrationToken || !registrationToken.length) {
                return;
            }
            if (!admin.apps.length) {
                await admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount),
                    databaseURL: 'https://omn-application.firebaseio.com',
                });
            }

            // Push
            const payload = {
                notification: {
                    title: title,
                    ...body,
                },
            };
            const options = {
                priority: 'high',
                timeToLive: 60 * 60 * 24,
            };
            admin
                .messaging()
                .sendToDevice(registrationToken, payload, options)
                .then(function (res) {
                    console.log('DONE: ', res);
                })
                .catch(function (error) {
                    console.log('ERROR: ', error);
                });
        } catch (error) {
            console.log(error);
        }
    }
}

module.exports = new PushNotificationController();
