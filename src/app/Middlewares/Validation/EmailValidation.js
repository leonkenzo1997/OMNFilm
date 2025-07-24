const system = require('../../Constant/General/SystemConstant');
const logger = require('../../Constant/Logger/loggerConstant');

const emailValidation = async (request, response, next) => {
	const formData = request.body;
	const errors = [];
	try {
		if(formData.userEmail){
			const emailRegexp = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
			const emailValidation = emailRegexp.test(formData.userEmail.toLowerCase().trim());
			if (!emailValidation) {
				return logger.status200(response, system.error, system.errorEmail);
			}
			next();
		} else {
			return logger.status400(response, system.errorField, errors);
		}
	} catch (error) {
		errors.push(error.message);
		return logger.status400(response, error, errors);
	}
};

module.exports = emailValidation;
