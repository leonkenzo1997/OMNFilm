const tag = {
    notFound: function (id) {
        return 'Not found _id: ' + id + ' in tag array';
    },

    notFoundDelete: function (id) {
        return 'Not found _id: ' + id + ' in tag delete array';
    },
    msgDelete: function (id) {
        return 'Deleted successfully _id: ' + id + ' in tag!!!';
    },
    msgCompleteDelete: function (id) {
        return 'Deleted completely _id: ' + id + ' in tag successful!!!';
    },
    msgUpdate: function (id) {
        return 'Updated successfully _id ' + id + ' in tag!!!';
    },
    msgRestore: function (id) {
        return 'Restored successfully _id ' + id + ' in tag!!!';
    },
    allowedUpdates: ['tagName', 'tagUsage'],
    errorCreate: 'create tag fail!!!'
};

module.exports = tag;
