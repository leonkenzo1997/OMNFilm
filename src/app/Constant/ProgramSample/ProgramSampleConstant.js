const ProgramSample = {
	notFound: function (id) {
		return 'Not found _id: ' + id + ' in Program Sample array';
	},

	notFoundDelete: function (id) {
		return 'Not found _id: ' + id + ' in Program Sample delete array';
	},
	msgDelete: function (id) {
		return 'Deleted successfully _id: ' + id + ' in Program Sample!!!';
	},
	msgCompleteDelete: function (id) {
		return 'Deleted completely _id: ' + id + ' in Program Sample successful!!!';
	},
	msgUpdate: function (id) {
		return 'Updated successfully _id ' + id + ' in Program Sample!!!';
	},
	msgRestore: function (id) {
		return 'Restored successfully _id ' + id + ' in Program Sample!!!';
	},
    limitCreateProgramSample: "The maximum number of documents is 7"
};

module.exports = ProgramSample;
