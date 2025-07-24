const companyInformationModel = require('../../../Models/Manage/Footer/CompanyInformationModel');

const system = require('../../../Constant/General/SystemConstant');
const companyInforConstant = require('../../../Constant/CompanyInformation/CompanyInforConstant');
const logger = require('../../../Constant/Logger/loggerConstant');

class CompanyInformationController {
    // [GET] /user/company-information/
    async index(request, response, next) {
        const errors = [];
        try {
            const arrayCompanyInfor = await companyInformationModel.find({});
            const totalCompanyInfor = await companyInformationModel.countDocuments();
            const data = {
                totalCompanyInfor,
                arrayCompanyInfor,
            };
            return logger.status200(response, system.success, '', data);
        } catch (error) {
            errors.push(error.message);
            return logger.status500(response, error, errors);
        }
    }

    // [GET] /user/company-information/:id
    async detail(request, response, next) {
        const paramsData = request.params;
        const errors = [];
        try {
            const companyInfor = await companyInformationModel.findById({
                _id: paramsData.id,
            });
            if (!companyInfor) {
                return logger.status404(
                    response,
                    system.error,
                    companyInforConstant.notFound(paramsData.id),
                );
            } else {
                return logger.status200(
                    response,
                    system.success,
                    '',
                    companyInfor,
                );
            }
        } catch (error) {
            errors.push(error.message);
            return logger.status400(response, error, errors);
        }
    }
}

module.exports = new CompanyInformationController();
