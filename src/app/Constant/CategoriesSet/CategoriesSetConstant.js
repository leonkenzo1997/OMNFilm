const categoriesSet = {
	notFound: function (id) {
		return 'Not found _id: ' + id + ' in categories-set array';
	},

	notFoundDelete: function (id) {
		return 'Not found _id: ' + id + ' in categories-set delete array';
	},

	msgDelete: function (id) {
		return 'Deleted successfully _id: ' + id + ' in categories-set!!!';
	},

	msgCompleteDelete: function (id) {
		return 'Deleted completely _id: ' + id + ' in categories-set successful!!!';
	},

	msgUpdate: function (id) {
		return 'Updated successfully _id ' + id + ' in categories-set!!!';
	},

	msgRestore: function (id) {
		return 'Restored successfully _id ' + id + ' in categories-set!!!';
	},

	allowedUpdates: ['categoriesName', 'categoriesListCount', 'categoriesArrayList', 'slugName'],

	errorUpdateHomeSet: function (id) {
		return 'update id ' + id + 'home set fail!!!';
	},
	updateHomeSetSuccess: 'update home set successfull',
};

module.exports = categoriesSet;
