const jwt = require('jsonwebtoken');
const userModel = require('../../Models/User/UserModel');
const system = require('../../Constant/General/SystemConstant');
const logger = require('../../Constant/Logger/loggerConstant');
const keyToken = process.env.KEY_GENERATE_TOKEN;
const typeToken = process.env.TYPE_TOKEN;
const mongoose = require('mongoose');

const authentication = async (request, response, next) => {
	try {
		if (mongoose.connection.readyState != 1) {
			return response.status(404).json({
				msg: system.connect,
			});
		}

		const originToken = request.header('Authorization') || request.query.token;
		const token = originToken.replace(typeToken, '');
		const decoded = jwt.verify(token, keyToken);

		const user = await userModel.findOne({
			_id: decoded._id,
			'userToken.token': token,
		}).populate({
			path: 'userDeparment',
			select: ["departmentCode"]
		});

		if (!user) {
			throw new Error();
		}

		let time = new Date().getTime() / 1000;

		if (decoded.exp < time) {
			let listToken = user.userToken.filter((tokens) => tokens.token != token);

			listToken = listToken.toObject();
			await user.updateOne({ userToken: listToken });

			return logger.status401(response, system.error, system.tokenExpired, true);
		}

		request.token = token;
		request.user = user;
		next();
	} catch (error) {
		if (error.expiredAt) {
			const originToken = request.header('Authorization') || request.query.token;
			const token = originToken.replace(typeToken, '');
			const user = await userModel.findOne({
				'userToken.token': token,
			});

			if (user) {
				let listToken = user.userToken.filter((tokens) => tokens.token != token);
				listToken = listToken.toObject();
				await user.updateOne({ userToken: listToken });
				return logger.status401(response, system.error, system.tokenExpired, true);
			}

			return logger.status401(response, system.error, system.errorAuthentication);
		}
		return logger.status401(response, system.error, system.errorAuthentication);
	}
};

module.exports = authentication;
