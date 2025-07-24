const termsAndConditionsModel = require('../../../Models/Manage/Footer/TermsAndConditionsModel');
const system = require('../../../Constant/General/SystemConstant');
const termsAndConditionsConstant = require('../../../Constant/TermsAndConditions/TermsAndConditionsConstant');
const logger = require('../../../Constant/Logger/loggerConstant');

class TermsAndConditionsController {
    // [GET] /user/terms-and-conditions/
    async index(request, response, next) {
        const errors = [];
        try {
            const arrayTermsAndConditions = await termsAndConditionsModel.find(
                {},
            );
            return logger.status200(
                response,
                system.success,
                '',
                arrayTermsAndConditions,
            );
        } catch (error) {
            errors.push(error.message);
            return logger.status500(response, error, errors);
        }
    }

    // [GET] /user/terms-and-conditions/:id
    async detail(request, response, next) {
        const paramsData = request.params;
        const errors = [];
        try {
            const termsAndConditions = await termsAndConditionsModel.findById({
                _id: paramsData.id,
            });
            if (!termsAndConditions) {
                return logger.status404(
                    response,
                    system.error,
                    termsAndConditionsConstant.notFound(paramsData.id),
                );
            } else {
                return logger.status200(
                    response,
                    system.success,
                    '',
                    termsAndConditions,
                );
            }
        } catch (error) {
            errors.push(error.message);
            return logger.status400(response, error, errors);
        }
    }
}

module.exports = new TermsAndConditionsController();
