const mongoose = require('mongoose');

const userModel = require('../../../../Models/User/UserModel');

const system = require('../../../../Constant/General/SystemConstant');
const logger = require('../../../../Constant/Logger/loggerConstant');
const revenusSharingConstant = require('../../../../Constant/RevenusSharing/RevenusSharingConstant');
const constants = require('../../../../Constant/constants');
const userConstant = require('../../../../Constant/User/UserConstant');
const programModel = require('../../../../Models/Program/ProgramModel');
const rsService = require('../../../../Service/RsUser/RsFormula');
const xl = require('excel4node');
const common = require('../../../../Service/common');

const businessQuery = require('../../../../Business/QueryModel');

class RevenusSharingController {
	// [GET] /admin/manage/revenusSharing/
	async index(request, response, next) {
		const errors = [];
		try {

			if (!rsService.isEmpty(request.query['userEmail'])) {
				request.query['userType'] = [constants.USER_TYPE.RS, constants.USER_TYPE.USER];
				request.query['deleted'] = false;
	
				request.query.limit = request.query.limit || Number.MAX_SAFE_INTEGER;
				const selectField = [
					'userEmail',
					'userPhoneNumber',
					'userDOB',
					'userName',
					'userGender',
					'userID',
					'userType',
					'createdAt',
					'companyName',
				];
				const dataRS = await businessQuery.handle(userModel, request, null, selectField);
				return logger.status200(response, system.success, '', dataRS);
			} else {
				return logger.status200(response, system.success, '', []);
			}
		} catch (error) {
			errors.push(error.message);
			return logger.status500(response, error, errors);
		}
	}

	// [GET] /admin/manage/revenusSharing/:id
	async detail(request, response, next) {
		const paramsData = request.params;
		const errors = [];
		try {
			const revenusSharing = await userModel.findById({
				_id: paramsData.id,
			});
			if (!revenusSharing) {
				return logger.status404(response, system.error, revenusSharingConstant.notFound(paramsData.id));
			} else {
				return logger.status200(response, system.success, '', revenusSharing);
			}
		} catch (error) {
			errors.push(error.message);
			return logger.status400(response, error, errors);
		}
	}

	async findUser(request, response, next) {
		const queryData = request.query;
		const userEmail = queryData.userEmail;
		const errors = [];
		try {
			const selectField = ['userEmail', 'userPhoneNumber', 'userDOB', 'userName', 'userGender', 'userID'];
			const checkUser = await userModel.exists({
				userEmail,
			});

			if (!checkUser) {
				return logger.status404(response, system.error, revenusSharingConstant.notFoundEmail(userEmail));
			} else {
				const dataUSer = await businessQuery.handle(userModel, request, null, selectField);
				return logger.status200(response, system.success, '', dataUSer);
			}
		} catch (error) {
			errors.push(error.message);
			return logger.status400(response, error, errors);
		}
	}

	// [PUT] /admin/manage/revenusSharing/:id
	async update(request, response, next) {
		const paramsData = request.params;
		const formData = request.body;
		const errors = [];
		// get key in array formData
		const updates = request.keyData;
		let session = await mongoose.startSession();
		session.startTransaction();
		try {
			// const userPhoneNumber = {
			// 	areaCode: formData.areaCode,
			// 	phoneNumber: formData.phoneNumber,
			// };
			formData.userType = constants.USER_TYPE.RS;
			updates.push('userType');

			const revenusSharing = await userModel.findById(paramsData.id);

			if (!revenusSharing) {
				session.endSession();
				return logger.status404(response, system.error, revenusSharingConstant.notFound(paramsData.id));
			}

			// if (formData.areaCode && formData.phoneNumber) {
			// 	formData.userPhoneNumber = userPhoneNumber;
			// 	updates.push('userPhoneNumber');

			// 	const checkDuplicatePhone = await userModel.findOne({
			// 		userPhoneNumber,
			// 	});

			// 	if (checkDuplicatePhone && checkDuplicatePhone.id !== paramsData.id) {
			// 		session.endSession();
			// 		return logger.status404(
			// 			response,
			// 			system.error,
			// 			userConstant.existPhoneNumber,
			// 			userPhoneNumber
			// 		);
			// 	}
			// }
			// loop each key in array of formData and assign
			updates.forEach((update) => {
				// user[update]: is old data
				// formData[update]: new data
				// change old data by assigning new data
				return (revenusSharing[update] = formData[update]);
			});
			const updateVevenusSharing = await revenusSharing.save({
				session: session,
			});
			await session.commitTransaction();
			session.endSession();
			return logger.status200(
				response,
				system.success,
				revenusSharingConstant.msgUpdate(paramsData.id),
				updateVevenusSharing
			);
		} catch (error) {
			await session.abortTransaction();
			session.endSession();
			errors.push(error.message);
			return logger.status400(response, error, errors);
		}
	}

