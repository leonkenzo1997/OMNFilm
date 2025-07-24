const system = require('../../../Constant/General/SystemConstant');
const logger = require('../../../Constant/Logger/loggerConstant');
const categoriesSetModel = require('../../../Models/CategoriesSet/CategoriesSetModel');
const programModel = require('../../../Models/Program/ProgramModel');
const homeSetModel = require('../../../Models/HomeSet/HomeSetModel');
const listModel = require('../../../Models/List/ListModel');
const businessQuery = require('../../../Business/QueryModel');
const moment = require('moment-timezone');
const likeUnlikeModel = require('../../../Models/Action/LikeAndUnlikeModel');
const myListModel = require('../../../Models/User/MyListModel');
const constants = require('../../../Constant/constants');
const listConstant = require('../../../Constant/List/ListConstant');
const programConstant = require('../../../Constant/Program/ProgramConstant');
const UserProgramModel = require('../../../Models/User/UserProgramModel')

class mobileHomeOnlineController {
	// [GET] /online/categories
	async getCategories(request, response, next) {
		const errors = [];
		try {
			const categories = await categoriesSetModel
				.find(
					{
						isSurvey: true
					},
					{
						categoriesName: 1,
						categoriesImageSurvey: 1
					}
				)
				.limit(12);
			return logger.status200(response, system.success, '', categories);
		} catch (error) {
			errors.push(error.message);
			return logger.status500(response, error, errors);
		}
	}

	// [GET] /online/category/:id
	async getListInCategory(request, response, next) {
		const errors = [];
		const params = request.params;
		try {
			const category = await categoriesSetModel
				.findById(params.id)
				.populate({
					path: 'categoriesArrayList',
					select: 'listName'
				});
			
			if (!category) {
				return logger.status404(response, system.success, 'Category ID not found');
			}

			return logger.status200(response, system.success, '', category.categoriesArrayList);
		} catch (error) {
			errors.push(error.message);
			return logger.status500(response, error, errors);
		}
	}

	// [GET] /online/list/:id
	async getProgramInList(request, response, next) {
		const errors = [];
		const params = request.params;

		try {
			const listParents = await listModel
				.findById(params.id)
				.populate({
					path: 'listChildren',
				})
				.lean();

			if (!listParents) {
				return logger.status404(response, system.error, listConstant.notFound(params.id));
			}

			// Get program in categories set
			let arrayList = [];
			//adding list program of list parents
			arrayList = arrayList.concat(listParents.listProgramList);

			await Promise.all(
				Array.from(listParents.listChildren).map(async (itemOfListChildren) => {
					// itemOfListChildren is item of listChildren
					// adding program of list children in array
					arrayList = arrayList.concat(itemOfListChildren.listProgramList);
				})
			);

			request.query._id = {
				$in: arrayList,
			};
			request.query.programDisplay = true;
			request.query.deleted = false;
			request.query.programType = constants.PROGRAM_TYPE_ONLINE_SHOW;
			Object.assign(request.query, programConstant.FIELD_QUERY_DEFAULT);

			arrayList = await businessQuery.handle(
				programModel,
				request,
				{
					path: 'programCategory.categoryManageId',
					select: 'categoryMangeName'
				},
				programConstant.FIELD_SELECT_PROGRAM_HOME
			);
			return logger.status200(response, system.success, '', arrayList);
		} catch (error) {
			errors.push(error.message);
			return logger.status500(response, error, errors);
		}
	}

