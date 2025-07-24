const privacyPolicyModel = require('../../../Models/Manage/Footer/PrivacyPolicyModel');

const system = require('../../../Constant/General/SystemConstant');
const privacyPolicyConstant = require('../../../Constant/PrivacyPolicy/PrivacyPolicyConstant');
const logger = require('../../../Constant/Logger/loggerConstant');

class PrivacyPolicyController {
    // [GET] /user/privacy-policy/
    async index(request, response, next) {
        const errors = [];

        try {
            const arrayPrivacyPolicy = await privacyPolicyModel.find({});
            return logger.status200(
                response,
                system.success,
                '',
                arrayPrivacyPolicy,
            );
        } catch (error) {
            errors.push(error.message);
            return logger.status500(response, error, errors);
        }
    }

    // [GET] /user/privacy-policy/:id
    async detail(request, response, next) {
        const paramsData = request.params;
        const errors = [];
        try {
            const privacyPolicy = await privacyPolicyModel.findById({
                _id: paramsData.id,
            });
            if (!privacyPolicy) {
                return logger.status404(
                    response,
                    system.error,
                    privacyPolicyConstant.notFound(paramsData.id),
                );
            } else {
                return logger.status200(
                    response,
                    system.success,
                    '',
                    privacyPolicy,
                );
            }
        } catch (error) {
            errors.push(error.message);
            return logger.status400(response, error, errors);
        }
    }
}

module.exports = new PrivacyPolicyController();
