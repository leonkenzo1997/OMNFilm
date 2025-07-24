const system = require('../../Constant/General/SystemConstant');
const employeeConstant = require('../../Constant/Employee/EmployeeConstant');
const logger = require('../../Constant/Logger/loggerConstant');

const manageEmployeeValidation = async (request, response, next) => {
    const formData = request.body;
    const errors = [];
    try {
        // get key in array formData
        const keyData = Object.keys(formData);

        let arrField = []
        if (request.method && request.method.toLowerCase() === 'post') {
            arrField = employeeConstant.createEmployee
        } else if (request.method && request.method.toLowerCase() === 'put') {
            arrField = employeeConstant.createEmployee.filter(item => item !== 'userEmail')
        }
        const isValidOperation = keyData.every((create) => {
            return arrField.includes(create);
        });

        if (!isValidOperation) {
            const fields = (keyData.filter(item => !arrField.includes(item))).join(', ')
            return logger.status400(response, system.invalidField + fields, errors);
        }
        request.keyData = keyData;
        next();
    } catch (error) {
        errors.push(error.message);
        return logger.status400(response, error, errors);
    }
};

module.exports = manageEmployeeValidation;
