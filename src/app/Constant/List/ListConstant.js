const list = {
	notFound: function (id) {
		return 'Not found _id: ' + id + ' in list array';
	},

	notFoundDelete: function (id) {
		return 'Not found _id: ' + id + ' in list delete array';
	},
	msgDelete: function (id) {
		return 'Deleted successfully _id: ' + id + ' in list!!!';
	},
	msgCompleteDelete: function (id) {
		return 'Deleted completely _id: ' + id + ' in list successful!!!';
	},
	msgUpdate: function (id) {
		return 'Updated successfully _id ' + id + ' in list!!!';
	},
	msgRestore: function (id) {
		return 'Restored successfully _id ' + id + ' in list!!!';
	},
	invalidUpdate: 'Invalid updates!!!',
	allowedUpdates: [
		'listName',
		'listType',
		'listGroup1',
		'listGroup2',
		'listProgramCount',
		'listProgramList',
		'listIsAssign',
		'slugName'
	],
	errorUpdateCategoriesSet: function (id) {
		return 'update id ' + id + 'home set fail!!!';
	},
	updateCategoriesSetSuccess: 'update categoreis set successfull',
	errorUpdateHomeSet: function (id) {
		return 'update id ' + id + 'home set fail!!!';
	},
	updateHomeSetSuccess: 'update home set successfull',
	errorFieldDataListProgramList: 'listProgramList must be array',
};

module.exports = list;
