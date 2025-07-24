const system = require('../../../Constant/General/SystemConstant');
const backgroundVideoModel = require('../../../Models/Background/BackgroundVideoModel');
const myListModel = require('../../../Models/User/MyListModel');
// const programModel = require('../../../Models/Program/ProgramModel');
// const likeUnlikeModel = require('../../../Models/Action/LikeAndUnlikeModel');

const logger = require('../../../Constant/Logger/loggerConstant');
const _ = require('lodash');

const constants = require('../../../Constant/constants');

class BackgroundVideoController {
    // [GET] /online/background/video/
    async index(request, response, next) {
        const errors = [];
        const user = request.user;
        // const date = new Date();
        // const hours = date.getHours() * 3600;
        // const minutes = date.getMinutes() + 60;
        // const timeWantToShow = hours + minutes;
        try {
            let backgroundArray = await backgroundVideoModel
                .find()
                .populate({
                    path: 'backgroundVideoProgramID',
                    match: {
                        programAddUploadTrailer: { $lte: Date.now() },
                        programDisplay: true,
                        deleted: false,
                        programType: constants.PROGRAM_TYPE_ONLINE_SHOW,
                    },
                })
                .select('backgroundVideoProgramID backgroundVideoTrailer')
                .lean();

            if (_.isEmpty(backgroundArray)) {
                backgroundArray = await backgroundVideoModel
                    .find({
                        deleted: true,
                        backgroundVideoType: constants.TYPE_BACKGROUND.BACKUP,
                    })
                    .populate({
                        path: 'backgroundVideoProgramID',
                        match: {
                            programDisplay: true,
                            deleted: false,
                            programType: constants.PROGRAM_TYPE_ONLINE_SHOW,
                        },
                    })
                    .select('backgroundVideoProgramID backgroundVideoTrailer')
                    .lean();
            }

            let background =
                backgroundArray.length &&
                backgroundArray.filter(
                    (item) => (item.program = item.backgroundVideoProgramID)
                );
            if (background.length < 2) {
                background = background[_.random(0, background.length - 1)];
            } else {
                background = background[_.random(0, background.length - 2)];
            }
            delete background.backgroundVideoProgramID;

            if (background) {
                background.program.isMyList = !!(await myListModel.findOne({
                    userID: user._id,
                    programs: background.program._id,
                }));
            }

            // add field backgroundVideoTrailer in program when return data
            background.program.backgroundVideoTrailer = background.backgroundVideoTrailer
                ? background.backgroundVideoTrailer
                : '';

            // comment delete field backgroundVideoTrailer
            delete background.backgroundVideoTrailer;

            return logger.status200(response, system.success, '', background);
        } catch (error) {
            errors.push(error.message);
            return logger.status500(response, error, errors);
        }
    }

    // async index(request, response, next) {
    // 	const errors = [];
    // 	const date = new Date();
    // 	const user = request.user;
    // 	const hours = date.getHours() * 3600;
    // 	const minutes = date.getMinutes() + 60;
    // 	const timeWantToShow = hours + minutes;
    // 	try {
    // 		let backgroundArray = await backgroundVideoModel
    // 			.find({
    // 				startAt: { $lte: timeWantToShow },
    // 				endAt: { $gt: timeWantToShow },
    // 				type: constants.TYPE_BACKGROUND.VIDEO,
    // 				deleted: false
    // 			})
    // 			.populate({
    // 				path: 'program',
    // 				populate: {
    // 					path: 'programCategory.categoryArrayTag programCategory.categoryManageId',
    // 					select: 'tagName categoryMangeName',
    // 				},
    // 				match: {
    // 					programDisplay: true,
    // 					deleted: false,
    // 					programType: constants.PROGRAM_TYPE_ONLINE_SHOW
    // 				}
    // 			})
    // 			.lean();

    // 		if (_.isEmpty(backgroundArray)) {
    // 			backgroundArray = await backgroundVideoModel
    // 				.findOne({ type: constants.TYPE_BACKGROUND.VIDEO, deleted: false })
    // 				.populate({
    // 					path: 'program',
    // 					populate: {
    // 						path: 'programCategory.categoryArrayTag programCategory.categoryManageId',
    // 						select: 'tagName categoryMangeName',
    // 					},
    // 					match: {
    // 						programDisplay: true,
    // 						deleted: false,
    // 						programType: constants.PROGRAM_TYPE_ONLINE_SHOW
    // 					}
    // 				})
    // 				.lean();
    // 		}
    // 		let background = backgroundArray.length && backgroundArray.filter(item => item.program)
    // 		background = background[_.random(0, background.length - 1)]
    // 		if (background) {
    // 			background.program.isMyList = !!(await myListModel.findOne({ userID: user._id, programs: background.program._id }));
    // 		}

    // 		return logger.status200(response, system.success, '', background);
    // 	} catch (error) {
    // 		errors.push(error.message);
    // 		return logger.status500(response, error, errors);
    // 	}
    // }
}

module.exports = new BackgroundVideoController();
