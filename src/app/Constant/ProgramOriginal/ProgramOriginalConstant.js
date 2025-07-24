const ProgramOriginal = {
    notFound: function (id) {
        return 'Not found _id: ' + id + ' in Program Original array';
    },

    notFoundDelete: function (id) {
        return 'Not found _id: ' + id + ' in Program Original delete array';
    },
    msgDelete: function (id) {
        return 'Deleted successfully _id: ' + id + ' in Program Original!!!';
    },
    msgCompleteDelete: function (id) {
        return 'Deleted completely _id: ' + id + ' in Program Original successful!!!';
    },
    msgUpdate: function (id) {
        return 'Updated successfully _id ' + id + ' in Program Original!!!';
    },
    msgRestore: function (id) {
        return 'Restored successfully _id ' + id + ' in Program Original!!!';
    },
    idInvalid: 'ID is wrong',
    dataInvalid: 'Data is null',
    parentNotUpdate: 'Parent ID not update',
    programNotUpdate: 'Program status denial not update',
    completeAfterApproval: 'Please complete infomations after approval',
    updateParticipantSuccess: 'Update participants rate success',
    fieldsCreateOriginal: [
        'programName',
        'programImageTitle',
        'programSubTitle',
        'programImagePosterNoTitle',
        'programOriginalPoster',
        'programImagePoster',
        // 'programImageBracter',
        'programSummary',
        'programCategory',
        'programThumbnail',
        'linkVideo',
        'programVideoSetting',
        'programTypeVideo',
        'videoThumbnail',
        // 'previewUpload',
        'participantsRates',
        'remark',
    ],
    fieldsOriginalUpdate: [
        'programName',
        'programImageTitle',
        'programSubTitle',
        'programImagePosterNoTitle',
        'programOriginalPoster',
        'programImagePoster',
        // 'programImageBracter',
        'programSummary',
        'programCategory',
        'programThumbnail',
        'linkVideo',
        'programVideoSetting',
        'videoThumbnail',
        'participantsRates',
        'remark',
    ],
    fieldsAllowUpdate: [
        'programName',
        'programImageTitle',
        'programSubTitle',
        'programImagePosterNoTitle',
        'programOriginalPoster',
        'programImagePoster',
        // 'programImageBracter',
        'programSummary',
        'programCategory',
        'programThumbnail',
        'linkVideo',
        'programVideoSetting',
        'videoThumbnail',
        'participantsRates',
        'remark',
    ],
    fieldsGetList: [
        'programName',
        'programCurrentStatus',
        'createdAt',
        'updatedAt',
        'originalDate',
        'programSeasonData',
        'programTypeVideo',
        'programChildrenSeasonData',
    ],
};

module.exports = ProgramOriginal;
