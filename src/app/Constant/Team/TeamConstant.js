const team = {
    notFound: function (id) {
        return 'Not found _id: ' + id + ' in team array';
    },

    notFoundDelete: function (id) {
        return 'Not found _id: ' + id + ' in team delete array';
    },
    msgDelete: function (id) {
        return 'Deleted successfully _id: ' + id + ' in team!!!';
    },
    msgCompleteDelete: function (id) {
        return 'Deleted completely _id: ' + id + ' in team successful!!!';
    },
    msgUpdate: function (id) {
        return 'Updated successfully _id ' + id + ' in team!!!';
    },
    msgRestore: function (id) {
        return 'Restored successfully _id ' + id + ' in team!!!';
    },
    allowedUpdates: ['teamName'],
};

module.exports = team;
