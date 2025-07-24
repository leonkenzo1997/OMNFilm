const system = require('../../../Constant/General/SystemConstant');
const membershipModel = require('../../../Models/Manage/Membership/MembershipModel');
const logger = require('../../../Constant/Logger/loggerConstant');

class MembershipController {
	// [GET] /user/membership/
	async index(request, response, next) {
		const errors = [];
		try {
			const arrayMembership = await membershipModel.find({});
			const totalMembership = await membershipModel.countDocuments();
			const data = {
				totalMembership,
				arrayMembership,
			};
			return logger.status200(response, system.success, '', data);
		} catch (error) {
			errors.push(error.message);
			return logger.status500(response, error, errors);
		}
	}

	// [GET] /user/membership/:id
	async detail(request, response, next) {
		const paramsData = request.params;
		const errors = [];
		try {
			const membership = await membershipModel.findById({
				_id: paramsData.id,
			});
			if (!membership) {
				return logger.status404(
					response,
					system.error,
					membershipConstant.notFound(paramsData.id)
				);
			} else {
				return logger.status200(response, system.success, '', membership);
			}
		} catch (error) {
			errors.push(error.message);
			return logger.status400(response, error, errors);
		}
	}
}

module.exports = new MembershipController();
