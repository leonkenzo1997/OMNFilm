const mongoose = require('mongoose');
const moment = require('moment-timezone');
var logger = console;
var loggerLevel = 'debug';
var logTime = {
	logDBTime(schema) {
		const targetMethods = [
			'find',
			'findOne',
			'count',
			'save',
			'findById',
			'updateOne',
			'updateMany',
			'insertMany',
			'countDocuments',
			'estimatedDocumentCount',
			'findOneAndUpdate',
			'findOneAndRemove',
			'findOneAndDelete',
			'deleteOne',
			'deleteMany',
			'remove',
			'aggregate'
		];
		if (process.env.DEBUG) {
			targetMethods.forEach((method) => {
				schema.pre(method, logTime.preQueryHook);
				schema.post(method, logTime.postQueryHook);
			});
		}
	},

	preQueryHook() {
		mongoose.set('debug', true);
		// @ts-ignore
		this.__startTime = Date.now();
	},

	postQueryHook() {
		const target = this;
		if (target.$__insertMany) {
			target.op = 'insertMany';
		}

		if (target.__startTime != null) {
			logTime.loggerFunction(
				target.op ?? target.$op,
				target._collection?.collectionName,
				Date.now() - target.__startTime,
				target._conditions,
				target._update,
				target.__additionalProperties
			);
		}
	},

	loggerFunction(operation, collectionName, executionTimeMS, filter, update, additionalLogProperties) {
		let t = moment().toObject();
		let time = (t.date >= 10 ? t.date : '0' + t.date) + '-';
		time += (t.months + 1 >= 10 ? t.months + 1 : '0' + (t.months + 1)) + '-';
		time += t.years + ' ';
		time += (t.hours >= 10 ? t.hours : '0' + t.hours) + ':';
		time += (t.minutes >= 10 ? t.minutes : '0' + t.minutes) + ':';
		time += t.seconds >= 10 ? t.seconds : '0' + t.seconds;
		logger[loggerLevel](`[${time}]:${operation} in ${collectionName} completed in: ${executionTimeMS} ms`);
		logger[loggerLevel]('-----------------------------------------------------------------------------');
		mongoose.set('debug', false);
	},
};

module.exports = logTime;
