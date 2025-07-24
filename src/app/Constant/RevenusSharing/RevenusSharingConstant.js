const RevenusSharing = {
	notFound: function (id) {
		return 'Not found _id: ' + id + ' in Revenus Sharing array';
	},

	notFoundDelete: function (id) {
		return 'Not found _id: ' + id + ' in Revenus Sharing delete array';
	},
	msgDelete: function (id) {
		return 'Deleted successfully _id: ' + id + ' in Revenus Sharing!!!';
	},
	msgCompleteDelete: function (id) {
		return 'Deleted completely _id: ' + id + ' in Revenus Sharing successful!!!';
	},
	msgUpdate: function (id) {
		return 'Updated successfully _id ' + id + ' in Revenus Sharing!!!';
	},
	msgRestore: function (id) {
		return 'Restored successfully _id ' + id + ' in Revenus Sharing!!!';
	},
	allowedUpdates: [
		'userEmail',
		'userPhoneNumber',
		'userDOB',
		'userName',
		'userGender',
		'phoneNumber',
		'idAreaCode',
		'areaCode',
	],
	errorCreate: 'create Revenus Sharing fail!!!',
	notFoundEmail: function (email) {
		return 'Not found email: ' + email + ' in Revenus Sharing array';
	},
	userNotExist: 'User not exist.',
	dataError: 'Data error ! Please check again input data.',
	dataNotAllow: 'Data is not allow',
	notRS: function (id) {
		return 'User ' + id + ' is not RS user';
	},
	idRSMissing: 'ID is missing',
	error: 'Error. Please contact admin',
	yearNotAvailable: 'Year not available!',
	permissionError: 'Permission error!',
	dataNotExit: 'Data not exist!',
	confirmSuccess: 'Confirmed success!',
};

module.exports = RevenusSharing;