	// [GET] /admin/manage/revenusSharing/:id ->{rs user}
	async profitStatus(request, response, next) {
		const query = request.query;
		const errors = [];

		try {
			if (query.userID && query.year && query.month) {
				let user = await userModel.findOne({ _id: query.userID });
				if (user) {
					let program = await programModel.find({
						userID: query.userID,
						deleted: false,
						programCurrentStatus: { $ne: constants.PROGRAM_STATUS.DELETE },
						['programView.' + [query.year] + '.' + [query.month]]: {
							$ne: null,
						},
					});

					let data = {};
					Object.entries(program).forEach(([v, item]) => {
						data[item.programName] = item.programView[query.year][query.month];
					});

					// get total time video for user follow month
					let total_videos = {
						basic: 0,
						standard: 0,
						premium: 0,
						total: 0,
					};

					Object.entries(data).forEach(([month, viewData]) => {
						let basic = viewData.basic == 0 ? 0 : Number((viewData.basic / 60).toFixed(0));
						data[month].basic = basic;
						let standard = viewData.standard == 0 ? 0 : Number((viewData.standard / 60).toFixed(0));
						data[month].standard = standard;
						let premium = viewData.premium == 0 ? 0 : Number((viewData.premium / 60).toFixed(0));
						data[month].premium = premium;
						let total = basic + standard + premium;
						if (!rsService.isEmpty(total_videos)) {
							total_videos = {
								basic: total_videos.basic + basic,
								standard: total_videos.standard + standard,
								premium: total_videos.premium + premium,
								total: total_videos.total + total,
							};
						} else {
							total_videos = {
								basic: basic,
								standard: standard,
								premium: premium,
								total: total,
							};
						}
					});

					let programAll = await programModel.find({
						deleted: false,
						programCurrentStatus: { $ne: constants.PROGRAM_STATUS.DELETE },
						['programView.' + [query.year] + '.' + [query.month]]: {
							$ne: null,
						},
					});

					// get total time all video for user follow month
					let total_all = {};
					Object.entries(programAll).forEach(([month, pro]) => {
						if (pro.programView[query.year][query.month]) {
							let datas = pro.programView[query.year][query.month];
							let basic = datas.basic == 0 ? 0 : Number((datas.basic / 60).toFixed(0));
							let standard = datas.standard == 0 ? 0 : Number((datas.standard / 60).toFixed(0));
							let premium = datas.premium == 0 ? 0 : Number((datas.premium / 60).toFixed(0));
							if (!rsService.isEmpty(total_all)) {
								total_all = {
									basic: total_all.basic + basic,
									standard: total_all.standard + standard,
									premium: total_all.premium + premium,
								};
							} else {
								total_all = {
									basic: basic,
									standard: standard,
									premium: premium,
								};
							}
						}
					});

					//view rate
					let view_rate = {
						basic:
							total_videos.basic == 0
								? 0
								: Number(((total_videos.basic / total_all.basic) * 100).toFixed(2)),
						standard:
							total_videos.standard == 0
								? 0
								: Number(((total_videos.standard / total_all.standard) * 100).toFixed(2)),
						premium:
							total_videos.premium == 0
								? 0
								: Number(((total_videos.premium / total_all.premium) * 100).toFixed(2)),
					};
					let rate_tax = {};
					let final_price = {};
					if (user.userType == 3) {
						rate_tax = {
							rsRate: user.rsRate,
							tax: user.taxRate,
						};
						final_price = rsService.formula(true, view_rate, rate_tax);
					} else {
						final_price = rsService.formula(false, total_videos);
					}

					let profits_detail = {
						confirmed: final_price.total,
						actucal: final_price.total,
						carryover: 0,
					};

					let results = {
						year: query.year,
						month: query.month,
						username: user.userName,
						data: data,
						view_rate: view_rate,
						profits: final_price,
						total_all: total_all,
						rate_tax: rate_tax,
						profits_detail: profits_detail,
						total_videos: total_videos,
					};

					return request.exportExcel ? results : logger.status200(response, system.success, results);
				} else {
					return request.exportExcel
						? {}
						: logger.status200(response, system.error, revenusSharingConstant.dataError);
				}
			} else {
				return request.exportExcel
					? {}
					: logger.status200(response, system.error, revenusSharingConstant.userNotExist);
			}
		} catch (error) {
			errors.push(error.message);
			return logger.status400(response, error, errors);
		}
	}

