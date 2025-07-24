const adminModel = require('../../../Models/User/UserModel');
const system = require('../../../Constant/General/SystemConstant');
const constantAdmin = require('../../../Constant/Admin/AdminConstant');
const logger = require('../../../Constant/Logger/loggerConstant');
const mongoose = require('mongoose');
const abusingModel = require('../../../Models/User/AbusingModel');
const moment = require('moment-timezone');
const businessQuery = require('../../../Business/QueryModel');
const rsService = require('../../../Service/RsUser/RsFormula');
const H15 = 54000;// 15 hour
const paymentModel = require('../../../Models/Payment/PaymentModel');
const signatureUtil = require('../../../Service/Payment//SignatureUtil');
const userModel = require('../../../Models/User/UserModel');
const userProgramModel = require('../../../Models/User/UserProgramModel');
const programModel = require('../../../Models/Program/ProgramModel');
const historyModel = require('../../../Models/User/HistoryAccountModel');
const action = {
	delete: 0,
	hold: 1,
	active: 2,
	sentmail: 3
}

class AbusingManagerController {
	// [GET] /abusing/
	async index(request, response, next) {
		const errors = [];
		try {
			if (!rsService.isEmpty(request.query)) {
				let startDate = moment(request.query.startDate).format('yyyyMMDD');
				let endDate = moment(request.query.endDate).format('yyyyMMDD');
				request.query.timeFlowWeek = startDate + endDate;
				delete request.query.startDate;
				delete request.query.endDate;

				// const options = {
				// 	page: 1,
				// 	limit: 10
				// };
				 
				// let aggregate = abusingModel.aggregate([{ $match: {
				// 		timeFlowWeek: request.query.timeFlowWeek
				// 		}, totalTime: {$gt: 5000}
				// 	},
				// 	{ $project: { _id: '$_id', info: { $objectToArray: '$info' }, userID: "$userID", timeFlowWeek: "$timeFlowWeek"}},
				// 	{ $unwind:  '$info' },
				// 	{ $group: { 
				// 		_id: "$_id",
				// 		totalTime: {
				// 		$sum: { 
				// 		$convert: {
				// 			input: '$info.v',
				// 			to: 'int'
				// 				}
				// 			}
				// 		},

				// 	}
				// }]);

				// aggregate = aggregate.filter((item) => {
				// 	return item.totalTime >=  H15;
				// });
				 
				// let abusing = await abusingModel.aggregatePaginate(aggregate, options)
				// 	.then(function(result) {
				// 		console.log(result);
				// 	})
				// 	.catch(function(err){
				// 		console.log(err);
				// 	});

				let abusing = await businessQuery.handle(abusingModel, request, null, null);
				let data = [];
				Object.entries(abusing.docs).forEach(([v, item]) => {
					item = item.toObject();
					item.totalTime = 0;

					Object.entries(item.info).forEach(([r, it]) => {
						item.totalTime += it
					});

					delete item.info;
					delete item.detail;

					item.totalTime = Math.floor(item.totalTime/3600) + "h" 
						+ Math.floor(item.totalTime / 60) % 60 + "ms";
					data.push(item);
				});
				abusing.docs = data;
				return logger.status200(response, system.success, '', abusing);
			} else {
				return response.status(400).json({
					status: system.error,
					data : null
				});
			}
		} catch (error) {
			errors.push(error.message);
			return logger.status500(response, error, errors, system.error);
		}
	}

