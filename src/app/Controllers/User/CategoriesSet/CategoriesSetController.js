const categoriesSetModel = require('../../../Models/CategoriesSet/CategoriesSetModel');

const system = require('../../../Constant/General/SystemConstant');
const categoriesSetCodeConstant = require('../../../Constant/CategoriesSet/CategoriesSetConstant');
const logger = require('../../../Constant/Logger/loggerConstant');

class CategoriesSetController {
	// [GET] /user/categories-set/
	async index(request, response, next) {
		const errors = [];
		const selectField = ['_id', 'categoriesName', 'categoriesImageSurvey', 'isSurvey'];
		try {
			const categoriesSetList = await categoriesSetModel.find({ isSurvey: true }).select(selectField).limit(12);
			return logger.status200(response, system.success, '', categoriesSetList);
		} catch (error) {
			errors.push(error.message);
			return logger.status500(response, error, errors);
		}
	}
}

module.exports = new CategoriesSetController();