	// [GET] /mobile/homeset
	async getHomeset(request, response, next) {
		const userData = request.user;
		const errors = [];
		const fieldSelect = {
			homeset: [
				'homesetListCount',
				'slugName',
				'homesetName',
				'homesetTimeStart',
				'homesetTimeEnd',
				'createdAt'
			],
		};

		try {
			//get detial home set
			const time = moment().tz('Asia/Seoul');
			const we = time.format('ddd');
			const h = time.toObject();
			const timeNow = h.hours * 60 + h.seconds;
			const data = [];

			const homeSet = await homeSetModel
				.find(
					{
						['homeset' + we]: true,
					},
					fieldSelect.homeset
				)
				.populate({
					path: 'homesetCategoriesList',
					populate: {
						path: 'categoriesArrayList',
					},
				})
				.lean();

			// Get home set by available time
			homeSet.filter((v) => {
				const temp = v;
				let start = temp.homesetTimeStart;
				let end = temp.homesetTimeEnd;
				if (!end || !start) {
					return;
				}
				const timeStart = start.split(':');
				const timeEnd = end.split(':');
				start = timeStart[0] * 60 + Number(timeStart[1]);
				end = timeEnd[0] * 60 + Number(timeEnd[1]);
				if (start < timeNow && timeNow < end) {
					data.push(temp);
				}
			});

			// Get program in categories set
			let programs = [];

			await Promise.all(
				Array.from(data).map(async (item) => {
					Array.from(item.homesetCategoriesList).map((category) => {
						Array.from(category.categoriesArrayList).map((list) => {
							programs = programs.concat(list.listProgramList);
						});
					});
				})
			);

			request.query._id = {
				$in: programs,
			};
			request.query.programDisplay = true;
			request.query.deleted = false;
			request.query.sort = 'programTotalView,desc';
			request.query.programType = constants.PROGRAM_TYPE_ONLINE_SHOW;
			Object.assign(request.query, programConstant.FIELD_QUERY_DEFAULT);

			programs = await businessQuery.handle(
				programModel,
				request,
				{
					path: 'programCategory.categoryManageId',
					select: 'categoryMangeName'
				},
				programConstant.FIELD_SELECT_PROGRAM_HOME
			);
			// //get like & unlike user
			// let likeUnlike = await likeUnlikeModel.find({ userId: userData._id });

			// //get video like unlike
			// let videos = {};
			// await Promise.all(likeUnlike.map((v) => {
			// 	videos = Object.assign(videos, { [v.programId]: v.type });
			// }))

			// Object.entries(programs.docs).forEach(([v, va]) => {
			// 	va.isLike = videos[va._id] === 'like'
			// 	va.isUnlike = videos[va._id] === 'unlike'
			// });

			programs = JSON.parse(JSON.stringify(programs));

			const myList = JSON.parse(JSON.stringify(await myListModel.findOne({ userID: userData._id })))
			const programPlay = await UserProgramModel.findOne({ userID: userData._id })
			await Promise.all(
				programs.docs.map((item) => {
					item.isMyList = myList && myList.programs.includes(item._id)

					const timePlay = programPlay?.programIDs?.find(programID => programID.id === item._id)
					item.timePlay = timePlay && timePlay.time || 0
				})
			);
			return logger.status200(response, system.success, '', programs);
		} catch (error) {
			errors.push(error.message);
			return logger.status500(response, error, errors);
		}
	}

	// [GET] /mobile/original
	async getProgramOriginal(request, response, next) {
		const userData = request.user;
		const errors = [];
		request.query = {
			...request.query,
			programDisplay: true,
			deleted: false,
			sort: 'createdAt,desc',
			programType: constants.PROGRAM_TYPE.PROGRAM_ORIGINAL,
			...programConstant.FIELD_QUERY_DEFAULT,
		};
		try {
			let programs = await businessQuery.handle(
				programModel,
				request,
				{
					path: 'programCategory.categoryManageId',
					select: 'categoryMangeName'
				},
				programConstant.FIELD_SELECT_PROGRAM_HOME
			);

			programs = JSON.parse(JSON.stringify(programs));

			const myList = JSON.parse(JSON.stringify(await myListModel.findOne({ userID: userData._id })));
			const programPlay = await UserProgramModel.findOne({ userID: userData._id })
			await Promise.all(
				programs.docs.map((item) => {
					item.isMyList = myList && myList.programs.includes(item._id)

					const timePlay = programPlay?.programIDs?.find(programID => programID.id === item._id)
					item.timePlay = timePlay && timePlay.time || 0
				})
			);

			return logger.status200(response, system.success, '', programs);
		} catch (error) {
			errors.push(error.message);
			return logger.status500(response, error, errors);
		}
	}
}

module.exports = new mobileHomeOnlineController();
