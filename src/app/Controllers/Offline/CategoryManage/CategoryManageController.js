const categoryManageModel = require('../../../Models/Manage/CategoryManage/CategoryManageModel');

const system = require('../../../Constant/General/SystemConstant');
const logger = require('../../../Constant/Logger/loggerConstant');

const categoryManageConstant = require('../../../Constant/CategoryManage/CategoryManageConstant');

class CategoryManageController {
	// [GET] /offline/manage/category-manage/
	async index(request, response, next) {
		const errors = [];
		try {
			const fieldsSelect = [
				'tagName',
				'_id'
			];
			const arrayCategoryManage = await categoryManageModel
				.find({ categoryMangeUsage: true })
				.populate({
					path: 'categoryMangeArrayTag',
					select: fieldsSelect,
				});
			const totalCategoryManage = await categoryManageModel.countDocuments({
				categoryMangeUsage: true
			});
			const data = {
				totalCategoryManage,
				arrayCategoryManage,
			};
			return logger.status200(response, system.success, '', data);
		} catch (error) {
			errors.push(error.message);
			return logger.status500(response, error, errors);
		}
	}

	// [GET] /offline/manage/category-manage/:id
	async detail(request, response, next) {
		const paramsData = request.params;
		const errors = [];
		try {
			const fieldsSelect = ['tagName', '_id'];
			const category = await categoryManageModel
				.findById({
					_id: paramsData.id,
				})
				.populate({
					path: 'categoryMangeArrayTag',
					select: fieldsSelect,
				});
			if (!category) {
				return logger.status404(
					response,
					system.error,
					categoryManageConstant.notFound(paramsData.id)
				);
			} else {
				return logger.status200(response, system.success, '', category);
			}
		} catch (error) {
			errors.push(error.message);
			return logger.status400(response, error, errors);
		}
	}
}

module.exports = new CategoryManageController();
