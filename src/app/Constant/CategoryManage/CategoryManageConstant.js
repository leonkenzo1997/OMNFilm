const category = {
    notFound: function (id) {
        return 'Not found _id: ' + id + ' in category array';
    },

    notFoundDelete: function (id) {
        return 'Not found _id: ' + id + ' in category delete array';
    },

    msgDelete: function (id) {
        return 'Deleted successfully _id: ' + id + ' in category!!!';
    },

    msgCompleteDelete: function (id) {
        return (
            'Deleted completely _id: ' + id + ' in category successful!!!'
        );
    },

    msgUpdate: function (id) {
        return 'Updated successfully _id ' + id + ' in category!!!';
    },

    msgRestore: function (id) {
        return 'Restored successfully _id ' + id + ' in category!!!';
    },

    allowedUpdates: [
        'categoryMangeName',
        'categoryMangeUsage',
        'categoryMangeArrayTag',
    ],
    errorCreate: 'create category manage fail!!!'
};

module.exports = category;