	// [GET] /abusing/
	async detail(request, response, next) {
		const errors = [];
		const id = request.params.id;
		try {
			if (id) {
				//abusing user
				let abusing = await abusingModel.findOne({_id: id})
					.populate({
						path: 'detail',
						select: ['programName']

					})
					.populate({
						path: 'userID',
						select: ['userName', 'userGender', 'socialNo', 'createdAt']
					})
					.lean();
				
				abusing.detail.forEach((item, v) => {
					item.time = abusing.info[item._id];
				});

				if (abusing.userID) {
					let age = abusing.userID.socialNo.slice(0, 4) 
						+ '-' + abusing.userID.socialNo.slice(4, 6)
						+ '-' + abusing.userID.socialNo.slice(6, 8)
					abusing.userID.age = rsService.getAge(age);
				}

				delete abusing.info;
				// info payment user
				let payment = await paymentModel.findOne({
						idUser: abusing.userID._id,
						cardNumber: {$ne : null}
					})
					.sort({createdAt: -1})
					.lean();
				//info user
				let user = await userModel.findOne({
					_id: abusing.userID._id
				}).lean();

				abusing.acccountStatus = user?.deleted == true ? 'Inactive' : 'Active';

				let cardNumber = signatureUtil.decrypt(process.env.INIAPIKEY, process.env.IV, payment.cardNumber);
				abusing.paymentInfo = 'Credit' + ' - ' + cardNumber.substr(cardNumber.length - 4);

				// info accumlative
				let userProgram = await userProgramModel.findOne({
					userID: abusing.userID._id
				}).lean();

				abusing.accumlative = userProgram.accumlative ?? 0;
				abusing.accumlative = rsService.convertTime(abusing.accumlative);
				
				//user info upload
				let numberUpload = await programModel.findOne({
					userID: abusing.userID._id
				}).countDocuments();

				abusing.totalUpload = numberUpload;

				//history user
				let history = await historyModel.find({
					userID: abusing.userID._id
				})
				.select(['action', 'reason', "title"])
				.lean();
				abusing.history = history;

				if (user.holdDay) {
					abusing.hold = true;
					abusing.holdDay  = user.holdDay;
					abusing.appealDay  = user.appealDay
				} else {
					abusing.hold = false;	
				}

				return logger.status200(response, system.success, '', abusing);
			} else {
				return response.status(400).json({
					status: system.error,
					data : null
				});
			}
		} catch (error) {
			errors.push(error.message);
			return logger.status500(response, error, errors, system.error);
		}
	}

	// [PUT] /abusing/action
	async actionAccount(request, response, next) {
		//hold or delete account
		const id = request.params.id;
		const formData = request.body;
		const errors = [];
		let session = await mongoose.startSession();
		let user = {};
		session.startTransaction();
		try {
			// action = 1 -> user delete . action = 0 -> user hold
			// action = 2 -> active hold
			let isExist = userModel.findOne({_id: id});
			if (formData.action == action.delete) {
				//delete account
				if (isExist) {
					await userModel.delete({_id: id}).session(session);
				} else {
					return response.status(400).json({
						status: system.error,
						msg: 'User have deleted'
					});
				}
			} else {
				user = await userModel.findOne({_id: id});
				if (formData.action == action.hold) {
					user.holdDay = moment();
					user.appealDay = moment().add(7, 'days');
				} else {
					user.holdDay = null;
					user.appealDay = null;
				}

				await user.save(session);
			}

			let cteate = await historyModel.create([{
				userID: request.params.id,
				action: formData.action,
				reason: formData.reason,
				title: formData.title
			}], { session: session });

			await session.commitTransaction();
			session.endSession();

			return response.status(201).json({
				status: system.success,
				msg: 'Update account success',
				data: cteate,
			});
		} catch (error) {
			await session.abortTransaction();
			session.endSession();
			errors.push(error.message);
			return logger.status400(response, error, errors, system.error);
		}
	}

	// [GET] /abusing/viewHistory
	async viewHistory(request, response, next) {
		const userID = request.params.id;
		const errors = [];

		try {
			let startDate = moment(request.query.startDate).format('yyyyMMDD');
			let endDate = moment(request.query.endDate).format('yyyyMMDD');
			let timeFlowWeek = startDate + endDate;

			let abusing = await abusingModel.findOne({
				userID: userID,
				timeFlowWeek: timeFlowWeek
			})
			.populate({
				path: 'detail',
				select: ['programName']

			})
			.populate({
				path: 'userID',
				select: ['userName', 'userGender', 'socialNo', 'createdAt']
			})
			.lean();
		
			abusing.detail.forEach((item, v) => {
				item.time = abusing.info[item._id];
				item.time = rsService.convertTime(item.time, true);
			});

			return logger.status200(response, system.success, '', abusing.detail);
		} catch (error) {
			errors.push(error.message);
			return logger.status400(response, error, errors, system.error);
		}
	}

