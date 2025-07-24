const Background = {
    notFound: function (id) {
        return 'Not found _id: ' + id + ' in Background array';
    },
    notFoundProgram: function (id) {
        return 'Not found _id: ' + id + ' in program';
    },
    notFoundBackgroundVideo: function (id) {
        return 'Not found _id: ' + id + ' in background video';
    },
    notFoundDelete: function (id) {
        return 'Not found _id: ' + id + ' in Background delete array';
    },

    msgDelete: function (id) {
        return 'Deleted successfully _id: ' + id + ' in Background!!!';
    },
    msgDeleteFileVideo: 'Deleted successfully file video trailer!!!',
    msgCompleteDelete: function (id) {
        return 'Deleted completely _id: ' + id + ' in Background successful!!!';
    },

    msgUpdate: function (id) {
        return 'Updated successfully _id ' + id + ' in Background successful!!!';
    },

    msgRestore: function (id) {
        return 'Restored successfully _id ' + id + ' in Background!!!';
    },
    msgAddSuccessful: 'Adding successfully background video!!!',
    msgAddSuccessfulPoster: 'Adding successfully background poster!!!',
    msgLimitBackgroundVideo:
        'Background Video was limit(Only 2 background video). Please delete one background video and you can create new background video!!!',
    allowedUpdates: [],
    errorUpdateBackground: function (id) {
        return 'update id ' + id + 'Background fail!!!';
    },
    fieldSelect:
        'programName programCategory.categoryManageId programType programImagePoster programImagePosterNoTitle userID',
};

module.exports = Background;
