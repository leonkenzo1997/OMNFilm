const mongoose = require('mongoose');

const listModel = require('../../../Models/List/ListModel');
const programModel = require('../../../Models/Program/ProgramModel');
const categoryManageModel = require('../../../Models/Manage/CategoryManage/CategoryManageModel');
const tagModel = require('../../../Models/Manage/Tag/TagModel');
const categoriesSetModel = require('../../../Models/CategoriesSet/CategoriesSetModel');

const system = require('../../../Constant/General/SystemConstant');
const listConstant = require('../../../Constant/List/ListConstant');
const challengerConstant = require('../../../Constant/Challenger/ChallengerConstant');
const logger = require('../../../Constant/Logger/loggerConstant');

const businessQuery = require('../../../Business/QueryModel');

const listService = require('../../../Service/List/ListService');
const categoriesSetService = require('../../../Service/CategoriesSet/CategoriesSetService');
const homeSetService = require('../../../Service/HomeSet/HomeSetService');
const validationService = require('../../../Service/Validation/ValidationService');
const queryBusiness = require('../../../Business/QueryModel');
const _ = require('lodash');
const constants = require('../../../Constant/constants');
const ListModel = require('../../../Models/List/ListModel');
const common = require('../../../Service/common');
const programConstant = require('../../../Constant/Program/ProgramConstant');

class ListController {
	// [GET] /admin/list/
	async index(request, response, next) {
		const errors = [];
		try {
			// not in list of category
			if (request.query.category) {
				const category = await categoriesSetModel.findById(request.query.category);
				if (category) {
					request.query._id = { $nin: category.categoriesArrayList };
				}
			}

			// not in list of id list
			if (request.query.id) {
				const list = await listModel.findById(request.query.id);
				if (list) {
					request.query._id = {
						$nin: list.listChildren.concat(request.query.id),
					};
				}
			}

			// search keyword
			if (request.query.keyword) {
				request.query['$or'] = [
					{
						listName: new RegExp(request.query.keyword, 'i'),
					},
					{
						listType: new RegExp(request.query.keyword, 'i'),
					},
				];
			}
			delete request.query.id;
			delete request.query.category;
			delete request.query.keyword;
			const arrayList = await businessQuery.handle(listModel, request);
			return logger.status200(response, system.success, '', arrayList);
		} catch (error) {
			errors.push(error.message);
			return logger.status500(response, error, errors, system.error);
		}
	}

	// [GET] /admin/list/:id
	async detail(request, response, next) {
		const paramsData = request.params;
		const errors = [];
		try {
			const list = await listModel.findById({ _id: paramsData.id });
			if (!list) {
				return logger.status404(response, system.error, listConstant.notFound(paramsData.id));
			}

			return logger.status200(response, system.success, '', list);
		} catch (error) {
			errors.push(error.message);
			return logger.status400(response, error, errors, system.error);
		}
	}

	// [POST] /admin/list/create
	async create(request, response, next) {
		const formData = request.body;
		const errors = [];
		let session = await mongoose.startSession();

		try {
			session.startTransaction();

			let checkDaplicate = {};
			while (checkDaplicate) {
				formData['slugName'] = common.generateSlug(formData.listName);
				checkDaplicate = await listModel.findOne({
					slugName: formData['slugName'],
				});
			}
			if (formData.hasOwnProperty('listProgramList')) {
				if (validationService.checkFieldTypeArray(formData.listProgramList)) {
					formData.listProgramCount = formData.listProgramList.length;

					const list = new listModel(formData);
					const createList = await list.save({ session: session });
					await session.commitTransaction();
					session.endSession();
					return logger.status201(response, createList);
				} else {
					await session.abortTransaction();
					session.endSession();
					errors.push(listConstant.errorFieldDataListProgramList);
					return logger.status400(response, listConstant.errorFieldDataListProgramList, errors);
				}
			} else {
				const list = new listModel(formData);
				const createList = await list.save({ session: session });
				await session.commitTransaction();
				session.endSession();
				return logger.status201(response, createList);
			}
		} catch (error) {
			await session.abortTransaction();
			session.endSession();
			errors.push(error.message);
			return logger.status400(response, error, errors);
		}
	}

