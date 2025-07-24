const dept = {
    notFound: function (id) {
        return 'Not found _id: ' + id + ' in dept array';
    },

    notFoundDelete: function (id) {
        return 'Not found _id: ' + id + ' in dept delete array';
    },
    msgDelete: function (id) {
        return 'Deleted successfully _id: ' + id + ' in dept!!!';
    },
    msgCompleteDelete: function (id) {
        return 'Deleted completely _id: ' + id + ' in dept successful!!!';
    },
    msgUpdate: function (id) {
        return 'Updated successfully _id ' + id + ' in dept!!!';
    },
    msgRestore: function (id) {
        return 'Restored successfully _id ' + id + ' in dept!!!';
    },
    allowedUpdates: ['departmentCode', 'departmentName'],
};

module.exports = dept;
