const upload = {
	notFound: function (id) {
		return 'Not found id: ' + id + ' in upload!!!';
	},
	notFoundOldVersion: function (idOldVersion, idProgram) {
		return (
			'Not found ' +
			idOldVersion +
			'old version of program id' +
			idProgram +
			'. Please choose old version of program again'
		);
	},
	msgDeleteUpload: function (id) {
		return 'Deleted successfully _id: ' + id + ' in upload!!!';
	},
	msgUpdateSuccess: function (id) {
		return 'Updated successfully _id ' + id + ' !!!';
	},
	msgUpdateUpload: function (id) {
		return 'Updated successfully _id ' + id + ' in upload!!!';
	},
	permissionError: 'Permission error, please contact admin',
	errorUpdate: 'Updated fail, please contact admin!!!',
	msgProgram: 'Program in process',
	msgEditStatus: 'Status is edit!',
	invalidData: 'Data invalid, please check again',

	fieldsCreate: [
		'_id',
		'programName',
		'programImageTitle',
		'programSubTitle',
		'programImagePoster',
		'programImagePosterNoTitle',
		'programSummary',
		'programCategory',
		'programElement',
		'programParticipants',
		'programThumbnail',
		'programVideoSetting',
		'programMusicInfo',
		'programEpisodeSummary',
		'programChildrenSeasonData',
		'linkVideo',
		'programTypeVideo',
		'videoThumbnail',
		'totalTime'
	],
	fieldsCreateStandAlone: [
		'programName',
		'programImageTitle',
		'programSubTitle',
		'programImagePosterNoTitle',
		'programImagePoster',
		'programSummary',
		'programCategory',
		'programElement',
		'programParticipants',
		'programThumbnail',
		'programMusicInfo',
		'programEpisodeSummary',
		'linkVideo',
		'programVideoSetting',
		'programTypeVideo',
		'videoThumbnail',
		'totalTime'
	],
	fieldsUpload: [
		'programName',
		'programImageTitle',
		'programSubTitle',
		'programImagePoster',
		'programImagePosterNoTitle',
		'programSummary',
		'programCategory',
		'programElement',
		'programParticipants',
		'programThumbnail',
		'programVideoSetting',
		'programMusicInfo',
		'programEpisodeSummary',
		'programChildrenSeasonData',
		'linkVideo',
		'videoThumbnail',
		'totalTime'
	],
	fieldsUploadStandAlone: [
		'programName',
		'programImageTitle',
		'programSubTitle',
		'programImagePosterNoTitle',
		'programImagePoster',
		'programSummary',
		'programCategory',
		'programElement',
		'programParticipants',
		'programThumbnail',
		'programMusicInfo',
		'programEpisodeSummary',
		'linkVideo',
		'programVideoSetting',
		'videoThumbnail',
		'totalTime'
	],
};
module.exports = upload;