	// [PUT] /admin/list/:id
	async update(request, response, next) {
		const paramsData = request.params;
		const formData = request.body;
		const errors = [];
		// get key in array formData
		const updates = request.keyData;
		let session = await mongoose.startSession();
		try {
			session.startTransaction();
			const list = await listService.findById(paramsData.id);

			if (!list) {
				await session.abortTransaction();
				session.endSession();
				return logger.status404(response, system.error, listConstant.notFound(paramsData.id));
			} else {
				if (formData.hasOwnProperty('listProgramList')) {
					if (validationService.checkFieldTypeArray(formData.listProgramList)) {
						formData.listProgramCount = formData.listProgramList.length;

						// loop each key in array of formData and assign
						updates.forEach((update) => {
							// user[update]: is old data
							// formData[update]: new data
							// change old data by assigning new data
							return (list[update] = formData[update]);
						});

						const dataList = await list.save({ session: session });
						await session.commitTransaction();
						session.endSession();
						return logger.status200(
							response,
							system.success,
							listConstant.msgUpdate(paramsData.id),
							dataList
						);
					} else {
						await session.abortTransaction();
						session.endSession();
						errors.push(listConstant.errorFieldDataListProgramList);
						return logger.status400(response, listConstant.errorFieldDataListProgramList, errors);
					}
				} else {
					// loop each key in array of formData and assign
					updates.forEach((update) => {
						// user[update]: is old data
						// formData[update]: new data
						// change old data by assigning new data
						return (list[update] = formData[update]);
					});

					const dataList = await list.save({ session: session });
					await session.commitTransaction();
					session.endSession();
					return logger.status200(response, system.success, listConstant.msgUpdate(paramsData.id), dataList);
				}
			}
		} catch (error) {
			await session.abortTransaction();
			session.endSession();
			errors.push(error.message);
			return logger.status400(response, error, errors, system.error);
		}
	}

	// [DELETE] /admin/list/:id
	async destroy(request, response, next) {
		const paramsData = request.params;
		const errors = [];
		let session = await mongoose.startSession();
		try {
			session.startTransaction();
			const list = await listModel.findById(paramsData.id);

			if (!list) {
				session.endSession();
				return logger.status404(response, system.error, listConstant.notFound(paramsData.id));
			} else {
				// update again total program of list categories-set relate to id list deleted
				const checkUpdateCategoriesSet = await categoriesSetService.updateProgramOfCategoriesSet(
					paramsData.id,
					session
				);
				const msg = {
					deleteSuccess: listConstant.msgDelete(paramsData.id),
					updateCategoriesSet: '',
					updateHomeSet: '',
				};

				if (!checkUpdateCategoriesSet.isUpdateCategoriesSetSuccess) {
					msg.updateCategoriesSet = listConstant.errorUpdateCategoriesSet(
						checkUpdateCategoriesSet.idHomeSetFail
					);
					await session.abortTransaction();
					session.endSession();
					return logger.status200(response, system.error, msg);
				} else {
					msg.updateCategoriesSet = listConstant.updateCategoriesSetSuccess;

					// update again total program of list home-set relate to array categories set
					// array categories set have to contain idListDeleted

					const checkUpdateHomeSet = await homeSetService.updateCountProgramOfHomeSet(
						checkUpdateCategoriesSet.arrayCategoriesSet,
						session
					);

					if (!checkUpdateHomeSet.isUpdateHomeSetSuccess) {
						msg.updateHomeSet = listConstant.errorUpdateHomeSet(checkUpdateHomeSet.idHomeSetFail);
						await session.abortTransaction();
						session.endSession();
						return logger.status200(response, system.error, msg);
					}
					msg.updateHomeSet = listConstant.updateHomeSetSuccess;

					const deleteList = await listModel.delete({ _id: paramsData.id }).session(session);
					if (!deleteList.nModified) {
						await session.abortTransaction();
						session.endSession();
						return logger.status404(response, system.error, categoriesSetConstant.notFound(paramsData.id));
					}
					await session.commitTransaction();
					session.endSession();
					return logger.status200(response, system.success, msg);
				}
			}
		} catch (error) {
			await session.abortTransaction();
			session.endSession();
			errors.push(error.message);
			return logger.status500(response, error, errors, system.error);
		}
	}

