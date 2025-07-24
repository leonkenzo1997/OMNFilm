const membership = {
    notFound: function (id) {
        return 'Not found _id: ' + id + ' in membership array';
    },

    notFoundDelete: function (id) {
        return 'Not found _id: ' + id + ' in membership delete array';
    },
    msgDelete: function (id) {
        return 'Deleted successfully _id: ' + id + ' in membership!!!';
    },
    msgCompleteDelete: function (id) {
        return 'Deleted completely _id: ' + id + ' in membership successful!!!';
    },
    msgUpdate: function (id) {
        return 'Updated successfully _id ' + id + ' in membership!!!';
    },
    msgRestore: function (id) {
        return 'Restored successfully _id ' + id + ' in membership!!!';
    },
    allowedUpdates: [
        'packageName',
        'fee',
        'sd',
        'hd',
        'preview',
        'unlimitedPreviewVideo',
        'deactivate',
        'membershipDescription',
    ],
};
module.exports = membership;
