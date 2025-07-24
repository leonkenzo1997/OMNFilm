var fs = require('fs');
var util = require('util');
const moment = require('moment-timezone');

var dir = 'src/logs';

if (!fs.existsSync(dir)) {
	fs.mkdirSync(dir);
}

console.log = function () {
	let time = moment().tz('Asia/Seoul').format('yyyy-MM-DD');
	var logFile = fs.createWriteStream(dir + '/log_' + time + '.txt', { flags: 'a' });
	var logStdout = process.stdout;
	let t = moment().toObject();
	let timelog = (t.date >= 10 ? t.date : '0' + t.date) + '-';
	timelog += (t.months + 1 >= 10 ? t.months + 1 : '0' + (t.months + 1)) + '-';
	timelog += t.years + ' ';
	timelog += (t.hours >= 10 ? t.hours : '0' + t.hours) + ':';
	timelog += (t.minutes >= 10 ? t.minutes : '0' + t.minutes) + ':';
	timelog += t.seconds >= 10 ? t.seconds : '0' + t.seconds;
	arguments[0] = '[' + timelog + '] : ' + arguments[0];
	logFile.write(util.format.apply(null, arguments) + '\n');
	logStdout.write(util.format.apply(null, arguments) + '\n');
};

console.error = console.log;
