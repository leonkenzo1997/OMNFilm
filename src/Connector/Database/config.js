const mongoose = require('mongoose');
const urlDb = process.env.HOST;

async function connect() {
	try {
		await mongoose.connect(urlDb, {
			useUnifiedTopology: true,
			useNewUrlParser: true,
			useCreateIndex: true,
			useFindAndModify: false,
			autoIndex: false, // Don't build indexes
			poolSize: 10, // Maintain up to 10 socket connections
			// If not connected, return errors immediately rather than waiting for reconnect
			bufferMaxEntries: 0,
			connectTimeoutMS: 10000, // Give up initial connection after 10 seconds
			socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
			family: 4, // Use IPv4, skip trying IPv6
		});
		console.log('Connection db has been established successfully.');
	} catch (error) {
		console.error('Unable to connect to the database:', error);
	}
}

module.exports = { connect };
