const Messages = {
	notFound: function (id) {
		return 'Not found _id: ' + id + ' in Messages array';
	},

	notFoundDelete: function (id) {
		return 'Not found _id: ' + id + ' in Messages delete array';
	},
	msgDelete: function (id) {
		return 'Deleted successfully _id: ' + id + ' in Messages!!!';
	},
	msgCompleteDelete: function (id) {
		return 'Deleted completely _id: ' + id + ' in Messages successful!!!';
	},
	msgUpdate: function (id) {
		return 'Updated successfully _id ' + id + ' in Messages!!!';
	},
	msgRestore: function (id) {
		return 'Restored successfully _id ' + id + ' in Messages!!!';
	},
	invalidTypeNotification: 'Type send notification invalid',
	invalidCategoryNotification: 'Category notification invalid',
	createSuccess: 'Create messages success',
};

module.exports = Messages;
