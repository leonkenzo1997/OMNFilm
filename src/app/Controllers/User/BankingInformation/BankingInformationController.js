const mongoose = require('mongoose');
const system = require('../../../Constant/General/SystemConstant');

const membershipModel = require('../../../Models/Manage/Membership/MembershipModel');
const logger = require('../../../Constant/Logger/loggerConstant');
const userModel = require('../../../Models/User/UserModel');

class BankingInformationController {
	// [GET] /user/membership/
	async update(request, response, next) {
		const errors = [];
		const user = request.user;
		const formData = request.body;

		let session = await mongoose.startSession();
		session.startTransaction();
		try {
			const data = await userModel.findById({ _id: user._id });
			data.isAddingBankingInfor = true;
			data.bankingInfor = formData;
			await data.save({ session: session });

			await session.commitTransaction();
			session.endSession();

			const dataUser = await userModel.findOne({ _id: user._id }).populate({
				path: 'bankingInfor.koreanBank',
			});
			return logger.status200(response, system.success, '', dataUser);
		} catch (error) {
			await session.abortTransaction();
			session.endSession();
			errors.push(error.message);
			return logger.status500(response, error, errors);
		}
	}
}

module.exports = new BankingInformationController();
