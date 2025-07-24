const termsAndConditions = {
    notFound: function (id) {
        return 'Not found _id: ' + id + ' in terms-and-conditions array';
    },

    notFoundDelete: function (id) {
        return 'Not found _id: ' + id + ' in terms-and-conditions delete array';
    },
    msgDelete: function (id) {
        return (
            'Deleted successfully _id: ' + id + ' in terms-and-conditions!!!'
        );
    },
    msgCompleteDelete: function (id) {
        return (
            'Deleted completely _id: ' +
            id +
            ' in terms-and-conditions successful!!!'
        );
    },
    msgUpdate: function (id) {
        return 'Updated successfully _id ' + id + ' in terms-and-conditions!!!';
    },
    msgRestore: function (id) {
        return (
            'Restored successfully _id ' + id + ' in terms-and-conditions!!!'
        );
    },
    allowedUpdates: ['termsAndConditionsContent'],
};

module.exports = termsAndConditions;
