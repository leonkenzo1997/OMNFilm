const privacyPolicy = {
    notFound: function (id) {
        return 'Not found _id: ' + id + ' in privacy-policy array';
    },

    notFoundDelete: function (id) {
        return 'Not found _id: ' + id + ' in privacy-policy delete array';
    },
    msgDelete: function (id) {
        return 'Deleted successfully _id: ' + id + ' in privacy-policy!!!';
    },
    msgCompleteDelete: function (id) {
        return (
            'Deleted completely _id: ' + id + ' in privacy-policy successful!!!'
        );
    },
    msgUpdate: function (id) {
        return 'Updated successfully _id ' + id + ' in privacy-policy!!!';
    },
    msgRestore: function (id) {
        return 'Restored successfully _id ' + id + ' in privacy-policy!!!';
    },
    allowedUpdates: ['privacyPolicyContent'],
};

module.exports = privacyPolicy;
