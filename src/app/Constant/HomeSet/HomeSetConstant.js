const homeSet = {
    notFound: function (id) {
        return 'Not found _id: ' + id + ' in home-set array';
    },

    notFoundDelete: function (id) {
        return 'Not found _id: ' + id + ' in home-set delete array';
    },
    msgDelete: function (id) {
        return 'Deleted successfully _id: ' + id + ' in home-set!!!';
    },
    msgCompleteDelete: function (id) {
        return 'Deleted completely _id: ' + id + ' in home-set successful!!!';
    },
    msgUpdate: function (id) {
        return 'Updated successfully _id ' + id + ' in home-set!!!';
    },
    msgRestore: function (id) {
        return 'Restored successfully _id ' + id + ' in home-set!!!';
    },
    msgCreate: 'Create successfully home-set',
    allowedUpdates: [
        'homesetName',
        'homesetListCount',
        'homesetCategoriesList',
        'homesetMon',
        'homesetTue',
        'homesetWed',
        'homesetThu',
        'homesetFri',
        'homesetSat',
        'homesetSun',
        'homesetTimeStart',
        'homesetTimeEnd',
        'slugName'
    ],
    msgHomesetCategoriesListErrorField: "homesetCategoriesList must be Array!!!!"
};

module.exports = homeSet;
