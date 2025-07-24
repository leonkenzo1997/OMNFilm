const SurveyModel = require('../../../Models/Survey/SurveyModel');
const SurveyProgramModel = require('../../../Models/Survey/SurveyProgramModel');
const system = require('../../../Constant/General/SystemConstant');
const logger = require('../../../Constant/Logger/loggerConstant');
class AdminController {
	// [GET] /admin/survey
	async index(request, response, next) {
		const errors = [];
		try {
			const surveys = await SurveyModel.find({});
			return logger.status200(response, system.success, '', { surveys });
		} catch (error) {
			errors.push(error.message);
			return logger.status500(response, error, errors, system.error);
		}
	}

	// [POST] /admin/survey
	async create(request, response, next) {
		const errors = [];
		const body = request.body;
		try {
			await SurveyModel.insertMany(body);
			return logger.status200Msg(response, system.success, system.addDataSuccess);
		} catch (error) {
			errors.push(error.message);
			return logger.status500(response, error, errors, system.error);
		}
	}
}

module.exports = new AdminController();
