const historyEditProgramModel = require('../../../Models/Program/HistoryEditProgramModel');
const businessQuery = require('../../../Business/QueryModel');

const historyEditProgram = require('../../../Constant/HistoryEditProgram/HistoryEditProgramConstant');
const programModel = require('../../../Models/Program/ProgramModel');
const constants = require('../../../Constant/constants');
const system = require('../../../Constant/General/SystemConstant');
const logger = require('../../../Constant/Logger/loggerConstant');

class HistoryEditProgram {
	// [GET] /offline/history-edit-program/upload/:id
	async indexUpload(request, response, next) {
		const errors = [];
		const params = request.params;
		const userData = request.user;
		const query = request.query;

		request.query.programID = params.id;
		request.query.userID = userData._id;
		request.query.programType = constants.PROGRAM_TYPE.UPLOAD;
		request.query.deleted = false;
		request.query.programCurrentStatus = [
			constants.PROGRAM_STATUS.EDIT,
			constants.PROGRAM_STATUS.REVIEW,
			constants.PROGRAM_STATUS.UPLOAD,
		];
		if (query.isProgramEdit) {
			request.query.isProgramEdit = query.isProgramEdit;
		} else {
			request.query.isProgramEdit = false;
		}
		request.query.limit = 5;

		try {
			const historyEdit = await businessQuery.handle(historyEditProgramModel, request);

			return logger.status200(response, system.success, '', historyEdit);
		} catch (error) {
			errors.push(error.message);
			return logger.status500(response, error, errors);
		}
	}

	// [GET] /offline/history-edit-program/:id
	async detailHistory(request, response, next) {
		const errors = [];
		const params = request.params;
		const result = {
			isSeason: true,
			isChildren: true,
			data: '',
		};
		try {
			let historyEdit = await historyEditProgramModel.findOne({
				_id: params.id,
			});

			if (!historyEdit) {
				return logger.status404(response, system.error, historyEditProgram.notFound(params.id));
			}

			historyEdit = JSON.parse(JSON.stringify(historyEdit));

			if (historyEdit.programTypeVideo === constants.TYPE_VIDEO.SS) {
				const programParent = await programModel
					.findOne({
						_id: historyEdit.programChildrenSeasonData.parentID,
						programTypeVideo: constants.TYPE_VIDEO.SS,
					})
					.populate({
						path: 'programSeasonData.episode',
						select: [
							'deleted',
							'programCurrentStatus',
							'videoThumbnail',
							'programChildrenSeasonData.seasonName',
							'programChildrenSeasonData.episodeName',
							'programChildrenSeasonData.episodeSummary',
							'programChildrenSeasonData.linkVideo'
						],
						match: {
							// programCurrentStatus: { $ne: constants.PROGRAM_STATUS.DELETE },
							deleted: false
						}
					})
					.lean();
				const dataProgramParent = JSON.parse(JSON.stringify(programParent));

				dataProgramParent.programSeasonData.forEach((season) => {
					season.episode = season.episode.map((episode) => {
						return {
							...episode.programChildrenSeasonData,
							_id: episode._id,
							videoThumbnail: episode.videoThumbnail,
						};
					});
				});
				historyEdit.programSeasonData = dataProgramParent.programSeasonData;
				result.data = historyEdit;
			}
			if (historyEdit.programTypeVideo === constants.TYPE_VIDEO.SA) {
				result.isChildren = false;
				result.isSeason = false;
				result.data = historyEdit;
			}

			return logger.status200(response, system.success, '', result);
		} catch (error) {
			errors.push(error.message);
			return logger.status500(response, error, errors);
		}
	}

	// [GET] /offline/history-edit-program/challenger/:id
	async indexChallenger(request, response, next) {
		const errors = [];
		const params = request.params;
		const userData = request.user;
		const query = request.query;
		request.query.programID = params.id;
		request.query.userID = userData._id;
		request.query.programType = constants.PROGRAM_TYPE.CHALLENGER;
		request.query.deleted = false;
		request.query.programCurrentStatus = [
			constants.PROGRAM_STATUS.EDIT,
			constants.PROGRAM_STATUS.REVIEW,
			constants.PROGRAM_STATUS.UPLOAD,
		];
		if (query.isProgramEdit) {
			request.query.isProgramEdit = query.isProgramEdit;
		} else {
			request.query.isProgramEdit = false;
		}

		try {
			const historyEdit = await businessQuery.handle(historyEditProgramModel, request);

			return logger.status200(response, system.success, '', historyEdit);
		} catch (error) {
			errors.push(error.message);
			return logger.status500(response, error, errors);
		}
	}
}

module.exports = new HistoryEditProgram();
