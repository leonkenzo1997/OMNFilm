const mongoose = require('mongoose');

const BractersModel = require('../../../Models/Bracters/BractersModelV2');
const CategoriesSetModel = require('../../../Models/CategoriesSet/CategoriesSetModel');
const ProgramModel = require('../../../Models/Program/ProgramModel');
const system = require('../../../Constant/General/SystemConstant');
const bractersConstant = require('../../../Constant/Bracter/BracterConstant');
const businessQuery = require('../../../Business/QueryModel');
const logger = require('../../../Constant/Logger/loggerConstant');
const constants = require('../../../Constant/constants');
const ProgramConstant = require('../../../Constant/Program/ProgramConstant');

class BractersController {
	// [GET] /admin/bracters/
	async index(request, response, next) {
		const errors = [];
		const relation = [
			{
				path: 'categoryID',
				select: 'categoriesName',
			},
			{
				path: 'listPrograms.programID',
				select: 'programTotalView programName programImageBracter',
				match: {
					programType: constants.PROGRAM_TYPE_ONLINE_SHOW,
					deleted: false,
					programDisplay: true,
					...ProgramConstant.FIELD_QUERY_DEFAULT,
				},
			},
		];
		try {
			let listBracters = await businessQuery.handle(BractersModel, request, relation);

			listBracters = JSON.parse(JSON.stringify(listBracters));
			await Promise.all(listBracters.docs.map((item) => {
				item.listPrograms = item.listPrograms.filter((program) => program.programID);
			}))
			return logger.status200(response, system.success, '', listBracters);
		} catch (error) {
			errors.push(error.message);
			return logger.status500(response, error, errors);
		}
	}

	// [GET] /admin/bracters/list-programs/:id
	async listPrograms(request, response, next) {
		const paramsData = request.params;
		const errors = [];
		const selectFields = [
			'programName',
			'programTotalView',
			'programCategory.categoryManageId',
			'programImageBracter',
		];
		const limit = request.query.limit || 10;
		const page = request.query.page || 1;
		try {
			const bracter = await BractersModel.findById({ _id: paramsData.id }).populate({
				path: 'listPrograms.programID',
				select: selectFields,
				match: {
					programType: constants.PROGRAM_TYPE_ONLINE_SHOW,
					deleted: false,
					programDisplay: true,
					...ProgramConstant.FIELD_QUERY_DEFAULT,
				},
				populate: {
					path: 'programCategory.categoryManageId',
					select: 'categoryMangeName',
				},
			});

			if (!bracter) {
				return logger.status404(response, system.error, bractersConstant.notFound(paramsData.id));
			}
			const listPrograms = JSON.parse(JSON.stringify(bracter.listPrograms));
			let programs = await Promise.all(
				listPrograms
					.filter((item) => item.programID)
					.map((item) => {
						item.programID.playedMinutes = 0;
						return item.programID;
					})
			);

			const totalDocs = programs.length;
			const totalPages = Math.ceil(totalDocs / limit);
			programs = programs.slice((page - 1) * limit, page * limit);
			const result = {
				docs: programs,
				totalPages,
				totalDocs,
				page,
				limit,
			};
			return logger.status200(response, system.success, '', result);
		} catch (error) {
			errors.push(error.message);
			return logger.status400(response, error, errors);
		}
	}

	// [POST] /admin/bracters/create
	async create(request, response, next) {
		const formData = request.body;
		const errors = [];
		let session = await mongoose.startSession();
		session.startTransaction();

		try {
			const category = await CategoriesSetModel.findById(formData.categoryID);
			if (!category) {
				session.endSession();
				return logger.status404(response, false, bractersConstant.categoryNotFound);
			}
			let bracter = await BractersModel.findOne({
				categoryID: formData.categoryID,
			});
			if (bracter) {
				session.endSession();
				return logger.status400(response, bractersConstant.bracterIsExisted, errors);
			}
			bracter = await new BractersModel(formData).save({ session: session });
			await session.commitTransaction();
			session.endSession();
			return logger.status201(response, bracter);
		} catch (error) {
			await session.abortTransaction();
			session.endSession();
			errors.push(error.message);
			return logger.status400(response, error, errors);
		}
	}

