const moment = require('moment-timezone');

Date.prototype.toJSON = function () {
	try {
		let t = moment(this).tz('Asia/Seoul').toObject();
		let time = t.years + '-';
		time += (t.months + 1 >= 10 ? t.months + 1 : '0' + (t.months + 1)) + '-';
		time += (t.date >= 10 ? t.date : '0' + t.date) + ' ';
		time += (t.hours >= 10 ? t.hours : '0' + t.hours) + ':';
		time += (t.minutes >= 10 ? t.minutes : '0' + t.minutes) + ':';
		time += t.seconds >= 10 ? t.seconds : '0' + t.seconds;
		return time;
	} catch (error) {
		return new Date().toLocaleString();
	}
};
