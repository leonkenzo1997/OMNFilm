const system = require('../../Constant/General/SystemConstant');

const logger = require('../../Constant/Logger/loggerConstant');
const backgroundModel = require('../../Models/Background/BackgroundModel');

const BackgroundTimeValidation = async (request, response, next) => {
	const formData = request.body;
	const start = formData.startAt;
	const end = formData.endAt;
	const errors = [];
	try {
		const arrayListBackground = await backgroundModel
			.find({
				$or: [
					{
						startAt: { $gte: start, $lte: end },
					},
					{
						endAt: { $gte: start, $lte: end },
					},
				],
			})
			.select('startAt, endAt');

		if (arrayListBackground.length === 0) {
			next();
		} else {
			data = {
				msg: `Your time is from ${start} to ${end} time exist. Please choose another time!!!!`,
				data: arrayListBackground,
			};
			return logger.status400(response, data, errors, system.error);
		}
	} catch (error) {
		errors.push(error.message);
		return logger.status400(response, error, errors, system.error);
	}
};

module.exports = BackgroundTimeValidation;