	// [POST] /admin/bracters/add-program/:id
	async addProgram(request, response, next) {
		const paramsData = request.params;
		const formData = request.body;
		const errors = [];
		let session = await mongoose.startSession();
		session.startTransaction();
		try {
			const bracter = await BractersModel.findById(paramsData.id);
			if (!bracter) {
				return logger.status404(response, system.error, bractersConstant.notFound(paramsData.id));
			}

			const program = await ProgramModel.findById(formData.id);
			if (!program) {
				return logger.status404(response, system.error, bractersConstant.programIdNotFound);
			}

			const checkDuplicate = bracter.listPrograms.find(
				(item) => item.programID && item.programID.toString() === formData.id
			);
			if (checkDuplicate) {
				return logger.status400(response, bractersConstant.programIsExisted, errors);
			}
			bracter.listPrograms.push({
				programID: formData.id,
				createdAt: Date.now(),
			});

			await bracter.save({ session });
			await session.commitTransaction();
			session.endSession();
			return logger.status200Msg(response, system.success, bractersConstant.updateBracterSuccess);
		} catch (error) {
			await session.abortTransaction();
			session.endSession();
			errors.push(error.message);
			return logger.status400(response, error, errors);
		}
	}

	// [PUT] /admin/bracters/delete-program/:id
	async deleteProgram(request, response, next) {
		const paramsData = request.params;
		const formData = request.body;
		const errors = [];
		let session = await mongoose.startSession();
		session.startTransaction();
		try {
			const bracter = await BractersModel.findById(paramsData.id);
			if (!bracter) {
				return logger.status404(response, system.error, bractersConstant.notFound(paramsData.id));
			}

			const program = await ProgramModel.findById(formData.id);
			if (!program) {
				return logger.status404(response, system.error, bractersConstant.programIdNotFound);
			}
			bracter.listPrograms = bracter.listPrograms.filter(
				(item) => item.programID && item.programID.toString() !== formData.id
			);
			await bracter.save({ session });
			await session.commitTransaction();
			session.endSession();
			return logger.status200Msg(response, system.success, bractersConstant.updateBracterSuccess);
		} catch (error) {
			await session.abortTransaction();
			session.endSession();
			errors.push(error.message);
			return logger.status400(response, error, errors);
		}
	}

	// [DELETE] /admin/bracters/:id
	async destroy(request, response, next) {
		const paramsData = request.params;
		const errors = [];
		let session = await mongoose.startSession();
		session.startTransaction();
		try {
			const itemDel = await BractersModel.findByIdAndDelete({
				_id: paramsData.id,
			}).session(session);
			if (itemDel) {
				await session.commitTransaction();
				session.endSession();
				return logger.status200(response, system.success, bractersConstant.msgDelete(paramsData.id));
			} else {
				await session.abortTransaction();
				session.endSession();
				return logger.status404(response, system.error, bractersConstant.notFound(paramsData.id));
			}
		} catch (error) {
			await session.abortTransaction();
			session.endSession();
			errors.push(error.message);
			return logger.status500(response, error, errors);
		}
	}

	// [GET] /admin/bracters/program-add-category/:id
	async programAddCategory(request, response, next) {
		const errors = [];
		request.query.programType = constants.PROGRAM_TYPE_ONLINE_SHOW;
		request.query.deleted = false;
		request.query.programDisplay = true;
		Object.assign(request.query, ProgramConstant.FIELD_QUERY_DEFAULT);

		const selectFields = [
			'programName',
			'programCategory.categoryManageId',
			'programTotalView',
			'programImageBracter',
		];

		const programIDs = await BractersModel.distinct('listPrograms.programID', {
			_id: request.params.id,
		});
		request.query._id = {
			$nin: programIDs,
		};
		try {
			const result = await businessQuery.handle(
				ProgramModel,
				request,
				{
					path: 'programCategory.categoryManageId',
					select: 'categoryMangeName',
				},
				selectFields
			);

			const data = JSON.parse(JSON.stringify(result));
			await Promise.all(
				data.docs.map((item) => {
					item.playedMinutes = 0;
				})
			);
			return logger.status200(response, system.success, '', data);
		} catch (error) {
			errors.push(error.message);
			return logger.status500(response, error, errors, system.error);
		}
	}

	// [GET] /admin/bracters/categories
	async categories(request, response, next) {
		const errors = [];
		try {
			const listBracters = await BractersModel.distinct('categoryID', {});

			request.query._id = {
				$nin: listBracters,
			};
			const categories = await businessQuery.handle(CategoriesSetModel, request, null, 'categoriesName');

			return logger.status200(response, system.success, '', categories);
		} catch (error) {
			errors.push(error.message);
			return logger.status500(response, error, errors);
		}
	}
}

module.exports = new BractersController();
