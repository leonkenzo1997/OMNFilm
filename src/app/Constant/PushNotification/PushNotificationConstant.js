const PushNotification = {
	notFound: function (id) {
		return 'Not found _id: ' + id + ' in Push Notification array';
	},

	notFoundDelete: function (id) {
		return 'Not found _id: ' + id + ' in Push Notification delete array';
	},
	msgDelete: function (id) {
		return 'Deleted successfully _id: ' + id + ' in Push Notification!!!';
	},
	msgCompleteDelete: function (id) {
		return 'Deleted completely _id: ' + id + ' in Push Notification successful!!!';
	},
	msgUpdate: function (id) {
		return 'Updated successfully _id ' + id + ' in Push Notification!!!';
	},
	msgRestore: function (id) {
		return 'Restored successfully _id ' + id + ' in Push Notification!!!';
	}
};

module.exports = PushNotification;
