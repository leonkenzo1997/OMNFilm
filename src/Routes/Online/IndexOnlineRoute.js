const homeRoute = require('./Home/HomeRoute');
const mobileRoute = require('./Mobile/MobileRoute');
const webRoute = require('./Web/WebRoute');
const background = require('./Background/BackgroundRoute');
const notificationRoute = require('./Notification/NotificationRoute');

module.exports = (app) => {
	// get data background
	app.use('/online/background', background);

	// Get data online
	app.use('/online', homeRoute);

	// Get data online for mobile
	app.use('/mobile', mobileRoute);

	// Get data online for web
	app.use('/web', webRoute);

	// Online notification
	app.use('/online/notification', notificationRoute);
};
