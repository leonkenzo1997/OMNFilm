const mongoose = require('mongoose');
const userModel = require('../../../../Models/User/UserModel');

const system = require('../../../../Constant/General/SystemConstant');
const logger = require('../../../../Constant/Logger/loggerConstant');

const businessQuery = require('../../../../Business/QueryModel');

const userConstant = require('../../../../Constant/User/UserConstant');
const constants = require('../../../../Constant/constants');

class DeactiveController {
	// [GET] /manage/deactive/
	async index(request, response, next) {
		const errors = [];
		request.query['deleted'] = true;
		request.query['userType'] = constants.USER_TYPE.USER;

		try {
			let listUserDeactive = await businessQuery.handle(userModel, request);
			return logger.status200(response, system.success, '', listUserDeactive);
		} catch (error) {
			errors.push(error.message);
			return logger.status500(response, error, errors);
		}
	}

	async restore(request, response, next) {
		const paramsData = request.params;
		const errors = [];
		let session = await mongoose.startSession();
		try {
			session.startTransaction();
			const userRestore = await userModel
				.findById({
					_id: paramsData.id,
				})
				.session(session);

			if (!userRestore) {
				await session.abortTransaction();
				session.endSession();
				return logger.status404(response, system.error, userConstant.notFound(paramsData.id));
			} else {
				userRestore.deleted = false;
				await userRestore.save({ session: session });
				await session.commitTransaction();
				session.endSession();
				return logger.status200(response, system.success, userConstant.msgRestore(paramsData.id));
			}
		} catch (error) {
			await session.abortTransaction();
			session.endSession();
			errors.push(error.message);
			return logger.status400(response, error, errors);
		}
	}
}

module.exports = new DeactiveController();
