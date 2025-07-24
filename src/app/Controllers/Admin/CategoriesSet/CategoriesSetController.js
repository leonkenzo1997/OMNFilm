const mongoose = require('mongoose');

const categoriesSetModel = require('../../../Models/CategoriesSet/CategoriesSetModel');
const listModel = require('../../../Models/List/ListModel');
const homeSetModel = require('../../../Models/HomeSet/HomeSetModel');
const businessQuery = require('../../../Business/QueryModel');

const categoriesSetService = require('../../../Service/CategoriesSet/CategoriesSetService');
const homeSetService = require('../../../Service/HomeSet/HomeSetService');

const system = require('../../../Constant/General/SystemConstant');
const categoriesSetConstant = require('../../../Constant/CategoriesSet/CategoriesSetConstant');
const logger = require('../../../Constant/Logger/loggerConstant');
const common = require('../../../Service/common');

class CategoriesSetController {
	// [GET] /admin/categoriesset/list-delete
	async listDelete(request, response, next) {
		const errors = [];
		try {
			const arrayCategoriesSetDelete = await categoriesSetModel.findDeleted({}).sortable(request);
			const totalCategoriesSetDelete = await categoriesSetModel.countDocumentsDeleted();
			const data = {
				totalCategoriesSetDelete,
				arrayCategoriesSetDelete,
			};
			return logger.status200(response, system.success, '', data);
		} catch (error) {
			errors.push(error.message);
			return logger.status500(response, error, errors);
		}
	}

	// [GET] /admin/categoriesset/
	async index(request, response, next) {
		const errors = [];
		try {

			const relations = {
				path: 'categoriesArrayList',
				select: 'listProgramList listProgramCount'
			}
			let arrayCategories = await businessQuery.handle(categoriesSetModel, request, relations);

			arrayCategories.docs = await getLengthListCategorySet(JSON.parse(JSON.stringify(arrayCategories.docs)));
			return logger.status200(response, system.success, '', arrayCategories);
		} catch (error) {
			errors.push(error.message);
			return logger.status500(response, error, errors);
		}
	}

	// [GET] /admin/categoriesset/:id
	async detail(request, response, next) {
		let paramsData = request.params;
		const errors = [];
		try {
			let fieldSelect = [
				'programTypeVideo',
				'programCurrentStatus',
				'programName',
				'programTitle',
				'programImagePosterNoTitle',
				'programSubTitle',
				'programSummary',
			];

			let categoriesSet = await categoriesSetModel.findById({ _id: paramsData.id }).populate({
				path: 'categoriesArrayList',
				populate: {
					path: 'listProgramList',
					select: fieldSelect,
					// match: { isDisplay: true },
				},
			});

			if (!categoriesSet) {
				return logger.status404(response, system.error, categoriesSetConstant.notFound(paramsData.id));
			}

			categoriesSet = getLengthListCategoryDetail(categoriesSet);
			return logger.status200(response, system.success, '', categoriesSet);
		} catch (error) {
			errors.push(error.message);
			return logger.status400(response, error, errors);
		}
	}

	// [GET] /admin/categoriesset/list-delete/:id
	async detailDelete(request, response, next) {
		let paramsData = request.params;
		const errors = [];
		try {
			const categoriesSetDelete = await categoriesSetModel
				.findOneDeleted({ _id: paramsData.id })
				.populate('categoriesArrayList');

			if (!categoriesSetDelete) {
				return logger.status404(response, system.error, categoriesSetConstant.notFound(paramsData.id));
			} else {
				return logger.status200(response, system.success, '', categoriesSetDelete);
			}
		} catch (error) {
			errors.push(error.message);
			return logger.status400(response, error, errors);
		}
	}

