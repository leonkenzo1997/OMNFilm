const mongoose = require('mongoose');
const homeSetModel = require('../../Models/HomeSet/HomeSetModel');

const logger = require('../../Constant/Logger/loggerConstant');
const categoriesSetConstant = require('../../Constant/CategoriesSet/CategoriesSetConstant');
const system = require('../../Constant/General/SystemConstant');
const homeSetConstant = require('../../Constant/HomeSet/HomeSetConstant');

const categoriesSetService = require('../../Service/CategoriesSet/CategoriesSetService');

const homeSet = {
	findById: async function (id) {
		const homeSetData = await homeSetModel.findById({ _id: id });
		return homeSetData;
	},
	findAndUpdateData: async function (response, id, data, session) {
		const errors = [];
		try {
			const homeSet = await homeSetModel.findByIdAndUpdate(
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

			if (!homeSet) {
				await session.abortTransaction();
				session.endSession();
				return logger.status404(response, system.error, homeSetConstant.notFound(id));
			}

			await session.commitTransaction();
			session.endSession();

			return homeSet;
		} catch (error) {
			await session.abortTransaction();
			session.endSession();

			errors.push(error.message);
			return logger.status400(response, error, errors);
		}
	},

	updateCountProgramOfHomeSet: async function (idCategoriesSetArray, session) {
		let isUpdateHomeSetSuccess = true;
		let isAllItemsUpdateSuccess = true;
		let result = {
			isUpdateHomeSetSuccess,
			isAllItemsUpdateSuccess,
			idHomeSetFail: '',
		};

		try {
			for (let i = 0; i < idCategoriesSetArray.length; i++) {
				let idCategoriesSet = idCategoriesSetArray[i];

				// find list categories contain id_list are deleted
				const homeSetList = await homeSetModel.find({
					homesetCategoriesList: idCategoriesSet._id,
				});

				for (let k = 0; k < homeSetList.length; k++) {
					let item = homeSetList[k];

					const arrayHomeSet = item.homesetCategoriesList;
					item.homesetListCount = 0;

					for (let idCategoriesSet of arrayHomeSet) {
						const dataList = await categoriesSetService.findById(idCategoriesSet);
						item.homesetListCount += dataList ? dataList.categoriesListCount : 0;
					}

					// save
					const checkUpdate = await item.save({ session: session });

					if (!checkUpdate) {
						isAllItemsUpdateSuccess = false;
						isUpdateHomeSetSuccess = false;
						result.idHomeSetFail = item._id;
						break;
					}
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

	updateCountProgramOfHomeSetForOneIdCategoriesSet: async function (idCategoriesSet, session) {
		let isUpdateHomeSetSuccess = true;
		let isAllItemsUpdateSuccess = true;
		let result = {
			isUpdateHomeSetSuccess,
			isAllItemsUpdateSuccess,
			idHomeSetFail: '',
		};
		try {
			// find list homeset contain id_categoriesSet are deleted
			const homeSetList = await homeSetModel.find({
				homesetCategoriesList: idCategoriesSet,
			});

			for (let k = 0; k < homeSetList.length; k++) {
				let item = homeSetList[k];

				const arrayHomeSet = item.homesetCategoriesList;
				item.homesetListCount = 0;

				for (let idCategoriesSet of arrayHomeSet) {
					const dataList = await categoriesSetService.findById(idCategoriesSet);
					item.homesetListCount += dataList ? dataList.categoriesListCount : 0;
				}

				// save
				const checkUpdate = await item.save({ session: session });

				if (!checkUpdate) {
					isAllItemsUpdateSuccess = false;
					isUpdateHomeSetSuccess = false;
					result.idHomeSetFail = item._id;
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

	countProgramOfHomeSet: async function (response, data) {
		const arrayHomeSet = data.homesetCategoriesList;
		data.homesetListCount = 0;

		for (var idCategories of arrayHomeSet) {
			const dataCategoriesSet = await categoriesSetService.findById(idCategories);

			if (dataCategoriesSet) {
				data.homesetListCount += dataCategoriesSet.categoriesListCount;
			} else {
				return logger.status404(response, system.error, categoriesSetConstant.notFound(idCategories));
			}
		}

		return data;
	},
};

module.exports = homeSet;
