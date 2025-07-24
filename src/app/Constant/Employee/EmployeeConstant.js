const employee = {
    notFound: function (id) {
        return 'Not found _id: ' + id + ' in employee array';
    },

    notFoundDelete: function (id) {
        return 'Not found _id: ' + id + ' in employee delete array';
    },
    msgDelete: function (id) {
        return 'Deleted successfully _id: ' + id + ' in employee!!!';
    },
    msgCompleteDelete: function (id) {
        return 'Deleted completely _id: ' + id + ' in employee successful!!!';
    },
    msgUpdate: function (id) {
        return 'Updated successfully _id ' + id + ' in employee!!!';
    },
    msgRestore: function (id) {
        return 'Restored successfully _id ' + id + ' in employee!!!';
    },
    allowedUpdates: ['employeeName'],
    createEmployee: [
        'userName',
        'userEmail',
        'userPassword',
        'userGender',
        'userDOB',
        'phoneNumber',
        'idAreaCode',
        'areaCode',
        'userDept',
        'userTeam',
        'userEmployee',
        'userUsage'
    ],
    errorCreate: 'create employee fail!!!',
};

module.exports = employee;
