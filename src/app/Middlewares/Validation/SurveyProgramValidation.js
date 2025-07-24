const logger = require('../../Constant/Logger/loggerConstant');
const system = require('../../Constant/General/SystemConstant');
const _ = require('lodash');

class SurveyProgramValidator {
    async create(request, response, next) {
        const formData = request.body;
        const errors = [];

        const fieldsValidate = [
            'programID',
            'statistics',
            'status',
            'reason',
            'surveys',
            'template',
            'nameTemplate',
        ];

        try {
            // get key in array formData
            const keyData = Object.keys(formData);

            const valueData = Object.values(formData);

            const isValidKeys = fieldsValidate.every((item) => {
                return keyData.includes(item);
            });

            // validate values
            const isValidValues = valueData.some((item) => {
                if (typeof item !== 'number') return _.isEmpty(item)
            });

            if (!isValidKeys) {
                const fields = fieldsValidate
                    .filter((item) => !keyData.includes(item))
                    .join(', ');
                return logger.status400(
                    response,
                    system.missingField + fields,
                    system.error
                );
            }
            if (isValidValues) {
                return logger.status400(response, system.errorValue, system.error);
            }
            next();
        } catch (error) {
            errors.push(error.message);
            return logger.status400(response, error, errors, system.error);
        }
    }
}

module.exports = new SurveyProgramValidator();
