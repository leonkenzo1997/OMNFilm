const recentVideo = {
    notFound: function (id) {
		return 'Not found _id: ' + id + ' in recent video';
	},
    errorCreate: 'Create recent video fail!!!',
    createSuccess: 'Create recent video success'
};

module.exports = recentVideo;
