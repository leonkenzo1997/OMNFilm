const system = require('../../Constant/General/SystemConstant');

const logger = {
	status500: function (response, error, errorList, status) {
		return response.status(500).json({
			status: system.error,
			error: error,
			errorList: errorList,
		});
	},
	status400: function (response, error, errorList, status) {
		return response.status(400).json({
			status: system.error,
			error: error,
			errorList: errorList,
		});
	},
	status201: function (response, data) {
		return response.status(201).json({
			status: system.success,
			data: data,
		});
	},
	status200: function (response, status, msg, data) {
		return response.status(200).json({
			status: status,
			msg: msg,
			data: data,
		});
	},
	status404: function (response, status, msg) {
		return response.status(404).json({
			status: system.error,
			msg: msg,
		});
	},
	status401: function (response, status, error, tokenExpired) {
		if (!tokenExpired) {
			return response.status(401).json({
				status: system.error,
				error: error,
				tokenExpired: false,
			});
		}
		return response.status(401).json({
			status: system.error,
			error: error,
			tokenExpired: tokenExpired,
		});
	},

	status200CodeOTP: function (response, status, msg, otp, uuid) {
		return response.status(200).json({
			status: status,
			msg: msg,
			codeOTP: otp,
			UUID: uuid,
		});
	},
	status200ExistEmail: function (response, status, msg, data, exist) {
		return response.status(200).json({
			status: status,
			msg: msg,
			data: data,
			existEmail: exist,
		});
	},
	status200SendOTPEmail: function (response, status, msg, otp) {
		return response.status(200).json({
			status: status,
			sendOTP: otp,
			msg: msg,
		});
	},
	status200Msg: function (response, status, msg) {
		return response.status(200).json({
			status: status,
			msg: msg,
		});
	},
	status200Data: function (response, status, data) {
		return response.status(200).json({
			status: status,
			data: data,
		});
	},
	status200PhoneNumberExist: function (response, status, msg, data, exist) {
		return response.status(200).json({
			status: status,
			msg: msg,
			data: data,
			phoneNumberExist: exist,
		});
	},
	status200CheckpinCode: function (response, status, msg, data) {
		return response.status(200).json({
			status: status,
			msg: msg,
			isMatchPinCode: data,
		});
	},
	status200Like: function (response, status, data, msg) {
		return response.status(200).json({
			status: status,
			isLike: data,
			msg: msg,
		});
	},
	status200Unlike: function (response, status, data, msg) {
		return response.status(200).json({
			status: status,
			isUnlike: data,
			msg: msg,
		});
	},
	status200MyList: function (response, status, data, msg) {
		return response.status(200).json({
			status: status,
			isMyList: data,
			msg: msg,
		});
	},
	status403: function (response, msg) {
		return response.status(403).json({
			status: system.error,
			msg: msg,
		});
	},
};

module.exports = logger;
