const areaCodeModel = require('../../../Models/User/AreaCodeModel');

const system = require('../../../Constant/General/SystemConstant');
const areaCodeConstant = require('../../../Constant/User/AreaCodeConstant');
const logger = require('../../../Constant/Logger/loggerConstant');

class AreaCodeController {
	// [GET] /user/area-code/
	async index(request, response, next) {
		const errors = [];
		try {
			const arrayAreaCode = await areaCodeModel.find({});
			const totalAreaCode = await areaCodeModel.countDocuments();
			const data = {
				totalAreaCode,
				arrayAreaCode,
			};
			return logger.status200(response, system.success, '', data);
		} catch (error) {
			errors.push(error.message);
			return logger.status500(response, error, errors);
		}
	}

	async test(request, response, next) {
		const formData = request.body.data;
		// console.log(icons["CN"]);
		const errors = [];
		try {
			const areaCodeData = await areaCodeModel.create(formData);
			if (!areaCodeData) {
				return logger.status200(response, system.error, 'errors');
			}

			return logger.status201(response, areaCodeData);
		} catch (error) {
			errors.push(error.message);
			return logger.status400(response, error, errors);
		}
	}

	// [GET] /user/area-code/:id
	// async detail(request, response, next) {
	//     const paramsData = request.params;
	//     const errors = [];
	//     try {
	//         const areaCode = await areaCodeModel.findById({
	//             _id: paramsData.id,
	//         });
	//         if (!areaCode) {
	//             return logger.status404(
	//                 response,
	//                 system.error,
	//                 areaCodeConstant.notFound(paramsData.id),
	//             );
	//         } else {
	//             return logger.status200(
	//                 response,
	//                 system.success,
	//                 '',
	//                 areaCode,
	//             );
	//         }
	//     } catch (error) {
	//         errors.push(error.message);
	//         return logger.status400(response, error, errors, system.error);
	//     }
	// }

	// [POST] /user/area-code/create
	// async create(request, response, next) {
	//     const formData = request.body;
	//     const errors = [];
	//     try {
	//         const areaCode = new areaCodeModel(formData);
	//         const createAreaCode = await areaCode.save();
	//         return logger.status201(
	//             response,
	//             system.success,
	//             createAreaCode,
	//         );
	//     } catch (error) {
	//         errors.push(error.message);
	//         return logger.status400(response, error, errors, system.error);
	//     }
	// }

	// [PUT] /user/area-code/:id
	// async update(request, response, next) {
	//     const paramsData = request.params;
	//     const formData = request.body;
	//     const errors = [];

	//     try {
	//         const areaCode = await areaCodeModel.findByIdAndUpdate(
	//             { _id: paramsData.id },
	//             formData,
	//             { new: true, runValidators: true },
	//         );

	//         if (!areaCode) {
	//             return logger.status404(
	//                 response,
	//                 system.error,
	//                 areaCodeConstant.notFound(paramsData.id),
	//             );
	//         }

	//         return response.status(200).json({
	//             status: system.error,
	//             msg: areaCodeConstant.msgUpdate(paramsData.id),
	//             data: areaCode,
	//         });
	//     } catch (error) {
	//         errors.push(error.message);
	//         return logger.status400(response, error, errors, system.error);
	//     }
	// }

	// [DELETE] /user/area-code/:id
	// async destroy(request, response, next) {
	//     const paramsData = request.params;
	//     const errors = [];
	//     try {
	//         const areaCode = await areaCodeModel.delete({
	//             _id: paramsData.id,
	//         });

	//         if (!areaCode) {
	//             return logger.status404(
	//                 response,
	//                 system.error,
	//                 areaCodeConstant.notFound(paramsData.id),
	//             );
	//         }

	//         return response.status(200).json({
	//             status: system.success,
	//             msg: areaCodeConstant.msgDelete(paramsData.id),
	//         });
	//     } catch (error) {
	//         errors.push(error.message);
	//         return logger.status500(response, error, errors, system.error);
	//     }
	// }
}

module.exports = new AreaCodeController();
