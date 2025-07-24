var MongooseQueue = require('mongoose-queue').MongooseQueue;
const mongoose = require('mongoose');
const payLoad = require('./PayloadModel');

class JobsQueue {
	async init(nameJobs) {
		var myOptions = {
			payloadRefType: mongoose.Types.UUID,
			queueCollection: 'queue',
			blockDuration: 30000,
			maxRetries: 5,
		};

		var myQueue = new MongooseQueue(payLoad, nameJobs, myOptions);

		let playload = await payLoad.create({ first: 'danh', second: 'dadadsa' });

		myQueue.add(playload, cb);

		myQueue.get(function (err, job) {
			if (err) return done(err);
			if (job) {
				console.log(job.id);
				console.log(job.payload);
				console.log(job.blockedUntil);
				console.log(job.done);
			}
		});
	}
}

module.exports = new JobsQueue();
