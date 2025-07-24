const challengerProgram = {
    notFound: function (id) {
        return 'Not found _id: ' + id + ' in challenger-program array';
    },

    notFoundDelete: function (id) {
        return 'Not found _id: ' + id + ' in challenger-program delete array';
    },
    msgDelete: function (id) {
        return 'Deleted successfully _id: ' + id + ' in challenger-program!!!';
    },
    msgCompleteDelete: function (id) {
        return (
            'Deleted completely _id: ' +
            id +
            ' in challenger-program successful!!!'
        );
    },
    msgUpdate: function (id) {
        return 'Updated successfully _id ' + id + ' in challenger-program!!!';
    },
    msgRestore: function (id) {
        return 'Restored successfully _id ' + id + ' in challenger-program!!!';
    },
    msgCreate: 'Create successfully challenger-program',
    errorUpdate: 'Update fail, please contact admin!!!',
    invalidData: 'Data invalid,please check again',
};

module.exports = challengerProgram;