	// [GET] /admin/list/search
	async search(request, response, next) {
		const errors = [];
		try {
			if (!_.isEmpty(request.query.category)) {
				request.query['programCategory.categoryManageId'] = mongoose.Types.ObjectId(request.query.category);
			}
			if (!_.isEmpty(request.query.tag)) {
				request.query['programCategory.categoryArrayTag'] = mongoose.Types.ObjectId(request.query.tag);
			}

			delete request.query.category;
			delete request.query.tag;
			const programs = await queryBusiness.handle(programModel, request);
			return logger.status200(response, system.success, '', programs);
		} catch (error) {
			errors.push(error.message);
			return logger.status500(response, errors, system.error);
		}
	}

	// [GET] /admin/list/categories
	async categories(request, response, next) {
		const errors = [];
		try {
			const categories = await categoryManageModel.find({}, { categoryMangeName: 1, categoryMangeID: 1 });
			return logger.status200(response, system.success, '', categories);
		} catch (error) {
			errors.push(error.message);
			return logger.status500(response, error, errors, system.error);
		}
	}

	// [GET] /admin/list/tags
	async tags(request, response, next) {
		const errors = [];
		try {
			const tags = await tagModel.find({}, { tagName: 1, tagID: 1 });
			return logger.status200(response, system.success, '', tags);
		} catch (error) {
			errors.push(error.message);
			return logger.status500(response, error, errors, system.error);
		}
	}

	// [GET] /admin/list/loops
	async loops(request, response, next) {
		const errors = [];
		try {
			request.query.listType = {
				$ne: constants.LIST_TYPE.NO_LOOP,
			};
			const arrayList = await businessQuery.handle(listModel, request);
			return logger.status200(response, system.success, '', arrayList);
		} catch (error) {
			errors.push(error.message);
			return logger.status500(response, error, errors, system.error);
		}
	}

	// [GET] /admin/list/no-loops
	async noLoops(request, response, next) {
		const errors = [];
		try {
			request.query.listType = constants.LIST_TYPE.NO_LOOP;
			const arrayList = await businessQuery.handle(listModel, request);
			return logger.status200(response, system.success, '', arrayList);
		} catch (error) {
			errors.push(error.message);
			return logger.status500(response, error, errors, system.error);
		}
	}

	// [GET] /admin/list/loops
	async all(request, response, next) {
		const errors = [];
		try {
			const loops = await listModel.find();
			return logger.status200(response, system.success, '', loops);
		} catch (error) {
			errors.push(error.message);
			return logger.status500(response, error, errors, system.error);
		}
	}

	// [POST] /admin/list/add-in-list/:id
	async addInList(request, response, next) {
		const errors = [];
		const paramsData = request.params;
		const formData = request.body;
		const idAdd = formData.id;

		let session = await mongoose.startSession();
		session.startTransaction();
		try {
			// validate field
			if (!paramsData.id || !formData.id || paramsData.id === formData.id) {
				session.endSession();
				return logger.status404(response, system.errorValue, system.errorValue);
			}
			// Check id exists in db
			const list = await listModel.findById(paramsData.id);
			if (!list) {
				session.endSession();
				return logger.status404(response, system.error, listConstant.notFound(paramsData.id));
			}
			// Check id exists in db
			const listForAdd = await listModel.findById(formData.id);
			if (!listForAdd) {
				session.endSession();
				return logger.status404(response, system.error, listConstant.notFound(formData.id));
			}

			// Check id is exists in list
			if (list.listChildren && list.listChildren.includes(mongoose.Types.ObjectId(formData.id))) {
				list.listChildren = list.listChildren.filter((item) => item.toString() !== idAdd);
				await list.save({ session });
				await session.commitTransaction();
				session.endSession();
				return logger.status200Msg(
					response,
					system.success,
					`Remove ${idAdd} in list ${list.listName} success`
				);
			} else {
				list.listChildren = list.listChildren.concat(idAdd);
				await list.save({ session });
				await session.commitTransaction();
				session.endSession();
				return logger.status200Msg(response, system.success, `Add ${idAdd} in list ${list.listName} success`);
			}
		} catch (error) {
			await session.abortTransaction();
			session.endSession();
			errors.push(error.message);
			return logger.status500(response, error, errors, system.error);
		}
	}

