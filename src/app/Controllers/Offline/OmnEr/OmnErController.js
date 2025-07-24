const programModel = require('../../../Models/Program/ProgramModel');
const historyProgramModel = require('../../../Models/Program/HistoryProgramModel');
const system = require('../../../Constant/General/SystemConstant');
const logger = require('../../../Constant/Logger/loggerConstant');

const businessQuery = require('../../../Business/QueryModel');
const constants = require('../../../Constant/constants');
const programConstant = require('../../../Constant/Program/ProgramConstant');

class OmnErController {
	// [GET] /offline/omner/omniverse/
	async omniverse(request, response, next) {
		const userData = request.user;
		const errors = [];
		try {
			request.query.userID = userData._id;
			request.query.typeProgram = [
				constants.PROGRAM_TYPE.PRODUCTION_SUPPORT,
				constants.PROGRAM_TYPE.SEFT_PRODUCTION,
			];
			const programs = await businessQuery.handle(
				programModel,
				request,
				null,
				programConstant.FIELD_SELECT_PROGRAM_HOME
			);
			return logger.status200(response, system.success, '', programs);
		} catch (error) {
			errors.push(error.message);
			return logger.status500(response, error, errors);
		}
	}

	// [GET] /offline/omner/result-letter
	async resultLetter(request, response, next) {
		const userData = request.user;
		const params = request.query;
		const errors = [];
		try {
			let programs = [];

			if (!params.programID) {
				programs = await programModel.distinct('_id', {
					userID: userData._id,
					programType: constants.PROGRAM_TYPE.UPLOAD
				});
			} else {
				programs = [params.programID];
			}

			request.query.programID = {
				$in: programs,
			};
			let result = await businessQuery.handle(historyProgramModel, request, { path: 'programID', select: 'programImageTitleResize1' });
			
			result = JSON.parse(JSON.stringify(result))

			result.docs.forEach(item=> {
				item.thumbnail = item?.programID?.programImageTitleResize1 || constants.DEFAULT_THUMNAIL
				delete item.programID
			})
			return logger.status200(response, system.success, '', result);
		} catch (error) {
			errors.push(error.message);
			return logger.status500(response, error, errors);
		}
	}

	// [GET] /offline/omner/result-letter
	async detailResultLetter(request, response, next) {
		const params = request.params;
		const errors = [];
		try {
			const resultLetter = await historyProgramModel.findOne({ _id: params.id }).populate({ path: 'programID', select: 'programImageTitleResize1' }).lean();
			
			resultLetter.thumbnail = resultLetter?.programID?.programImageTitleResize1 || constants.DEFAULT_THUMNAIL
			delete resultLetter.programID
			return logger.status200(response, system.success, '', resultLetter);
		} catch (error) {
			errors.push(error.message);
			return logger.status500(response, error, errors);
		}
	}

	// [GET] /offline/omner/my-program/
	async myProgram(request, response, next) {
		const userData = request.user;
		const errors = [];
		try {
			request.query.userID = userData._id;
			request.query.programType = [
				constants.PROGRAM_TYPE.CHALLENGER,
				constants.PROGRAM_TYPE.UPLOAD
			];
			const programs = await businessQuery.handle(
				programModel,
				request,
				null,
				programConstant.FIELD_SELECT_PROGRAM_HOME
			);
			return logger.status200(response, system.success, '', programs);
		} catch (error) {
			errors.push(error.message);
			return logger.status500(response, error, errors);
		}
	}
}

module.exports = new OmnErController();
