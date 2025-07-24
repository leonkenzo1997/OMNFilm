const logger = require("../../../Constant/Logger/loggerConstant");
const constants = require("../../../Constant/constants");
const system = require("../../../Constant/General/SystemConstant");

const parentProtectionModel = require("../../../Models/ParentProtection/ParentProtectionModel");

class ParentProtectionController {
    async create(request, response) {
        const errors = [];
        try {
            let parentProtectionData = await parentProtectionModel.create(
                request.body
            );
            return logger.status200(
                response,
                system.success,
                "",
                parentProtectionData
            );
        } catch (error) {
            errors.push(error.message);
            return logger.status400(response, error, errors);
        }
    }

    async update(request, response) {
        const errors = [];
        try {
            let parentProtectionData = await parentProtectionModel.findByIdAndUpdate(
                request.body.id,
                { $set: request.body },
                {
                    new: true,
                }
            );
            return logger.status200(
                response,
                system.success,
                "",
                parentProtectionData
            );
        } catch (error) {
            errors.push(error.message);
            return logger.status400(response, error, errors);
        }
    }

    async find(request, response) {
        const errors = [];
        try {
            let parentProtectionData = await parentProtectionModel.paginate(
                {},
                {
                    lean: true,
                }
            );
            return logger.status200(
                response,
                system.success,
                "",
                parentProtectionData
            );
        } catch (error) {
            errors.push(error.message);
            return logger.status400(response, error, errors);
        }
    }
}

module.exports = new ParentProtectionController();