	// [GET] /abusing/listHold
	async listHold(request, response, next) {
		const errors = [];

		try {
			let start = new Date(request.query.startDate + ' 00:00:00').toUTCString();
			let end   = new Date(request.query.endDate + ' 23:59:59').toUTCString();
			let startDate = moment(request.query.startDate).format('yyyyMMDD');
			let endDate = moment(request.query.endDate).format('yyyyMMDD');
			let timeFlowWeek = startDate + endDate;
			delete request.query.startDate;
			delete request.query.endDate;

			let select = ['holdDay', 'appealDay'];
			request.query = {
				$and: [
					{ 
						holdDay: {$ne : null} 
					},
					{ 	
						holdDay: {
							$gte : start,
							$lte : end
					}
				}]
			};

			let user = await businessQuery.handle(userModel, request, null, select);

			let data = [];

			let arrayUser = user.docs.map(function (el) { return el.id; });
			
			let abusing = await abusingModel.find({
				userID : { $in: arrayUser },
				timeFlowWeek: timeFlowWeek
			}).lean();

			let history = await historyModel.find({
				userID : { $in: arrayUser }
			})
			.sort({createdAt: -1})
			.lean();

			Object.entries(user.docs).forEach(([v, item]) => {
				Object.entries(abusing).forEach(([v, itemAbusing]) => {
				if (item.id == itemAbusing.userID)	{
					 	item.data = itemAbusing;	
				 	}
				});
				Object.entries(history).forEach(([v, itemHistory]) => {
					if (item.id == itemHistory.userID)	{
							 item.history = itemHistory;	
					}
				});
				data.push(item);
			});			

			user.docs = data;
			return logger.status200(response, system.success, '', user);
		} catch (error) {
			errors.push(error.message);
			return logger.status400(response, error, errors, system.error);
		}
	}

		// [GET] /abusing/listDelete
	async listDelete(request, response, next) {
		//yet
		const errors = [];

		try {
			let start = new Date(request.query.startDate + ' 00:00:00').toUTCString();
			let end   = new Date(request.query.endDate + ' 23:59:59').toUTCString();
			let startDate = moment(request.query.startDate).format('yyyyMMDD');
			let endDate = moment(request.query.endDate).format('yyyyMMDD');
			let timeFlowWeek = startDate + endDate;
			delete request.query.startDate;
			delete request.query.endDate;

			let select = ['holdDay', 'appealDay'];
			request.query = {
				$and: [
					{ 
						holdDay: {$ne : null} 
					},
					{ 	
						holdDay: {
							$gte : start,
							$lte : end
					}
				}]
			};

			let user = await businessQuery.handle(userModel, request, null, select);

			let data = [];

			let arrayUser = user.docs.map(function (el) { return el.id; });
			
			let abusing = await abusingModel.find({
				userID : { $in: arrayUser },
				timeFlowWeek: timeFlowWeek
			}).lean();

			let history = await historyModel.find({
				userID : { $in: arrayUser }
			})
			.sort({createdAt: -1})
			.lean();

			Object.entries(user.docs).forEach(([v, item]) => {
				Object.entries(abusing).forEach(([v, itemAbusing]) => {
				if (item.id == itemAbusing.userID)	{
					 	item.data = itemAbusing;	
				 	}
				});
				Object.entries(history).forEach(([v, itemHistory]) => {
					if (item.id == itemHistory.userID)	{
							 item.history = itemHistory;	
					}
				});
				data.push(item);
			});			

			user.docs = data;
			return logger.status200(response, system.success, '', user);
		} catch (error) {
			errors.push(error.message);
			return logger.status400(response, error, errors, system.error);
		}
	}

	// [POST] /abusing/sentMail
	async sentMail(request, response, next) {
		const errors = [];

		try {

			return ;
		} catch (error) {
			errors.push(error.message);
			return logger.status400(response, error, errors, system.error);
		}
	}

	// [GET] /abusing/export
	async export(request, response, next) {
		const errors = [];

		try {

			return ;
		} catch (error) {
			errors.push(error.message);
			return logger.status400(response, error, errors, system.error);
		}
	}
}

module.exports = new AbusingManagerController();
