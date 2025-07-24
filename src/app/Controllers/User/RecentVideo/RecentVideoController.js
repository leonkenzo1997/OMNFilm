const mongoose = require('mongoose');
const RecentVideoModel = require('../../../Models/RecentVideo/RecentVideoModel');
const myListModel = require('../../../Models/User/MyListModel');
const likeUnlikeModel = require('../../../Models/Action/LikeAndUnlikeModel');
const system = require('../../../Constant/General/SystemConstant');
const logger = require('../../../Constant/Logger/loggerConstant');
const businessQuery = require('../../../Business/QueryModel');
const RecentVideoConstant = require('../../../Constant/RecentVideo/RecentVideoConstant');
const challengerConstant = require('../../../Constant/Challenger/ChallengerConstant');
const constants = require('../../../Constant/constants');
const ProgramModel = require('../../../Models/Program/ProgramModel');
const programConstant = require('../../../Constant/Program/ProgramConstant');
const MembershipModel = require('../../../Models/Manage/Membership/MembershipModel');

class RecentVideoController {
	// [GET] /user/recent-video
	async index(request, response, next) {
		const userData = request.user;
		const errors = [];

		try {
			request.query.limit = request.query.limit || 24;
			request.query.sort = 'createdAt,desc';
			request.query.programDisplay = true;
			request.query.deleted = false;

			// Query program original
			request.query['$or'] = [
				{ programType: { $ne: constants.PROGRAM_TYPE.PROGRAM_ORIGINAL } },
				{
					programType: constants.PROGRAM_TYPE.PROGRAM_ORIGINAL,
					originalDate: {
						$lte: Date.now()
					}
				}
			]

			Object.assign(request.query, programConstant.FIELD_QUERY_DEFAULT);

			const listProgramID = await RecentVideoModel.distinct('programID', {
				userID: request.user._id
			})

			request.query['_id'] = {
				$in: listProgramID
			}
			let programs = await businessQuery.handle(
				ProgramModel,
				request,
				{
					path: 'programCategory.categoryManageId',
					select: 'categoryMangeName'
				},
				programConstant.FIELD_SELECT_PROGRAM_HOME
			);

			//get like & unlike user
			let likeUnlike = await likeUnlikeModel.find({ userId: userData._id });

			//get video like unlike
			let videos = {};

			await Promise.all(likeUnlike.map((v) => {
				videos = Object.assign(videos, { [v.programId]: v.type });
			}))

			Object.entries(programs.docs).forEach(([v, va]) => {
				va.isLike = videos[va._id] == 'like' ? true : false;
				va.isUnlike = videos[va._id] == 'unlike' ? true : false;
			});

			programs = JSON.parse(JSON.stringify(programs))

			const myList = JSON.parse(JSON.stringify(await myListModel.findOne({ userID: userData._id })))
			await Promise.all(
				programs.docs.map((item) => {
					item.isMyList = myList ? myList.programs.includes(item._id) : false;
				})
			);
			return logger.status200(response, system.success, '', programs);
		} catch (error) {
			errors.push(error.message);
			return logger.status500(response, error, errors);
		}
	}

	// [POST] /user/recent-video
	async create(request, response, next) {
		const formData = request.body;
		const userData = request.user;
		const errors = [];
		try {
			formData.userID = userData._id;
			formData.programID = mongoose.Types.ObjectId(formData.programID)

			const program = await ProgramModel.findById(formData.programID)
			if (!program) {
				return logger.status404(
					response,
					system.error,
					challengerConstant.notFound(formData.programID)
				);
			}

			if (program.programType === constants.PROGRAM_TYPE.PROGRAM_ORIGINAL) {
				const memberShip = await MembershipModel.findById(userData.userMembership)

				if (!memberShip || memberShip.packageName !== constants.MEMBER_SHIP.PREMIUM) {
					return logger.status400(response, system.membershipInvalid, errors);
				}
			}

			// If programTypeVideo = season and it is child then programID = parentID
			if (program.programTypeVideo === constants.TYPE_VIDEO.SS && program.programSeasonChild) {
				formData.programID = program.programChildrenSeasonData.parentID
			}
			let result = await RecentVideoModel.findOne(formData)

			if (result) {
				result.updatedAt = Date.now()
			} else {
				result = new RecentVideoModel(formData);
			}
			result.categoryID = program.programCategory && program.programCategory.categoryManageId
			await result.save()

			if (!result) {
				return logger.status400(response, RecentVideoConstant.errorCreate);
			}

			return logger.status200Msg(response, true, RecentVideoConstant.createSuccess);
		} catch (error) {
			errors.push(error.message);
			return logger.status400(response, error, errors);
		}
	}
}

module.exports = new RecentVideoController();
