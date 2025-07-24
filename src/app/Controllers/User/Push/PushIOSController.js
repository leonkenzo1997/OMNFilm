const apn = require('apn');

const logger = require('../../../Constant/Logger/loggerConstant');
const admin = require('firebase-admin');
const system = require('../../../Constant/General/SystemConstant');

var serviceAccount = require('../../../../../omn-firebase-adminsdk.json');

const option = {
	cert: join(__dirname, '/src/Certificates_Dev.pem'),
	key: join(__dirname, '/src/Certificates_Dev.pem'),
};
const provider = new apn.Provider(option);
const bundleID = process.env.BUNDLE_ID;

class PushIOSController {
	async sendNotification(token, message, title, data) {
		const note = new apn.Notification();
		note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.

		note.alert = message;
		note.subtitle = title;
		note.topic = bundleID;
		note.payload = {
			aps: {
				alert: message,
			},
			data: data || '',
		};

		try {
			await provider
				.send(note, token)
				.then(function (result) {
					return logger.status200(response, system.success, '', result);
				})
				.catch(function (error) {
					return logger.status200(response, system.error, '', error);
				});
		} catch (error) {
			errors.push(error.message);
			return logger.status500(response, error, errors);
		}
	}

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
}

module.exports = new PushIOSController();
