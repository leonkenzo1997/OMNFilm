const cache = require('memory-cache');

const sendEmail = require('../../../Service/Email/EmailService');
const userService = require('../../../Service/User/UserService');

const system = require('../../../Constant/General/SystemConstant');
const logger = require('../../../Constant/Logger/loggerConstant');
const userConstant = require('../../../Constant/User/UserConstant');

class EmailController {
	//[POST] /user/send-opt-email
	async sendOTP(request, response, next) {
		const errors = [];
		const formData = request.body;
		const userEmail = formData.userEmail;
		try {
			let codeOTP = Math.floor(Math.random() * 10000 + 10000)
				.toString()
				.substring(1);
			const timeOTPExist = 300000;
			cache.put(userEmail, codeOTP, timeOTPExist);

			const checkEmail = await userService.findByEmail(userEmail);

			if (!checkEmail) {
				return logger.status200ExistEmail(
					response,
					system.error,
					userConstant.emailNotExistInSystem,
					userEmail,
					false
				);
			} else {
				const sendOTP = await sendEmail.sendEmailForgotPassword(
					'',
					userEmail,
					codeOTP
				);

				if (!sendOTP.status) {
					return logger.status200SendOTPEmail(
						response,
						system.error,
						sendOTP.msg,
						false
					);
				} else {

					return logger.status200SendOTPEmail(
						response,
						system.success,
						system.sendOTPSuccess,
						true
					);
				}
			}
		} catch (error) {
			errors.push(error.message);
			return logger.status400(response, error, errors);
		}
	}

	//[POST] /user/send-opt-pin-code
	async sendOTPResetPinCode(request, response, next) {
		const errors = [];
		const formData = request.body;
		const userEmail = formData.userEmail;
		try {
			let codeOTP = Math.floor(Math.random() * 10000 + 10000)
				.toString()
				.substring(1);
			const timeOTPExist = 300000;
			cache.put(userEmail, codeOTP, timeOTPExist);

			const checkEmail = await userService.findByEmail(userEmail);

			if (!checkEmail) {
				return logger.status200ExistEmail(
					response,
					system.error,
					userConstant.emailNotExistInSystem,
					userEmail,
					false
				);
			} else {
				const sendOTP = await sendEmail.sendEmailResetPinCode(
					'',
					userEmail,
					codeOTP
				);

				if (!sendOTP.status) {
					return logger.status200SendOTPEmail(
						response,
						system.error,
						sendOTP.msg,
						false
					);
				} else {

					return logger.status200SendOTPEmail(
						response,
						system.success,
						system.sendOTPSuccess,
						true
					);
				}
			}
		} catch (error) {
			errors.push(error.message);
			return logger.status400(response, error, errors);
		}
	}
}

module.exports = new EmailController();
