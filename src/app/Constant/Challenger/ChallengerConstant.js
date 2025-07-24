const challenger = {
	notFound: function (id) {
		return 'Not found _id: ' + id + ' in challenger array';
	},

	notFoundDelete: function (id) {
		return 'Not found _id: ' + id + ' in challenger delete array';
	},
	msgDelete: function (id) {
		return 'Deleted successfully _id: ' + id + ' in challenger!!!';
	},
	msgCompleteDelete: function (id) {
		return 'Deleted completely _id: ' + id + ' in challenger successful!!!';
	},
	msgUpdate: function (id) {
		return 'Updated successfully _id ' + id + ' in challenger!!!';
	},
	msgRestore: function (id) {
		return 'Restored successfully _id ' + id + ' in challenger!!!';
	},
	permissionError: 'Permission error, please contact admin',
	errorUpdate: 'Error, please contact admin',
	msgProgram: 'Program in process',
	msgEditStatus: 'Status is edit!',
	errorCreate: 'create fail!!!',

	fieldsValidate: [
		'_id',
		'programName',
		'programImageTitle',
		'programSubTitle',
		'programImagePoster',
		'programImagePosterNoTitle',
		'programImageBracter',
		'programSummary',
		'programCategory',
		'programElement',
		'programParticipants',
		'programTypeVideo',
		'programThumbnail',
		'programVideoSetting',
		'programMusicInfo',
		'programEpisodeSummary',
		'programChildrenSeasonData',
		'linkVideo',
		'totalTime'
	],
	fieldsValidateStandAlone: [
		'programName',
		'programImageTitle',
		'programSubTitle',
		'programImagePoster',
		'programImagePosterNoTitle',
		'programImageBracter',
		'programSummary',
		'programCategory',
		'programElement',
		'programParticipants',
		'programTypeVideo',
		'programThumbnail',
		'programVideoSetting',
		'programMusicInfo',
		'programEpisodeSummary',
		'linkVideo',
		'totalTime'
	],
};

module.exports = challenger;