	// [POST] /admin/categoriesset/create
	async create(request, response, next) {
		const formData = request.body;
		const errors = [];
		let session = await mongoose.startSession();

		try {
			session.startTransaction();
			let checkDaplicate = {};
			while (checkDaplicate) {
				formData['slugName'] = common.generateSlug(formData.categoriesName);
				checkDaplicate = await categoriesSetModel.findOne({
					slugName: formData['slugName'],
				});
			}
			if (formData.hasOwnProperty('categoriesArrayList')) {
				const dataCategoriesSet = await categoriesSetService.countProgramOfCategories(response, formData);
				const categoriesSet = new categoriesSetModel(dataCategoriesSet);
				await categoriesSet.save({ session: session });
				await session.commitTransaction();
				session.endSession();
				return logger.status201(response, categoriesSet);
			} else {
				const categoriesSet = new categoriesSetModel(formData);
				await categoriesSet.save({ session: session });
				await session.commitTransaction();
				session.endSession();
				return logger.status201(response, categoriesSet);
			}
		} catch (error) {
			await session.abortTransaction();
			session.endSession();
			errors.push(error.message);
			return logger.status400(response, error, errors);
		}
	}

	// [PUT] /admin/categoriesset/:id
	async update(request, response, next) {
		const paramsData = request.params;
		const formData = request.body;
		const errors = [];
		const categoriesSetArrayList = formData.hasOwnProperty('categoriesArrayList');
		const listSetArray = formData.categoriesArrayList;
		let session = await mongoose.startSession();

		try {
			session.startTransaction();

			if (!categoriesSetArrayList) {
				const categoriesSet = await categoriesSetService.findAndUpdateData(
					response,
					paramsData.id,
					formData,
					session
				);

				return logger.status200(
					response,
					system.success,
					categoriesSetConstant.msgUpdate(paramsData.id),
					categoriesSet
				);
			} else {
				if (Array.isArray(listSetArray)) {
					if (listSetArray.length > 0) {
						// const dataCategoriesSet = await categoriesSetService.countProgramOfCategories(
						// 	response,
						// 	formData
						// );

						const dataCategoriesSet = formData
						const categoriesSet = await categoriesSetService.findAndUpdateData(
							response,
							paramsData.id,
							dataCategoriesSet,
							session
						);

						return logger.status200(
							response,
							system.success,
							categoriesSetConstant.msgUpdate(paramsData.id),
							categoriesSet
						);
					} else {
						formData.categoriesListCount = 0;
						const categoriesSet = await categoriesSetService.findAndUpdateData(
							response,
							paramsData.id,
							formData,
							session
						);
						return logger.status200(
							response,
							system.success,
							categoriesSetConstant.msgUpdate(paramsData.id),
							categoriesSet
						);
					}
				} else {
					return logger.status200Msg(
						response,
						system.error,
						categoriesSetConstant.msgHomesetCategoriesListErrorField
					);
				}
			}
		} catch (error) {
			await session.abortTransaction();
			session.endSession();
			errors.push(error.message);
			return logger.status400(response, error, errors);
		}
	}

	// [DELETE] /admin/categoriesset/:id
	async destroy(request, response, next) {
		const paramsData = request.params;
		const errors = [];
		let session = await mongoose.startSession();

		try {
			session.startTransaction();
			const categorySet = await categoriesSetModel.findById(paramsData.id);

			if (!categorySet) {
				session.endSession();
				return logger.status404(response, system.error, categoriesSetConstant.notFound(paramsData.id));
			} else {
				const checkUpdateHomeSet = await homeSetService.updateCountProgramOfHomeSetForOneIdCategoriesSet(
					paramsData.id,
					session
				);
				const msg = {
					deleteSuccess: categoriesSetConstant.msgDelete(paramsData.id),
					updateHomeSet: '',
				};

				if (!checkUpdateHomeSet.isUpdateHomeSetSuccess) {
					msg.updateHomeSet = categoriesSetConstant.errorUpdateHomeSet(checkUpdateHomeSet.idHomeSetFail);
					await session.abortTransaction();
					session.endSession();
					return logger.status200(response, system.error, msg);
				}
				msg.updateHomeSet = categoriesSetConstant.updateHomeSetSuccess;

				const categorySetDelete = await categoriesSetModel
					.delete({
						_id: paramsData.id,
					})
					.session(session);
				if (!categorySetDelete.nModified) {
					await session.abortTransaction();
					session.endSession();
					return logger.status404(response, system.error, categoriesSetConstant.notFound(paramsData.id));
				}
				await session.commitTransaction();
				session.endSession();

				return logger.status200(response, system.success, msg);
			}
		} catch (error) {
			await session.abortTransaction();
			session.endSession();
			errors.push(error.message);
			return logger.status500(response, error, errors);
		}
	}

