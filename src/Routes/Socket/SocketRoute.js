const socketController = require('../../app/Controllers/Socket/SocketController');

function socketRoute(socket, io) {
	io.local.emit('Connect id : ' + socket.client.id);
	socket.on('disconnect', () => {
		// console.log('Disconnected id : ' + socket.client.id);
		// socketController.endTimePlay(socket);
		socketController.disconnect(socket);
	});

	socket.on('connect_error', function () {
		console.log('Socket Connection Error');
	});
	socket.on('connect_failed', function () {
		console.log('Socket Connection Failed');
	});
	socket.on('error', function (err) {
		console.log('Socket error: ', err);
	});

	socket.on('playVideo', (data) => {
		socket.userData = data;
		socketController.playVideo(socket);
	});

	socket.on('stopVideo', (data) => {
		socket.userData = data;
		socketController.stopVideo(socket);
	});

	socket.on('startPlay', (data) => {
		socket.userData = data;
		let result = socketController.startTimePlay(socket);

		if (result) {
			io.local.emit('start video id: ' + socket.client.id);
		}
	});

	socket.on('endPlay', (data) => {
		// socket.userData = data;
		// let result = socketController.endTimePlay(socket);
		// if (result) {
		// 	io.local.emit('end video id: ' + socket.client.id);
		// }
	});

	socket.on('resumeVideo', (data) => {
		socket.userData = data;
		let result = socketController.resumeVideo(socket);
		if (result) {
			io.local.emit('resume video id: ' + socket.client.id);
		}
	});
}

module.exports = socketRoute;
