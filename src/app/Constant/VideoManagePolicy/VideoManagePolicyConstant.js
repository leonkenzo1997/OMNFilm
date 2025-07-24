const videoManagePolicy = {
    notFound: function (id) {
        return 'Not found _id: ' + id + ' in video-manage-policy array';
    },

    notFoundDelete: function (id) {
        return 'Not found _id: ' + id + ' in video-manage-policy delete array';
    },
    msgDelete: function (id) {
        return 'Deleted successfully _id: ' + id + ' in video-manage-policy!!!';
    },
    msgCompleteDelete: function (id) {
        return (
            'Deleted completely _id: ' +
            id +
            ' in video-manage-policy successful!!!'
        );
    },
    msgUpdate: function (id) {
        return 'Updated successfully _id ' + id + ' in video-manage-policy!!!';
    },
    msgRestore: function (id) {
        return 'Restored successfully _id ' + id + ' in video-manage-policy!!!';
    },
    allowedUpdates: ['videoManagePolicyContent'],
};

module.exports = videoManagePolicy;
