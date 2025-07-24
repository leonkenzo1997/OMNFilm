const videoManagePolicyModel = require('../../../Models/Manage/Footer/VideoManagePolicyModels');

const system = require('../../../Constant/General/SystemConstant');
const videoManagePolicyConstant = require('../../../Constant/VideoManagePolicy/VideoManagePolicyConstant');
const logger = require('../../../Constant/Logger/loggerConstant');

class VideoManagePolicyController {
    // [GET] /user/video-manage-policy/
    async index(request, response, next) {
        const errors = [];
        try {
            const arrayVideoManagePolicy = await videoManagePolicyModel.find(
                {},
            );

            return logger.status200(
                response,
                system.success,
                '',
                arrayVideoManagePolicy,
            );
        } catch (error) {
            errors.push(error.message);
            return logger.status500(response, error, errors);
        }
    }

    // [GET] /user/video-manage-policy/:id
    async detail(request, response, next) {
        const paramsData = request.params;
        const errors = [];
        try {
            const videoManagePolicy = await videoManagePolicyModel.findById({
                _id: paramsData.id,
            });
            if (!videoManagePolicy) {
                return logger.status404(
                    response,
                    system.error,
                    videoManagePolicyConstant.notFound(paramsData.id),
                );
            } else {
                return logger.status200(
                    response,
                    system.success,
                    '',
                    videoManagePolicy,
                );
            }
        } catch (error) {
            errors.push(error.message);
            return logger.status400(response, error, errors, system.error);
        }
    }
}

module.exports = new VideoManagePolicyController();
