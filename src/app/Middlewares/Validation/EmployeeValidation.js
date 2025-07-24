const system = require('../../Constant/General/SystemConstant');
const employeeConstant = require('../../Constant/Employee/EmployeeConstant');
const logger = require('../../Constant/Logger/loggerConstant');

const employeeValidation = async (request, response, next) => {
    const formData = request.body;
    const errors = [];
    try {
        // get key in array formData
        const keyData = Object.keys(formData);

        // check key when user input something different in system
        // method every is return true or false
        // => example: total: 4 properties if 3 true and 1 false => every return false.
        // otherwise 4 true. every return true

        const isValidOperation = keyData.every((update) => {
            return employeeConstant.allowedUpdates.includes(update);
        });

        if (!isValidOperation) {
            const fields = (keyData.filter(item => !employeeConstant.allowedUpdates.includes(item))).join(', ')
            return logger.status400(response, system.invalidField + fields, errors);
        }
        request.keyData = keyData;
        next();
    } catch (error) {
        errors.push(error.message);
        return logger.status400(response, error, errors);
    }
};

module.exports = employeeValidation;
