const NotificationModel = require('../../../../Models/Push/UserPushNotificationModel');

const system = require('../../../../Constant/General/SystemConstant');
const logger = require('../../../../Constant/Logger/loggerConstant');
const businessQuery = require('../../../../Business/QueryModel');
const programModel = require('../../../../Models/Program/ProgramModel')
const programConstant = require('../../../../Constant/Program/ProgramConstant')
const historyProgramModel = require('../../../../Models/Program/HistoryProgramModel');
const constants = require('../../../../Constant/constants')

class UploadController {
	// [GET] /offline/omner/messages
	async index(request, response, next) {
		const errors = [];
		try {
			request.query.receiverID = request.user._id
			request.query.isPending = false

			request.query.display = constants.DISPLAY_NOTIFICATION.OFFLINE

			request.query.category = parseInt(request.query.category)
			if (request.query.category) {
				request.query['body.category'] = request.query.category
			} else {
				request.query['body.category'] = {
					$in: [
						constants.CATEGORY_NOTIFICATION.ALL,
						constants.CATEGORY_NOTIFICATION.ACCOUNT,
						constants.CATEGORY_NOTIFICATION.MEMBERSHIP,
						constants.CATEGORY_NOTIFICATION.PAYMENT,
						constants.CATEGORY_NOTIFICATION.OTHER
					]
				}
			}
			delete request.query.category

			const result = await businessQuery.handle(
				NotificationModel,
				request,
				{
					path: 'programID',
					select: 'programImageTitleResize1'
				}
			);

			const notifications = []
			await Promise.all(result.docs.map(item => {
				notifications.push({
					_id: item._id,
					category: item.body.category,
					title: item.body.title,
					message: item.body.message,
					thumbnail: item?.programID?.programImageTitleResize1 || constants.DEFAULT_THUMNAIL
				})
			}))

			result.docs = notifications
			return logger.status200(response, system.success, '', result);
		} catch (error) {
			errors.push(error.message);
			return logger.status500(response, error, errors);
		}
	}

	// [GET] /offline/omner/messages/:id
	async detail(request, response, next) {
		const errors = [];
		try {
			const selectFields = [
				'_id',
				'body',
				'createdAt',
				'updatedAt'
			]
			const result = await NotificationModel.findById(request.params.id)
				.populate({
					path: 'programID',
					select: 'programImageTitleResize1'
				})
				.select(selectFields)
				.lean()

			if (!result) {
				return logger.status404(response, system.error, 'Not found');
			}

			const notification = {
				...result,
				...result.body,
				thumbnail: result?.programID?.programImageTitleResize1 || constants.DEFAULT_THUMNAIL
			}

			delete notification.body
			delete notification.userIDs
			delete notification.groupID
			delete notification.programID
			return logger.status200(response, system.success, '', notification);
		} catch (error) {
			errors.push(error.message);
			return logger.status500(response, error, errors);
		}
	}

	// [GET] /offline/omner/messages/omniverse/
	async omniverse(request, response, next) {
		const userData = request.user;
		const errors = [];
		try {
			request.query['participantsRates.userID'] = userData._id;
			request.query.programType = constants.PROGRAM_TYPE.PROGRAM_ORIGINAL
			request.query.deleted = false
			const programs = await businessQuery.handle(
				programModel,
				request,
				null,
				programConstant.FIELD_SELECT_PROGRAM_HOME
			);
			return logger.status200(response, system.success, '', programs);
		} catch (error) {
			errors.push(error.message);
			return logger.status500(response, error, errors);
		}
	}

	// [GET] /offline/omner/messages/result-letter
	async resultLetter(request, response, next) {
		const userData = request.user;
		const params = request.query;
		const errors = [];
		try {
			let programs = [];

			if (!params.programID) {
				programs = await programModel.distinct('_id', {
					'participantsRates.userID': userData._id,
					programType: constants.PROGRAM_TYPE.PROGRAM_ORIGINAL
				});
			} else {
				programs = [params.programID];
			}

			request.query.programID = {
				$in: programs,
			};
			let result = await businessQuery.handle(historyProgramModel, request, { path: 'programID', select: 'programImageTitleResize1' });

			result = JSON.parse(JSON.stringify(result))

			result.docs.forEach(item=> {
				item.thumbnail = item?.programID?.programImageTitleResize1 || constants.DEFAULT_THUMNAIL
				delete item.programID
			})
			return logger.status200(response, system.success, '', result);
		} catch (error) {
			errors.push(error.message);
			return logger.status500(response, error, errors);
		}
	}

	// [GET] /offline/omner/messages/result-letter
	async detailResultLetter(request, response, next) {
		const params = request.params;
		const errors = [];
		try {
			const resultLetter = await historyProgramModel.findOne({ _id: params.id }).populate({ path: 'programID', select: 'programImageTitleResize1' }).lean();

			if (!resultLetter) {
				return logger.status404(response, '', 'Not found');
			}

			resultLetter.thumbnail = resultLetter?.programID?.programImageTitleResize1 || constants.DEFAULT_THUMNAIL
			delete resultLetter.programID
			return logger.status200(response, system.success, '', resultLetter);
		} catch (error) {
			errors.push(error.message);
			return logger.status500(response, error, errors);
		}
	}
}

module.exports = new UploadController();