	// [GET]
	async exportExcel(request, response, next) {
		const result = request.data;
		// File name
		const monthNames = [
			'January',
			'February',
			'March',
			'April',
			'May',
			'June',
			'July',
			'August',
			'September',
			'October',
			'November',
			'December',
		];
		const title = request.query.year + ' / ' + monthNames[parseInt(request.query.month) - 1];
		const fileName = title + '.xlsx';

		const wb = new xl.Workbook();
		const ws = wb.addWorksheet('Sheet 1');

		const boldCenterStyle = wb.createStyle({
			font: {
				bold: true,
				color: '#000000',
			},
			alignment: {
				horizontal: 'center',
			},
		});

		const border = {
			border: {
				left: {
					style: 'thin',
					color: '#000000',
				},
				right: {
					style: 'thin',
					color: '#000000',
				},
				top: {
					style: 'thin',
					color: '#000000',
				},
				bottom: {
					style: 'thin',
					color: '#000000',
				},
				outline: false,
			},
		};
		const stringFormat = {
			alignment: {
				horizontal: 'center',
			},
		};
		const numberFormat = {
			numberFormat: '#,##0; -#,##0; 0',
		};
		const percentFormat = {
			numberFormat: '#%; -#%; -',
		};
		const bgStyle = {
			fill: {
				type: 'pattern',
				patternType: 'solid',
				bgColor: 'ffffff',
				fgColor: 'ffffff',
			},
			font: {
				color: '#000000',
			},
		};

		const styleString = wb.createStyle(Object.assign(stringFormat, bgStyle, border));
        const styleNumber = wb.createStyle(Object.assign(numberFormat, bgStyle, border));
        const stylePercent = wb.createStyle(Object.assign(percentFormat, bgStyle, border));

		const headers = ['', 'BASIC', 'STANDARD', 'PREMIUM'];

		const TOTAL_COLUMNS = headers.length;
		ws.cell(1, 1, 1, TOTAL_COLUMNS, true).string(title).style(boldCenterStyle);
		ws.cell(2, 1, 2, TOTAL_COLUMNS, true)
			.string(common.timestampToString(Date.now()) + ' - ' + common.getStringHourMinuteFromTimestamp(Date.now()))
			.style({
				alignment: {
					horizontal: 'right',
				},
				font: {
					color: '#000000',
				},
			});
		for (let i = 1; i <= TOTAL_COLUMNS; i++) {
			switch (i) {
				default:
					ws.column(i).setWidth(35);
					break;
			}
		}

		headers.forEach((header, i) => {
			ws.cell(3, i + 1)
				.string(header)
				.style(boldCenterStyle);
		});

		let rowCount = 4;
		let i = 0;
		// Total Cumulative View Time
		ws.cell(rowCount, ++i)
			.string('Total Cumulative View Time (Minutes)' || '')
			.style(styleString);

		ws.cell(rowCount, ++i)
			.string(result && result.total_videos ? result.total_videos.basic + ' Minutes' : '0 Minutes')
			.style(styleString);

		ws.cell(rowCount, ++i)
			.string(result && result.total_videos ? result.total_videos.standard + ' Minutes' : '0 Minutes')
			.style(styleString);

		ws.cell(rowCount++, ++i)
			.string(result && result.total_videos ? result.total_videos.premium + ' Minutes' : '0 Minutes')
			.style(styleString);
		// End Total Cumulative View Time

		// Space
		rowCount++;

		// Total View by Program
		i = 0;
		ws.cell(rowCount, ++i)
			.string('Total View by Program (Minutes)' || '')
			.style(styleString);
		ws.cell(rowCount, 2, rowCount, TOTAL_COLUMNS, true).string('').style(styleString);
		rowCount++;
		for (const [key, value] of Object.entries(result.data)) {
			i = 0;
			ws.cell(rowCount, ++i)
				.string(key || '')
				.style(styleString);

			ws.cell(rowCount, ++i)
				.string(value ? value.basic + ' Minutes' : '0 Minutes')
				.style(styleString);

			ws.cell(rowCount, ++i)
				.string(value ? value.standard + ' Minutes' : '0 Minutes')
				.style(styleString);

			ws.cell(rowCount++, ++i)
				.string(value ? value.premium + ' Minutes' : '0 Minutes')
				.style(styleString);
		}
		// End Total View by Program

		// Space
		rowCount++;

		// View rate
		i = 0;
		ws.cell(rowCount, ++i)
			.string('View rate (Percent)' || '')
			.style(styleString);

		ws.cell(rowCount, ++i)
			.number(result && result.view_rate ? result.view_rate.basic / 100 : 0)
			.style(stylePercent);

		ws.cell(rowCount, ++i)
			.number(result && result.view_rate ? result.view_rate.standard / 100 : 0)
			.style(stylePercent);

		ws.cell(rowCount++, ++i)
			.number(result && result.view_rate ? result.view_rate.premium / 100 : 0)
			.style(stylePercent);
		// End View rate

		// Space
		rowCount++;

		// OMN VIEW RATE
		i = 0;
		ws.cell(rowCount, ++i)
			.string('OMN VIEW RATE (Minutes)' || '')
			.style(styleString);

		ws.cell(rowCount, ++i)
			.string(result && result.total_all ? result.total_all.basic + ' Minutes' : '0 Minutes')
			.style(styleString);

		ws.cell(rowCount, ++i)
			.string(result && result.total_all ? result.total_all.standard + ' Minutes' : '0 Minutes')
			.style(styleString);

		ws.cell(rowCount++, ++i)
			.string(result && result.total_all ? result.total_all.premium + ' Minutes' : '0 Minutes')
			.style(styleString);
		// End OMN VIEW RATE

		// Space
		rowCount++;

		// Profits
		i = 0;
		ws.cell(rowCount, ++i)
			.string('Profits (KRW)' || '')
			.style(styleString);
		ws.cell(rowCount, ++i)
			.string('Confirmed Amount')
			.style(styleString);

		ws.cell(rowCount, ++i)
			.string('Actucal Amount')
			.style(styleString);

		ws.cell(rowCount++, ++i)
			.string('Resudial Amount')
			.style(styleString);

		i = 0;
		ws.cell(rowCount, ++i)
			.string('')
			.style(styleString);
		ws.cell(rowCount, ++i)
			.string(result && result.profits_detail ? result.profits_detail.confirmed + ' KRW' : '0 KRW')
			.style(styleString);

		ws.cell(rowCount, ++i)
			.string(result && result.profits_detail ? result.profits_detail.actucal + ' KRW' : '0 KRW')
			.style(styleString);

		ws.cell(rowCount, ++i)
			.string(result && result.profits_detail ? result.profits_detail.carryover + ' KRW' : '0 KRW')
			.style(styleString);
		// End Profits

		response.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
		response.setHeader('Content-Disposition', 'attachment; filename=' + fileName);
		wb.write(fileName, response);
	}

