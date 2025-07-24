const bracter = {
	notFound: function (id) {
		return 'Not found _id: ' + id + ' in bracter array';
	},

	notFoundDelete: function (id) {
		return 'Not found _id: ' + id + ' in bracter delete array';
	},

	msgDelete: function (id) {
		return 'Deleted successfully _id: ' + id + ' in bracter!!!';
	},

	msgCompleteDelete: function (id) {
		return 'Deleted completely _id: ' + id + ' in bracter successful!!!';
	},

	msgUpdate: function (id) {
		return 'Updated successfully _id ' + id + ' in bracter successful!!!';
	},

	msgRestore: function (id) {
		return 'Restored successfully _id ' + id + ' in bracter!!!';
	},

	allowedUpdates: [],

	errorUpdateBracter: function (id) {
		return 'update id ' + id + 'bracter fail!!!';
	},
	updateBracterSuccess: 'update bracter successfull',
	programIsExisted: 'Program is existed in category',
	programIdNotFound: 'Program id not found',
	bracterIsExisted: 'Bracter is existed',
	categoryNotFound: 'Category id not found',
};

module.exports = bracter;
