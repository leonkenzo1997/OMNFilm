const ProductSupportSample = {
	notFound: function (id) {
		return 'Not found _id: ' + id + ' in Product Support Sample array';
	},

	notFoundDelete: function (id) {
		return 'Not found _id: ' + id + ' in Product Support Sample delete array';
	},
	msgDelete: function (id) {
		return 'Deleted successfully _id: ' + id + ' in Product Support Sample!!!';
	},
	msgCompleteDelete: function (id) {
		return 'Deleted completely _id: ' + id + ' in Product Support Sample successful!!!';
	},
	msgUpdate: function (id) {
		return 'Updated successfully _id ' + id + ' in Product Support Sample!!!';
	},
	msgRestore: function (id) {
		return 'Restored successfully _id ' + id + ' in Product Support Sample!!!';
	},
	limitProductSupportSample: 'The maximum number of documents is 7',
};

module.exports = ProductSupportSample;
