const constants = require('../Constant/constants');
const paymentModel = require('../Models/Payment/PaymentModel');
const IniStdPayBill = require('../Service/Payment/INIStdPayBill');
const qs = require('querystring');
const userModel = require('../Models/User/UserModel');
const axios = require('axios');
const moment = require('moment-timezone');
const memberShipModel = require('../Models/Manage/Membership/MembershipModel');
const google = require('./../Service/Payment/TokenGoogle');
const tracking = require('../Models/Tracking/Tracking');
const userPaymentModel = require('../Models/Payment/UserPaymentModel');
const { pushNotificationPaymentProblem } = require('../Controllers/User/Push/PushNotificationController');
const noticeTransaction = require('../Models/Notice/NoticeTransactionModel');

let options = {
	mid: process.env.MID,
	signKey: process.env.SIGNKEY,
};

const iniStdPayBill = new IniStdPayBill({
	mid: options.mid,
	signKey: options.signKey,
});

class billingJobs {
	async handle() {
		try {
			let paymentCheck = await paymentModel.find({
				idUser: {
					$ne: null,
				},
				expired_day: {
					$gte: moment().add(-19, 'minutes').toISOString(),
					$lte: moment().toISOString(),
				},
				cancelTime: null,
				deleted: false,
			});

			let cloneThis = this;

			if (!paymentCheck || !paymentCheck.length) return

			Object.entries(paymentCheck).forEach(async ([v, item]) => {
				let time_expired = new Date(item.expired_day).getTime();
				let now = new Date().getTime();
				if (time_expired < now) {
					if (item.tid && item.resultCode && item.resultCode == '00') {
						//get info payment user
						let paymentUser = await userPaymentModel.findOne({
							idUser: item.idUser,
						});
						paymentUser = paymentUser.toObject();
						let checkCard = false;

						if (paymentUser.cardNumber != item.cardNumber) {
							checkCard = true;
						}

						if (paymentUser.price != null && paymentUser.price != item.pirce) {
							item.pirce = paymentUser.price;
							item.goodname = paymentUser.goodname;
							item.currency = paymentUser.currency;
						}

						// auto billing // check billkey
						if (checkCard || !item.billKey) {
							// billing
							if (checkCard) {
								item.cardNumber = paymentUser.cardNumber;
								item.cardExpire = paymentUser.cardExpire;
								item.regNo = paymentUser.regNo;
								item.cardPw = paymentUser.cardPw;
								item.cardQuota = paymentUser.cardQuota;
								item.buyerTel = paymentUser.buyerTel;
							}
							const paymentParam = iniStdPayBill.getPaymentBilling(item);
							let urlPayment = process.env.URL_BILLING;
							await axios
								.post(urlPayment, qs.stringify(paymentParam), {
									headers: {
										'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
									},
								})
								.then(async function (res) {
									if (res.status == 200) {
										let data = res.data;
										if (data.resultCode == '00') {
											data.idUser = item.idUser;
											item = item.toObject();
											Object.assign(data, {
												price: item.price,
												goodName: item.goodName,
												buyerName: item.buyerName,
												buyerEmail: item.buyerEmail,
												buyerTel: item.buyerTel,
												regNo: item.regNo,
												cardPw: item.cardPw,
												paymethod: item.paymethod,
												cardNumber: item.cardNumber,
												cardExpire: item.cardExpire,
												cardNumberFirst: item.cardNumberFirst,
											});

											//tracking billing
											let trackingData = {};
											Object.assign(trackingData, data);
											await new tracking({
												header: 'Billing user',
												content: JSON.stringify(trackingData),
											}).save();
											cloneThis.billingApproval(data);
										} else {
											//tracking billing error
											await item.updateOne({
												deleted: true,
											});
											await noticeTransaction({
												title: 'Billing error',
												idUser: item.idUser,
												error: JSON.stringify(res.data),
											}).save();
											let trackingData = {};
											Object.assign(trackingData, data);
											await new tracking({
												header: 'Billing error',
												content: JSON.stringify(trackingData),
											}).save();
										}
									} else {
										await noticeTransaction({
											title: 'Billing error',
											idUser: item.idUser,
											error: JSON.stringify(res.data),
										}).save();
										pushNotificationPaymentProblem(
											item.idUser,
											constants.PAYMENT_PROBLEM.UNAUTHEN
										);
									}
								})
								.catch(async function (error) {
									await item.updateOne({
										deleted: true,
									});
									await noticeTransaction({
										title: 'Billing error',
										idUser: item.idUser,
										error: JSON.stringify(error),
									}).save();

									pushNotificationPaymentProblem(item.idUser, constants.PAYMENT_PROBLEM.ERROR);
									console.log(error);
								});
						} else {
							cloneThis.billingApproval(item.toObject());
						}
					} else {
						let urlPayment = process.env.URL_FORMPAY;
						let userPayment = await userPaymentModel.findOne({ idUser: item.idUser });
						let paymentParam = iniStdPayBill.getPaymentFormPay(userPayment, item);
						await axios
							.post(urlPayment, qs.stringify(paymentParam), {
								headers: {
									'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
								},
							})
							.then(async function (res) {
								if (res.status == 200) {
									let data = res.data;
									if (data.resultCode == '00') {
										Object.assign(data, paymentParam);
										let user = await userModel.findOne({
											userEmail: item.buyerEmail,
											deleted: false,
										});
										data.idUser = user._id;
										let existPayment = await paymentModel.find({
											idUser: user._id,
											deleted: false,
										});
										if (existPayment.length > 0) {
											Object.entries(existPayment).forEach(async ([v, va]) => {
												await va.updateOne({
													deleted: true,
												});
											});
										}
										data.cardNumberFirst = userPayment.cardNumberFirst;
										data.expired_day = moment().add(30, 'days');
										if (userPayment.goodName) {
											data.goodName = userPayment.goodName;
										}
										let payment = await new paymentModel(data).save();

										//update membership
										let member = await memberShipModel.findOne({
											packageName: payment.goodName,
										});

										//save card user
										let checkCardUser = await userPaymentModel.find({
											cardNumber: payment.cardNumber,
											idUser: user._id,
										});

										if (!checkCardUser.length) {
											await new userPaymentModel({
												cardNumberFirst: payment.cardNumberFirst,
												idUser: user._id,
												cardExpire: payment.cardExpire,
												regNo: payment.regNo,
												cardPw: payment.cardPw,
												cardNumber: payment.cardNumber,
												cardQuota: payment.cardQuota,
												buyerTel: payment.buyerTel,
											}).save();
										}

										if (member) {
											await user.updateOne({
												userMembership: member._id,
												memberShipStartDay: payment.createdAt,
												memberShipEndDay: payment.expired_day,
											});

											//write tracking data
											let trackingData = {};
											Object.assign(trackingData, payment.toObject());
											await new tracking({
												header: 'Success payment',
												content: JSON.stringify(trackingData),
											}).save();

											await userPaymentModel
												.findOne({ idUser: user._id })
												.updateOne({ firstPayment: true });

											// console.log('Payment success with (id: '+ item +')');
										} else {
											console.log('Member ship error (id: ' + item + ')');
										}
									} else {
										let user = await userModel.findOne({
											userEmail: item.buyerEmail,
										});
										data.idUser = user._id;

										//write tracking error
										let trackingData = {};
										Object.assign(trackingData, data);
										await new tracking({
											header: 'Payment error!',
											content: JSON.stringify(trackingData),
										}).save();

										await userPaymentModel
											.findOne({ idUser: user._id })
											.updateOne({ firstPayment: true });

										await noticeTransaction({
											title: 'FormPay error',
											idUser: item.idUser,
											error: JSON.stringify(res.data),
										}).save();

										return response.status(400).json({
											status: false,
											data: {
												resultCode: data.resultCode,
												resultMsg: data.resultMsg,
											},
										});
									}
								} else {
									await noticeTransaction({
										title: 'FormPay error',
										idUser: item.idUser,
										error: JSON.stringify(res.data),
									}).save();
									pushNotificationPaymentProblem(item.idUser, constants.PAYMENT_PROBLEM.ERROR);
								}
							})
							.catch(async function (error) {
								await noticeTransaction({
									title: 'FormPay error',
									idUser: item.idUser,
									error: JSON.stringify(error),
								}).save();
								pushNotificationPaymentProblem(item.idUser, constants.PAYMENT_PROBLEM.ERROR);
								console.log('Billing jobs error');
							});
					}
				}
			});
		} catch (error) {
			console.log(error.message);
		}
	}