	// [POST] /admin/list/add-all-program/:id
	async addAllProgram(request, response, next) {
		const errors = [];
		const paramsData = request.params;
		const formData = request.body;

		let session = await mongoose.startSession();
		session.startTransaction();
		try {
			const list = await listModel.findById(paramsData.id);
			if (!list) {
				session.endSession();
				return logger.status404(response, system.error, listConstant.notFound(paramsData.id));
			}

			const query = {};
			if (formData.category) {
				query['programCategory.categoryManageId'] = formData.category;
			}
			if (formData.tag) {
				query['programCategory.categoryArrayTag'] = formData.tag;
			}
			if (formData.programName) {
				query['programName'] = new RegExp(formData.programName, 'i');
			}
			const programs = await programModel.distinct('_id', {
				programType: constants.PROGRAM_TYPE.UPLOAD,
				deleted: false,
				...programConstant.FIELD_QUERY_DEFAULT,
				programDisplay: true,
				...query,
			});

			list.listProgramList = _.uniqWith(list.listProgramList.concat(programs), _.isEqual);
			await list.save({ session });
			await session.commitTransaction();
			session.endSession();
			return logger.status200Msg(response, system.success, `Add all program in list ${paramsData.id} success`);
		} catch (error) {
			await session.abortTransaction();
			session.endSession();
			errors.push(error.message);
			return logger.status500(response, error, errors, system.error);
		}
	}

	// [GET] /admin/list/program/:id
	async programInList(request, response, next) {
		const errors = [];
		const paramsData = request.params;
		const selectFields = ['programName', 'programCategory', 'programTotalView'];
		try {
			const list = await listModel.findById(paramsData.id);
			if (!list) {
				return logger.status404(response, system.error, listConstant.notFound(paramsData.id));
			}

			request.query['_id'] = {
				$in: list.listProgramList,
			};
			Object.assign(request.query, programConstant.FIELD_QUERY_DEFAULT);
			const programs = await businessQuery.handle(
				programModel,
				request,
				'programCategory.categoryManageId',
				selectFields
			);

			const data = JSON.parse(JSON.stringify(programs));
			await Promise.all(
				data.docs.map((item) => {
					item.playedMinutes = 0;
				})
			);
			return logger.status200(response, system.success, '', programs);
		} catch (error) {
			errors.push(error.message);
			return logger.status500(response, error, errors, system.error);
		}
	}

	// [POST] /admin/list/add-program/:id
	async addProgram(request, response, next) {
		const errors = [];
		const paramsData = request.params;
		const formData = request.body;
		const idAdd = formData.id;

		let session = await mongoose.startSession();
		session.startTransaction();
		try {
			// Check id exists in db
			const list = await listModel.findById(paramsData.id);
			if (!list) {
				session.endSession();
				return logger.status404(response, system.error, listConstant.notFound(paramsData.id));
			}

			const program = await programModel.findById(idAdd);
			if (!program) {
				return logger.status404(response, system.error, challengerConstant.notFound(paramsData.id));
			}
			// Check id is exists in list
			if (list.listProgramList && list.listProgramList.includes(mongoose.Types.ObjectId(formData.id))) {
				list.listProgramList = list.listProgramList.filter((item) => item.toString() !== idAdd);
				await list.save({ session });
				await session.commitTransaction();
				session.endSession();
				return logger.status200Msg(
					response,
					system.success,
					`Remove ${idAdd} in list ${list.listName} success`
				);
			} else {
				list.listProgramList = list.listProgramList.concat(idAdd);
				await list.save({ session });
				await session.commitTransaction();
				session.endSession();
				return logger.status200Msg(response, system.success, `Add ${idAdd} in list ${list.listName} success`);
			}
		} catch (error) {
			await session.abortTransaction();
			session.endSession();
			errors.push(error.message);
			return logger.status500(response, error, errors, system.error);
		}
	}

	// [GET] /admin/list/childrens
	async listChildrens(request, response, next) {
		const errors = [];
		const params = request.params;
		try {
			const list = await ListModel.findById(params.id).populate({
				path: 'listChildren',
				select: ['listName', 'listProgramCount', 'createdAt', 'listProgramList'],
			});
			if (!list) {
				return logger.status404(response, system.error, listConstant.notFound(params.id));
			}
			return logger.status200(response, system.success, '', list.listChildren);
		} catch (error) {
			errors.push(error.message);
			return logger.status500(response, error, errors, system.error);
		}
	}
}

module.exports = new ListController();
