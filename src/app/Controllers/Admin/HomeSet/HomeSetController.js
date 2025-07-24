const mongoose = require('mongoose');

const homeSetModel = require('../../../Models/HomeSet/HomeSetModel');
const categorySetModel = require('../../../Models/CategoriesSet/CategoriesSetModel');
const listModel = require('../../../Models/List/ListModel');
const businessQuery = require('../../../Business/QueryModel');

const homeSetService = require('../../../Service/HomeSet/HomeSetService');

const system = require('../../../Constant/General/SystemConstant');
const homeSetConstant = require('../../../Constant/HomeSet/HomeSetConstant');
const logger = require('../../../Constant/Logger/loggerConstant');
const common = require('../../../Service/common');

class HomeSetController {
	// [GET] /admin/homeset/
	async index(request, response, next) {
		const errors = [];
		try {
			const relations = {
				path: 'homesetCategoriesList',
				populate: {
					path: 'categoriesArrayList',
				},
			};

			let arrayHomeSet = await businessQuery.handle(homeSetModel, request, relations);

			arrayHomeSet.docs = await getCountHomeSet(JSON.parse(JSON.stringify(arrayHomeSet.docs)));

			return logger.status200(response, system.success, '', arrayHomeSet);
		} catch (error) {
			errors.push(error.message);
			return logger.status500(response, error, errors);
		}
	}

	// [GET] /admin/homset/:id
	async detail(request, response, next) {
		const paramsData = request.params;
		const errors = [];
		try {
			let homeSet = await homeSetModel.findById(paramsData.id).populate({
				path: 'homesetCategoriesList',
				populate: {
					path: 'categoriesArrayList',
				},
			});

			if (!homeSet) {
				return logger.status404(response, system.error, homeSetConstant.notFound(paramsData.id));
			}

			homeSet = await getCountHomeSetDetail(JSON.parse(JSON.stringify(homeSet)));
			return logger.status200(response, system.success, '', homeSet);
		} catch (error) {
			errors.push(error.message);
			return logger.status400(response, error, errors);
		}
	}

	// [POST] /admin/homeset/create
	async create(request, response, next) {
		const formData = request.body;
		const errors = [];
		let session = await mongoose.startSession();

		try {
			session.startTransaction();
			let checkDaplicate = {};
			while (checkDaplicate) {
				formData['slugName'] = common.generateSlug(formData.homesetName);
				checkDaplicate = await homeSetModel.findOne({
					slugName: formData['slugName'],
				});
			}
			if (formData.hasOwnProperty('homesetCategoriesList')) {
				const dataHomeSet = await homeSetService.countProgramOfHomeSet(response, formData);
				const homeSet = new homeSetModel(dataHomeSet);
				const createHomeset = await homeSet.save({ session: session });
				await session.commitTransaction();
				session.endSession();
				return logger.status201(response, createHomeset);
			} else {
				const homeSet = new homeSetModel(formData);
				const createHomeset = await homeSet.save({ session: session });
				await session.commitTransaction();
				session.endSession();
				return logger.status201(response, createHomeset);
			}
		} catch (error) {
			await session.abortTransaction();
			session.endSession();
			errors.push(error.message);
			return logger.status400(response, error, errors);
		}
	}

