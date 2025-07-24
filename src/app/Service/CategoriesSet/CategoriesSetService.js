const mongoose = require('mongoose');
const categoriesSetModel = require('../../Models/CategoriesSet/CategoriesSetModel');

const logger = require('../../Constant/Logger/loggerConstant');
const categoriesSetConstant = require('../../Constant/CategoriesSet/CategoriesSetConstant');
const system = require('../../Constant/General/SystemConstant');
const listConstant = require('../../Constant/List/ListConstant');

const listService = require('../../Service/List/ListService');

const categoriesSet = {
	findById: async function (id) {
		const categoriesSetData = await categoriesSetModel.findById({
			_id: id,
		});
		return categoriesSetData;
	},
	findAndUpdateData: async function (response, id, data, session) {
		const errors = [];
		try {
			const categoriesSet = await categoriesSetModel.findByIdAndUpdate(
				{
					_id: id,
				},
				data,
				{
					new: true,
					runValidators: true,
					session: session,
				}
			);

			if (!categoriesSet) {
				await session.abortTransaction();
				session.endSession();
				return logger.status404(response, system.error, categoriesSetConstant.notFound(id));
			}
			await session.commitTransaction();
			session.endSession();
			return categoriesSet;
		} catch (error) {
			await session.abortTransaction();
			session.endSession();
			errors.push(error.message);
			return logger.status400(response, error, errors);
		}
	},
	countProgramOfCategories: async function (response, data) {
		const arrayList = data.categoriesArrayList;
		data.categoriesListCount = 0;

		for (var idList of arrayList) {
			const dataList = await listService.findById(idList);
			if (dataList) {
				data.categoriesListCount += dataList.listProgramCount;
			} else {
				return logger.status404(response, system.error, listConstant.notFound(paramsData.id));
			}
		}

		return data;
	},

	updateProgramOfCategoriesSet: async function (idListDeleted, session) {
		let isUpdateCategoriesSetSuccess = true;
		let isAllItemsUpdateSuccess = true;
		let result = {
			isUpdateCategoriesSetSuccess,
			isAllItemsUpdateSuccess,
			idCategoriesSetFail: '',
			arrayCategoriesSet: [],
		};
		try {
			// find list categories contain id_list are deleted
			const categoryList = await categoriesSetModel.find({
				categoriesArrayList: idListDeleted,
			});

			result.arrayCategoriesSet = categoryList;
			for (let i = 0; i < categoryList.length; i++) {
				const item = categoryList[i];

				// then remove id_list in categoriesArrayList
				const newCategoriesArrayList = item.categoriesArrayList.filter((list) => list != idListDeleted);

				// updating categoriesArrayList of categoriesSet
				item.categoriesArrayList = newCategoriesArrayList;
				const arrayList = item.categoriesArrayList;
				item.categoriesListCount = 0;
				for (let idList of arrayList) {
					const dataList = await listService.findById(idList);
					item.categoriesListCount += dataList ? dataList.listProgramCount : 0;
				}

				// save
				const checkUpdate = await item.save();

				if (!checkUpdate) {
					isAllItemsUpdateSuccess = false;
					isUpdateCategoriesSetSuccess = false;
					result.idCategoriesSetFail = item._id;
					break;
				}
			}

			return result;
		} catch (error) {
			await session.abortTransaction();
			session.endSession();

			errors.push(error.message);
			return logger.status400(response, error, errors);
		}
	},
};

module.exports = categoriesSet;
