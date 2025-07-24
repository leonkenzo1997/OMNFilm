const areaCode = {
    notFound: function (id) {
        return 'Not found _id: ' + id + ' in area-code array';
    },

    notFoundDelete: function (id) {
        return 'Not found _id: ' + id + ' in area-code delete array';
    },
    msgDelete: function (id) {
        return 'Deleted successfully _id: ' + id + ' in area-code!!!';
    },
    msgCompleteDelete: function (id) {
        return 'Deleted completely _id: ' + id + ' in area-code successful!!!';
    },
    msgUpdate: function (id) {
        return 'Updated successfully _id ' + id + ' in area-code!!!';
    },
    msgRestore: function (id) {
        return 'Restored successfully _id ' + id + ' in area-code!!!';
    },
    allowedUpdates: [
        'name',
        'domain',
        'language',
        'capital',
        'nativeName',
        'alpha2Code',
        'alpha3Code',
        'areaCode',
        'region',
        'subregion',
        'cioc',
        'flag',
        'flagBase64',
    ],
};

module.exports = areaCode;