	// [PUT] /admin/homset/:id
	async update(request, response, next) {
		const paramsData = request.params;
		const formData = request.body;
		const errors = [];
		const homesetCategoriesList = formData.hasOwnProperty('homesetCategoriesList');
		const categoriesSetArray = formData.homesetCategoriesList;
		let session = await mongoose.startSession();
		session.startTransaction();

		try {
			if (!homesetCategoriesList) {
				const homeSet = await homeSetService.findAndUpdateData(response, paramsData.id, formData, session);

				return logger.status200(response, system.success, homeSetConstant.msgUpdate(paramsData.id), homeSet);
			} else {
				if (Array.isArray(categoriesSetArray)) {
					if (categoriesSetArray.length > 0) {
						// const dataHomeSet = await homeSetService.countProgramOfHomeSet(response, formData);
						const dataHomeSet = formData;

						const homeSet = await homeSetService.findAndUpdateData(
							response,
							paramsData.id,
							dataHomeSet,
							session
						);

						return logger.status200(
							response,
							system.success,
							homeSetConstant.msgUpdate(paramsData.id),
							homeSet
						);
					} else {
						formData.homesetListCount = 0;
						const homeSet = await homeSetService.findAndUpdateData(
							response,
							paramsData.id,
							formData,
							session
						);

						return logger.status200(
							response,
							system.success,
							homeSetConstant.msgUpdate(paramsData.id),
							homeSet
						);
					}
				} else {
					return logger.status200Msg(
						response,
						system.error,
						homeSetConstant.msgHomesetCategoriesListErrorField
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

	// [DELETE] /admin/homset/:id
	async destroy(request, response, next) {
		// response.send('Deleted successfully categories!!!!');
		const paramsData = request.params;
		const errors = [];
		let session = await mongoose.startSession();
		try {
			session.startTransaction();
			const homeSet = await homeSetModel.delete({ _id: paramsData.id }).session(session);

			if (!homeSet.nModified) {
				await session.abortTransaction();
				session.endSession();
				return logger.status404(response, system.error, homeSetConstant.notFound(paramsData.id));
			}
			await session.commitTransaction();
			session.endSession();
			return logger.status200(response, system.success, homeSetConstant.msgDelete(paramsData.id));
		} catch (error) {
			await session.abortTransaction();
			session.endSession();
			errors.push(error.message);
			return logger.status500(response, error, errors);
		}
	}
}

// async function getCountHomeSet(doc) {
// 	try {
// 		let isArray = Array.isArray(doc);
// 		if (!isArray) {
// 			doc = [doc];
// 		}
// 		let promise = doc.map(async (e) => {
// 			let count = 0;
// 			if (e.homesetCategoriesList.length != 0) {
// 				//TODO: Get Id homeSet
// 				for (const element of e.homesetCategoriesList) {
// 					let categoryData = await categorySetModel.findById(element).select('-_id categoriesArrayList');
// 					if (categoryData && categoryData.categoriesArrayList.length != 0) {
// 						for (const el of categoryData.categoriesArrayList) {
// 							// console.log(element)
// 							let data = await listModel.findById(el);
// 							// console.log(data);
// 							count += data.toJSON().listProgramCount;
// 						}
// 					}
// 				}
// 				e.homesetListCount = count;
// 			}
// 			return e;
// 		});
// 		let data = await Promise.all(promise);
// 		return isArray ? data : data[0];
// 	} catch (error) {
// 		console.error(error);
// 		return doc;
// 	}
// }

async function getCountHomeSet(doc) {
	try {
		const isArray = Array.isArray(doc);
		if (!isArray) {
			doc = [doc];
		}
		const promise = doc.map((e) => {
			let count = 0;
			if (e.homesetCategoriesList.length) {
				e.homesetCategoriesList.forEach((categoryData) => {
					if (categoryData && categoryData.categoriesArrayList.length) {
						categoryData.categoriesArrayList.forEach((el) => {
							count += el.listProgramCount;
						});
					}
				});
				e.homesetListCount = count;
			}
			return e;
		});
		let data = await Promise.all(promise);
		return isArray ? data : data[0];
	} catch (error) {
		console.error(error);
		return doc;
	}
}

// async function getCountHomeSetDetail(doc) {
// 	try {
// 		if (doc.homesetCategoriesList.length != 0) {
// 			//TODO: Get Id homeSet
// 			for (const element of doc.homesetCategoriesList) {
// 				let count = 0;

// 				if (element.categoriesArrayList.length != 0) {
// 					for (const el of element.categoriesArrayList) {
// 						// console.log(element)
// 						let data = await listModel.findById(el);
// 						// console.log(data);
// 						count += data.toJSON().listProgramCount;
// 					}
// 					element.categoriesListCount = count;
// 				}
// 			}
// 		}
// 		return doc;
// 	} catch (error) {
// 		console.error(error);
// 		return doc;
// 	}
// }

async function getCountHomeSetDetail(doc) {
	try {
		if (doc.homesetCategoriesList.length) {
			await Promise.all(
				doc.homesetCategoriesList.map((element) => {
					let count = 0;

					if (element.categoriesArrayList.length) {
						element.categoriesArrayList.forEach((el) => {
							count += el.listProgramCount;
						});
						element.categoriesListCount = count;
					}
				})
			);
		}
		return doc;
	} catch (error) {
		console.error(error);
		return doc;
	}
}

module.exports = new HomeSetController();
