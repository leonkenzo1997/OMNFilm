const system = require('../../../Constant/General/SystemConstant');
const backgroundVideoModel = require('../../../Models/Background/BackgroundModel');
const myListModel = require('../../../Models/User/MyListModel');
const likeUnlikeModel = require('../../../Models/Action/LikeAndUnlikeModel');

const logger = require('../../../Constant/Logger/loggerConstant');
const _ = require('lodash');

const constants = require('../../../Constant/constants');

class BackgroundPosterController {
	// [GET] /online/background/poster/
	async index(request, response, next) {
		const errors = [];
		const user = request.user;
		const date = new Date();
		const hours = date.getHours() * 3600;
		const minutes = date.getMinutes() + 60;
		const timeWantToShow = hours + minutes;

		try {
			const backgroundArray = await backgroundVideoModel
				.find({
					startAt: { $lte: timeWantToShow },
					endAt: { $gt: timeWantToShow },
					type: constants.TYPE_BACKGROUND.POSTER,
				})
				.populate({
					path: 'program',
					populate: {
						path: 'programCategory.categoryArrayTag programCategory.categoryManageId',
						select: 'tagName categoryMangeName',
					},
				})
				.lean();

			let background = backgroundArray[_.random(0, backgroundArray.length - 1)];
			if (_.isEmpty(background)) {
				background = await backgroundVideoModel
					.findOne({ type: constants.TYPE_BACKGROUND.POSTER })
					.populate({
						path: 'program',
						populate: {
							path: 'programCategory.categoryArrayTag programCategory.categoryManageId',
							select: 'tagName categoryMangeName',
						},
					})
					.lean();
			}
			const idProgram = background.program._id;
			background.program.isMyList = !!(await myListModel.findOne({ userID: user._id, programs: idProgram }));

			return logger.status200(response, system.success, '', background);
		} catch (error) {
			errors.push(error.message);
			return logger.status500(response, error, errors);
		}
	}
}

module.exports = new BackgroundPosterController();
