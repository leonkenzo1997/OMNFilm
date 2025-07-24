const companyInformation = {
    notFound: function (id) {
        return 'Not found _id: ' + id + ' in company-information array';
    },

    notFoundDelete: function (id) {
        return 'Not found _id: ' + id + ' in company-information delete array';
    },
    msgDelete: function (id) {
        return 'Deleted successfully _id: ' + id + ' in company-information!!!';
    },
    msgCompleteDelete: function (id) {
        return (
            'Deleted completely _id: ' +
            id +
            ' in company-information successful!!!'
        );
    },
    msgUpdate: function (id) {
        return 'Updated successfully _id ' + id + ' in company-information!!!';
    },
    msgRestore: function (id) {
        return 'Restored successfully _id ' + id + ' in company-information!!!';
    },
    allowedUpdates: ['companyInforContent'],
};

module.exports = companyInformation;