	// [PATCH] /admin/categoriesset/:id/restore
	async restore(request, response, next) {
		const paramsData = request.params;
		const errors = [];
		let session = await mongoose.startSession();
		try {
			session.startTransaction();
			const categoriesSet = await categoriesSetModel
				.restore({
					_id: paramsData.id,
				})
				.session(session);

			if (!categoriesSet) {
				await session.abortTransaction();
				session.endSession();
				return logger.status404(response, system.error, categoriesSetConstant.notFound(paramsData.id));
			} else {
				await session.commitTransaction();
				session.endSession();
				return logger.status200(response, system.success, categoriesSetConstant.msgRestore(paramsData.id));
			}
		} catch (error) {
			await session.abortTransaction();
			session.endSession();
			errors.push(error.message);
			return logger.status400(response, error, errors);
		}
	}

	// [DELETE] /admin/categoriesset/:id/complete-destroy
	async completeDestroy(request, response, next) {
		const paramsData = request.params;
		const errors = [];
		let session = await mongoose.startSession();
		try {
			session.startTransaction();
			const categoriesSet = await categoriesSetModel.deleteOne({
				_id: paramsData.id,
			});

			if (!categoriesSet) {
				await session.abortTransaction();
				session.endSession();
				return logger.status404(response, system.error, categoriesSetConstant.notFound(paramsData.id));
			}
			await session.commitTransaction();
			session.endSession();
			return logger.status200(response, system.success, categoriesSetConstant.msgCompleteDelete(paramsData.id));
		} catch (error) {
			await session.abortTransaction();
			session.endSession();
			errors.push(error.message);
			return logger.status500(response, error, errors);
		}
	}

	// [GET] /admin/categoriesset/all
	async allList(request, response, next) {
		const errors = [];
		try {
			const arrayCategories = await categoriesSetModel.find(
				{},
				{ categoriesListCount: 1, categoriesName: 1, categoriesID: 1 }
			);
			return logger.status200(response, system.success, '', arrayCategories);
		} catch (error) {
			errors.push(error.message);
			return logger.status500(response, error, errors);
		}
	}

	// [GET] /admin/categoriesset/
	async getListAll(request, response, next) {
		const errors = [];
		try {
			let arrayCategories = await categoriesSetModel.find();

			return logger.status200(response, system.success, '', arrayCategories);
		} catch (error) {
			errors.push(error.message);
			return logger.status500(response, error, errors);
		}
	}
}

// async function getLengthListCategorySet(doc) {
// 	try {
// 		let isArray = Array.isArray(doc);
// 		if (!isArray) {
// 			doc = [doc];
// 		}
// 		let promise = doc.map(async (e) => {
// 			let count = 0;
// 			if (e.categoriesArrayList.length != 0) {
// 				// console.log(e.categoriesArrayList.length)
// 				for (const element of e.categoriesArrayList) {
// 					// console.log(element)
// 					let data = await listModel.findById(element);
// 					// console.log(data);
// 					count += data.toJSON().listProgramCount;
// 				}
// 				// console.log(count)
// 			}
// 			e.categoriesListCount = count;
// 			return e;
// 		});
// 		let data = await Promise.all(promise);
// 		return isArray ? data : data[0];
// 	} catch (error) {
// 		console.error(error);
// 		return doc;
// 	}
// }

async function getLengthListCategorySet(doc) {
	try {
		let isArray = Array.isArray(doc);
		if (!isArray) {
			doc = [doc];
		}
		let promise = doc.map(async (e) => {
			let count = 0;
			if (e.categoriesArrayList.length) {
				e.categoriesArrayList.forEach(element => {
					count += element.listProgramCount;
				})
			}
			e.categoriesListCount = count;
			return e;
		});
		let data = await Promise.all(promise);
		return isArray ? data : data[0];
	} catch (error) {
		console.error(error);
		return doc;
	}
}

function getLengthListCategoryDetail(doc) {
	try {
		let count = 0;
		if (doc.categoriesArrayList.length != 0) {
			for (const e of doc.categoriesArrayList) {
				count += e.listProgramList.length;
			}
		}
		doc.categoriesListCount = count;
		return doc;
	} catch (error) {
		console.error(error);
		return doc;
	}
}

module.exports = new CategoriesSetController();