	// [GET] /admin/manage/revenusSharing/
	async indexRS(request, response, next) {
		const errors = [];
		try {
			if (!rsService.isEmpty(request.query['user_mail'])) {
				if (request.query['user_mail'] && request.query['user_mail'] != '') {
					request.query['userEmail'] = request.query['user_mail'].trim();
				}
				delete request.query['user_mail'];
	
				request.query['userType'] = constants.USER_TYPE.RS;
				request.query['deleted'] = false;
	
				request.query.limit = request.query.limit || process.env.DEFAULT_LIMIT;
	
				const selectField = ['userEmail', 'companyName', 'userPhoneNumber', 'rsRate', 'taxRate', 'meno'];
				const dataRS = await businessQuery.handle(userModel, request, null, selectField);
				return logger.status200(response, system.success, '', dataRS);
			} else {
				return logger.status200(response, system.success, '', []);
			}
		} catch (error) {
			errors.push(error.message);
			return logger.status500(response, error, errors);
		}
	}

	// [PUT] /admin/manage/revenusSharing/udpate
	async updateRS(request, response, next) {
		const params = request.params;
		const formData = request.body;
		const errors = [];
		let paramError = [];
		const paramPut = Object.keys(formData);
		const paramAllow = ['rsRate', 'taxRate', 'meno', 'companyName', 'userPhoneNumber'];

		paramPut.filter((item) => {
			if (!paramAllow.includes(item)) {
				paramError.push(item);
			}
		});

		if (paramError.length > 0) {
			return response.status(400).json({
				status: system.error,
				msg: revenusSharingConstant.dataNotAllow,
				data: paramError,
			});
		}
		let session = await mongoose.startSession();
		try {
			if (params.id) {
				session.startTransaction();
				let userRS = await userModel.findOne({ _id: params.id, deleted: false });
				if (userRS && userRS.userType == constants.USER_TYPE.RS) {
					formData.id = params.id;
					await userRS.updateOne(formData).session(session);
					await session.commitTransaction();
					session.endSession();
					return logger.status200(response, system.success, '', formData);
				} else {
					if (userRS) {
						session.endSession();
						return logger.status400(response, revenusSharingConstant.notRS(params.id));
					} else {
						session.endSession();
						return logger.status400(response, revenusSharingConstant.notFound(params.id));
					}
				}
			} else {
				session.endSession();
				return response.status(400).json({
					status: system.error,
					msg: revenusSharingConstant.idRSMissing,
				});
			}
		} catch (error) {
			await session.abortTransaction();
			session.endSession();
			errors.push(error.message);
			return logger.status400(response, error, errors);
		}
	}
}

module.exports = new RevenusSharingController();