	async billingApproval(param) {
		let urlPayment = process.env.URL_BILLING;
		if (param) {
			let paymentParam = iniStdPayBill.getPaymentBillApproval(param);
			await axios
				.post(urlPayment, qs.stringify(paymentParam), {
					headers: {
						'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
					},
				})
				.then(async function (res) {
					if (res.status == 200) {
						let data = res.data;
						if (data.resultCode == '00') {
							Object.assign(data, param);

							data.idUser = param.idUser;
							await paymentModel
								.find({
									resultCode: '00',
									idUser: param.idUser,
									deleted: false,
								})
								.updateMany({
									deleted: true,
								});
							delete data._id;
							data.expired_day = moment().add(30, 'days');
							let payment = await new paymentModel(data).save();

							//update membership
							let member = await memberShipModel.findOne({
								packageName: paymentParam.goodName,
							});

							let user = await userModel.findOne({
								_id: param.idUser,
							});

							if (member && user) {
								await user.updateOne({
									userMembership: member._id,
									memberShipStartDay: payment.createdAt,
									memberShipEndDay: payment.expired_day,
								});
								//tracking billing approval
								let trackingData = {};
								Object.assign(trackingData, payment.toObject());
								await new tracking({
									header: 'Approval Billing Success',
									content: JSON.stringify(trackingData),
								}).save();
							} else {
								// console.log('Member ship error, Please contact admin');
							}
						} else {
							let trackingData = {};
							Object.assign(trackingData, data);
							await new tracking({
								header: 'Approval billing error',
								content: JSON.stringify(trackingData),
							}).save();
						}
					} else {
						await noticeTransaction({
							title: 'Billing approval error',
							idUser: param.idUser,
							error: JSON.stringify(res.data),
						}).save();
						pushNotificationPaymentProblem(param.idUser, constants.PAYMENT_PROBLEM.APPROVAL_FAIL);
					}
				})
				.catch(async function (error) {
					await noticeTransaction({
						title: 'Billing approval error',
						idUser: param.idUser,
						error: JSON.stringify(error),
					}).save();
					pushNotificationPaymentProblem(param.idUser, constants.PAYMENT_PROBLEM.ERROR);
					console.log(error);
				});
		}
	}

	async removeDeleteCancel() {
		try {
			let payment = await paymentModel.find({
				deleted: false,
			});

			if (!payment || !payment.length) return

			Object.entries(payment).forEach(async ([v, item]) => {
				let now = new Date().getTime();
				let expired = new Date(item.expired_day).getTime();
				if (now > expired) {
					await userPaymentModel
						.findOne({
							idUser: item.idUser,
							firstPayment: false,
						})
						.updateOne({ firstPayment: true });
					item.deleted = true;
					await item.save();
				}
			});
		} catch (error) {
			console.log(error.message);
		}
	}
}

module.exports = new billingJobs();
