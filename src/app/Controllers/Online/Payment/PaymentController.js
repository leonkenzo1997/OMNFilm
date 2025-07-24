const paymentModel = require('../../../Models/Payment/PaymentModel');
const KoreanBankModel = require('../../../Models/Payment/KoreanBankModel');
const system = require('../../../Constant/General/SystemConstant');
const logger = require('../../../Constant/Logger/loggerConstant');
const moment = require('moment-timezone');
const inapp = require('../../../Service/InAppPurchase/Purchase');
const userModel = require('../../../Models/User/UserModel');
const axios = require('axios');
const google = require('./../../../Service/Payment/TokenGoogle');
const memberShipModel = require('../../../Models/Manage/Membership/MembershipModel');
const IniStdPayBill = require('../../../Service/Payment/INIStdPayBill');
const qs = require('querystring');
const tracking = require('../../../Models/Tracking/Tracking');
const userPaymentModel = require('../../../Models/Payment/UserPaymentModel');
const signatureUtil = require('../../../Service/Payment//SignatureUtil');
const mongoose = require('mongoose');
const day = 24 * 60 * 60 * 1000 * 7; // Seven day
const historyModel = require('../../../Models/User/HistoryAccountModel');

let options = {
    mid: process.env.MID,
    signKey: process.env.SIGNKEY
}

const iniStdPayBill = new IniStdPayBill({
    mid: options.mid,
    signKey: options.signKey
});

class PaymentController {
    //[GET] /payment/check-paymemnt
    async checkPayment(request, response, next) {
        const errors = [];
        const userData = request.user;
        try {
            let payment = await paymentModel.findOne({
                idUser: userData._id,
                resultCode: '00',
                deleted: false
            });
            if (payment) {
                let time = new Date().getTime() / 1000;
                let created_at = new Date(payment.createdAt).getTime() / 1000;
                if ((time - 30) <= created_at && created_at <= time) {
                    return response.status(200).json({
                        status: system.success,
                        msg: 'Payment is created',
                        cancel: false
                    });
                } else {
                    return response.status(200).json({
                        status: system.success,
                        msg: 'Payment is exist',
                        cancel: true
                    });
                }
            } else {
                return response.status(201).json({
                    status: system.error,
                    msg: 'Not have payment'
                });
            }
        } catch (error) {
            errors.push(error.message);
            return logger.status400(response, error, errors);
        }
    }

    //[GET] /payment/get-info
    async getInfo(request, response, next) {
        const errors = [];
        const userData = request.user;
        try {
            let field = [
                'buyerTel', 'applDate', 'buyerEmail', 'CARD_Num', 'goodName', 'payMethod',
                'TotPrice', 'currency', 'applTime', 'buyerName', 'resultMsg', 'custEmail',
                'CARD_PurchaseName', 'CARD_GWCode', 'payDevice', 'createdAt',
                'packageName', 'expired_day', 'cardNumberFirst', 'cancelTime'
            ];
            let payment = await paymentModel.findOne({
                idUser: userData._id,
                resultCode: '00',
                deleted: false
            }, field);

            if (!payment) {
                return response.status(201).json({
                    status: system.error,
                    msg: 'Not have payment'
                });
            }

            let day_start = moment(payment.createdAt).tz("Asia/Seoul").format('YYYY-MM-DD HH:mm');
            let day_end = moment(payment.expired_day).tz("Asia/Seoul").format('YYYY-MM-DD HH:mm');
            payment = payment.toObject();
            payment.dayStart = day_start;
            payment.dayEnd = day_end;

            if (payment) {
                return response.status(201).json({
                    status: system.success,
                    data: payment
                });
            } else {
                return response.status(201).json({
                    status: system.error,
                    msg: 'Not have payment'
                });
            }
        } catch (error) {
            errors.push(error.message);
            return logger.status400(response, error, errors);
        }
    }

    //[GET] /payment/verify
    async verify(request, response, next) {
        let formData = request.body;
        let id, restore;
        if (formData['password']) {
            inapp.config({
                applePassword: formData['password'],
                appleExcludeOldTransactions: true,
                test: process.env.TEST,
                verbose: false
            });
        }

        if (formData['type'] && formData['type'] == 'restore') restore = true;

        if (formData['receipt-data']) {
            id = formData['id'];
            formData = formData['receipt-data'];
        }

        const errors = [];
        let payment = {};
        try {
            inapp.setup()
                .then((data) => {
                    inapp.validate(formData)
                        .then(async (data) => {
                            if (data.service == 'apple') {
                                let latest_receipt = data.latest_receipt_info[0];
                                let dataSave = {
                                    environment: data.environment,
                                    is_trial_period: latest_receipt.is_trial_period,
                                    original_purchase_date: latest_receipt.original_purchase_date,
                                    original_purchase_date_ms: latest_receipt.original_purchase_date_ms,
                                    original_purchase_date_pst: latest_receipt.original_purchase_date_pst,
                                    original_transaction_id: latest_receipt.original_transaction_id,
                                    product_id: latest_receipt.product_id,
                                    purchase_date: latest_receipt.purchase_date,
                                    purchase_date_ms: latest_receipt.purchase_date_ms,
                                    purchase_date_pst: latest_receipt.purchase_date_pst,
                                    quantity: latest_receipt.quantity,
                                    transaction_id: latest_receipt.transaction_id
                                };

                                if (id) {
                                    let user = await userModel.findOne({
                                        _id: id
                                    });

                                    //check if restore
                                    if (user && restore) {
                                        let checkPayment = await paymentModel.find({
                                            idUser: user.id,
                                            original_transaction_id: latest_receipt.original_transaction_id,
                                            deleted: false
                                        });

                                        if (checkPayment.length > 0) {
                                            return response.status(200).json({
                                                status: system.success,
                                                data: checkPayment,
                                                restore: true
                                            });
                                        } else {
                                            return response.status(200).json({
                                                status: system.error,
                                                restore: false
                                            });
                                        }
                                    }

                                    if (user) {
                                        dataSave.idUser = user._id;
                                        dataSave.resultCode = '00';
                                        dataSave.buyerEmail = user.userEmail;
                                        dataSave.payMethod = 'inAppPurchase';
                                        dataSave.payDevice = (data.service == 'google' ? 'android' : 'ios');
                                        dataSave.expired_day = moment().add(30, 'days');
                                        let existPayment = await paymentModel.find({
                                            idUser: user._id,
                                            resultCode: '00',
                                            deleted: false
                                        });

                                        if (existPayment.length > 0) {
                                            Object.entries(existPayment).forEach(async ([v, va]) => {
                                                await va.updateOne({
                                                    deleted: true
                                                });
                                            });
                                        }

                                        payment = await new paymentModel(dataSave).save();

                                        //update membership
                                        let member = await memberShipModel.findOne({
                                            package_ios: dataSave.product_id
                                        });

                                        if (member) {
                                            await user.updateOne({
                                                userMembership: member._id,
                                                memberShipStartDay: payment.createdAt,
                                                memberShipEndDay: payment.expired_day
                                            })

                                            return response.status(200).json({
                                                status: system.success,
                                                data: payment
                                            });
                                        } else {
                                            return response.status(200).json({
                                                status: system.error,
                                                data: 'Member ship error, Please contact admin'
                                            });
                                        }
                                    } else {
                                        return response.status(200).json({
                                            status: system.error,
                                            msg: 'User not exist'
                                        });
                                    }
                                } else {
                                    return response.status(200).json({
                                        status: system.error,
                                        msg: 'ID user is null'
                                    });
                                }
                            } else {
                                //case is android
                                let options = {
                                    ignoreCanceled: true,
                                    ignoreExpired: true
                                };

                                let purchaseData = inapp.getPurchaseData(data, options);
                                if (purchaseData[0]) {
                                    let user = await userModel.findOne({
                                        _id: purchaseData[0].obfuscatedExternalAccountId
                                    });

                                    if (user) {
                                        //call api google acknowledge
                                        let url = process.env.URL_ACKNOWLEDGE;
                                        url = url.replace("{packageName}", purchaseData[0].packageName);
                                        url = url.replace("{productId}", purchaseData[0].productId);
                                        url = url.replace("{token}", purchaseData[0].purchaseToken);

                                        await google.token(async (res, datas) => {
                                            await axios.post(url, {
                                                    packageName: purchaseData[0].packageName,
                                                    productId: purchaseData[0].productId,
                                                    token: purchaseData[0].purchaseToken
                                                }, {
                                                    headers: {
                                                        'Content-Type': 'application/json',
                                                        'Authorization': 'Bearer ' + datas
                                                    }
                                                })
                                                .then(async function (resData) {
                                                    if (resData && resData.data == '') {
                                                        purchaseData[0].idUser = purchaseData[0].obfuscatedExternalAccountId;
                                                        purchaseData[0].resultCode = '00';
                                                        purchaseData[0].buyerEmail = user.userEmail;
                                                        purchaseData[0].payMethod = 'inAppPurchase';
                                                        purchaseData[0].payDevice = (data.service == 'google' ? 'android' : 'ios');
                                                        purchaseData[0].expired_day = moment().add(30, 'days');

                                                        // remove old payment user
                                                        let existPayment = await paymentModel.find({
                                                            idUser: user._id,
                                                            resultCode: '00',
                                                            deleted: false
                                                        });

                                                        if (existPayment.length > 0) {
                                                            Object.entries(existPayment).forEach(async ([v, va]) => {
                                                                await va.updateOne({
                                                                    deleted: true
                                                                });
                                                            });
                                                        }

                                                        purchaseData[0].product_id = purchaseData[0].productId;

                                                        payment = await new paymentModel(purchaseData[0]).save();

                                                        //update membership
                                                        let member = await memberShipModel.findOne({
                                                            membershipID: purchaseData[0].productId
                                                        });

                                                        if (member) {
                                                            await user.updateOne({
                                                                userMembership: member._id,
                                                                memberShipStartDay: payment.createdAt,
                                                                memberShipEndDay: payment.expired_day
                                                            })
                                                            return response.status(200).json({
                                                                status: system.success,
                                                                data: payment
                                                            });
                                                        } else {
                                                            return response.status(200).json({
                                                                status: system.error,
                                                                data: 'Member ship error, Please contact admin'
                                                            });
                                                        }
                                                    } else {
                                                        return response.status(200).json({
                                                            status: system.success,
                                                            data: resData
                                                        });
                                                    }
                                                })
                                                .catch(function (error) {
                                                    return response.status(400).json({
                                                        status: system.error,
                                                        error: error,
                                                        msg: 'Not call api google acknowledge'
                                                    });
                                                });
                                        });
                                    }
                                }
                            }
                        })
                        .catch((error) => {
                            return response.status(400).json({
                                status: system.error,
                                msg: error
                            });
                        });
                })
                .catch((error) => {
                    return response.status(400).json({
                        status: system.error,
                        msg: error
                    });
                });
        } catch (error) {
            return response.status(400).json({
                status: system.error,
                msg: error
            });
        }
    }

    //[GET] /payment/billing
    async billing(request, response, next) {
        const errors = [];
        let userData = request.user;
        let urlPayment = process.env.URL_BILLING;
        let formData = request.body;

        try {

            const paymentParam = iniStdPayBill.getPaymentBilling(formData, userData);
            await axios.post(urlPayment, qs.stringify(paymentParam), {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
                    }
                })
                .then(async function (res) {
                    if (res.status == 200) {
                        let data = res.data;
                        if (data.resultCode == '00') {
                            Object.assign(data, paymentParam);
                            let user = await userModel.findOne({
                                userEmail: userData.userEmail
                            });
                            data.idUser = user._id;
                            let existPayment = await paymentModel.find({
                                idUser: user._id,
                                resultCode: '00',
                                deleted: false
                            });
                            if (existPayment.length > 0) {
                                Object.entries(existPayment).forEach(async ([v, va]) => {
                                    await va.updateOne({
                                        deleted: true
                                    });
                                });
                            }

                            let payment = await new paymentModel(data).save();

                            return response.status(200).json({
                                status: true,
                                data: {
                                    resultCode: payment.resultCode,
                                    resultMsg: payment.resultMsg,
                                    cardName: payment.cardName,
                                    buyerEmail: payment.buyerEmail,
                                    buyerTel: payment.buyerTel,
                                    created_at: payment.createdAt,
                                    expired_day: payment.expired_day
                                }
                            });

                        } else {
                            let user = await userModel.findOne({
                                userEmail: userData.userEmail
                            });
                            data.idUser = user._id;
                            //save payment error
                            let payment = await new paymentModel(data).save();
                            return response.status(201).json({
                                status: false,
                                data: {
                                    resultCode: data.resultCode,
                                    resultMsg: data.resultMsg
                                }
                            });
                        }
                    }
                })
                .catch(function (error) {
                    return response.status(400).json({
                        status: false,
                        error: error
                    });
                });
        } catch (error) {
            errors.push(error.message);
            return logger.status400(response, error, errors);
        }
    }

    //[GET] /payment/billing-approval
    async billingApproval(request, response, next) {
        const errors = [];
        let urlPayment = process.env.URL_BILLING;
        let formData = request.body;
        let userData = request.user;

        try {
            let paymentData = await paymentModel.findOne({
                idUser: userData._id,
                billKey: {
                    $ne: null
                },
                deleted: false
            })

            if (paymentData) {
                let paymentParam = iniStdPayBill.getPaymentBillApproval(paymentData.toObject());
                await axios.post(urlPayment, qs.stringify(paymentParam), {
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
                        }
                    })
                    .then(async function (res) {
                        if (res.status == 200) {
                            let data = res.data;
                            if (data.resultCode == '00') {
                                Object.assign(data, paymentParam);
                                let user = await userModel.findOne({
                                    userEmail: userData.userEmail
                                });
                                data.idUser = user._id;
                                let existPayment = await paymentModel.find({
                                    idUser: user._id,
                                    resultCode: '00',
                                    deleted: false
                                });
                                if (existPayment.length > 0) {
                                    Object.entries(existPayment).forEach(async ([v, va]) => {
                                        await va.updateOne({
                                            deleted: true
                                        });
                                    });
                                }

                                data.expired_day = moment().add(30, 'days');
                                let payment = await new paymentModel(data).save();

                                //update membership
                                let member = await memberShipModel.findOne({
                                    packageName: paymentParam.goodName
                                });

                                if (member) {
                                    await user.updateOne({
                                        userMembership: member._id,
                                        memberShipStartDay: payment.createdAt,
                                        memberShipEndDay: payment.expired_day
                                    })

                                    return response.status(200).json({
                                        status: true,
                                        data: {
                                            resultCode: payment.resultCode,
                                            resultMsg: payment.resultMsg,
                                            cardName: payment.cardName,
                                            buyerEmail: payment.buyerEmail,
                                            buyerTel: payment.buyerTel,
                                            created_at: payment.createdAt,
                                            expired_day: payment.expired_day
                                        }
                                    });
                                } else {
                                    return response.status(201).json({
                                        status: system.error,
                                        data: 'Member ship error, Please contact admin'
                                    });
                                }
                            } else {
                                let user = await userModel.findOne({
                                    userEmail: userData.userEmail
                                });
                                data.idUser = user._id;
                                //save payment error
                                let payment = await new paymentModel(data).save();
                                return response.status(201).json({
                                    status: false,
                                    data: {
                                        resultCode: data.resultCode,
                                        resultMsg: data.resultMsg
                                    }
                                });
                            }
                        }
                    })
                    .catch(function (error) {
                        return response.status(400).json({
                            status: false,
                            error: error
                        });
                    });
            }
        } catch (error) {
            errors.push(error.message);
            return logger.status400(response, error, errors);
        }
    }

    //[GET] /payment/billing-cancel
    async billingCancel(request, response, next) {
        const errors = [];
        let urlPayment = process.env.URL_CANCEL;
        let userData = request.user;
        let session = await mongoose.startSession();
        session.startTransaction();

        try {
            let paymentData = await paymentModel.findOne({
                idUser: userData._id,
                tid: {
                    $ne: null
                },
                deleted: false
            });

            let userPay = await userPaymentModel.findOne({idUser: userData._id});

            if (paymentData) {
                if (userPay.firstPayment) {
                    let paymentParam = iniStdPayBill.getPaymentBillCancel(paymentData.toObject());
                    await axios.post(urlPayment, qs.stringify(paymentParam), {
                            headers: {
                                'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
                            }
                        })
                        .then(async function (res) {
                            if (res.status == 200) {
                                let data = res.data;
                                if (data.resultCode == '00') {
                                    //cancel success -> remove payment
                                    await paymentData.updateOne(data).session(session);
                                    //tracking cancel billing
                                    let trackingData = {};
                                    Object.assign(trackingData, paymentData.toObject(), data);
                                    await tracking({
                                        header: 'Cancel payment',
                                        content: JSON.stringify(trackingData)
                                    }).save({session: session});

                                    userData.deactivate = true;
                                    userData.deactivateDay = new Date();
                                    await userData.save(session);
                                    
                                    await session.commitTransaction();
                                    session.endSession();

                                    return response.status(200).json({
                                        status: true,
                                        data: data
                                    });
                                } else {
                                    let trackingData = {};
                                    Object.assign(trackingData, paymentData.toObject(), data);
                                    await tracking({
                                        header: 'Cancel payment error',
                                        content: JSON.stringify(trackingData)
                                    }).save({session: session});
    
                                    await session.commitTransaction();
                                    session.endSession();
                                    return response.status(201).json({
                                        status: false,
                                        data: data
                                    });
                                }
                            }
                        })
                        .catch(async function (error) {
                            await session.abortTransaction();
                            session.endSession();
                            return response.status(400).json({
                                status: false,
                                error: error
                            });
                        });
                } else {
                    return response.status(201).json({
                        status: true,
                        msg: 'Trial have cancel'
                    });
                }
            } else {
                paymentData = await paymentModel.findOne({
                    idUser: userData._id,
                    cancelDate: null,
                    cancelTime: null,
                    deleted: false
                });

                if (paymentData) {

                    let dataPayment = {
                        cancelDate: moment().format('yyyyMMDD'),
                        cancelTime: moment().format('HHmmss')
                    }

                    await paymentData.updateOne(dataPayment).session(session);
                    userData.deactivate = true;
                    userData.deactivateDay = new Date();
                    await userData.save(session);
                    await session.commitTransaction();
                    session.endSession();
                    return response.status(201).json({
                        status: true,
                        msg: 'Cancel trial success!'
                    });
                } else {
                    return response.status(201).json({
                        status: true,
                        msg: 'Trial have cancel'
                    });
                }
            }
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            errors.push(error.message);
            return logger.status400(response, error, errors);
        }
    }

    //[GET] /payment/info-card-user
    async infoCardUser(request, response, next) {
        const errors = [];
        let userData = request.user;
        try {

            let data = await userPaymentModel.find({
                idUser: userData._id
            }, ['cardNumberFirst']);

            return response.status(200).json({
                status: true,
                data: data
            });

        } catch (error) {
            errors.push(error.message);
            return logger.status400(response, error, errors);
        }
    }

    //[POST] /payment/add-card-user
    async addCardUser(request, response, next) {
        const errors = [];
        let user = request.user;
        let formData = request.body;
        let paramPost = Object.keys(formData);
        let paramError = [];

        let data = {};
        try {

            //only allow param
			const allowed = [
                'cardNumber', 'cardExpire', 'regNo',
                'cardPw', 'cardQuota', 'buyerTel'
            ];

			paramPost.filter((param) => {
                if (!allowed.includes(param)) {
                    paramError.push(param);
                } 
			});

            if (paramError.length > 0) {
				return logger.status400(response, system.errorField, paramError, system.error);
			}

            let cardNumber = signatureUtil.encrypt(process.env.INIAPIKEY, process.env.IV, formData.cardNumber);
            let check = await userPaymentModel.findOne({
                idUser: user._id,
                deleted: false
            });

            if (check && check.cardNumber == cardNumber) {
                return response.status(201).json({
                    status: false,
                    msg: 'Card info have exist!'
                });
            }

            let payment = iniStdPayBill.getPaymentCard(formData);
            data = await new userPaymentModel({
                cardNumberFirst: google.formatCard(formData.cardNumber),
                idUser: user._id,
                cardExpire: payment.cardExpire,
                regNo: payment.regNo,
                cardPw: payment.cardPw,
                cardNumber: payment.cardNumber,
                cardQuota: payment.cardQuota,
                buyerTel: payment.buyerTel,
                firstPayment: check.firstPayment
            }).save();

            await check.updateOne({deleted: true});

            return response.status(200).json({
                status: true,
                data: {
                    _id: data._id,
                    cardNumber: data.cardNumberFirst,
                    createAt: data.createAt,
                }
            });
        } catch (error) {
            errors.push(error.message);
            return logger.status400(response, error, errors);
        }
    }

    //[POST] /payment/history-card
    async historyCard(request, response, next) {
        const errors = [];
        let user = request.user;

        try {

            let field = [
                'buyerTel', 'applDate', 'buyerEmail', 'CARD_Num', 'goodName', 'payMethod',
                'TotPrice', 'currency', 'applTime', 'buyerName', 'resultMsg', 'custEmail',
                'CARD_PurchaseName', 'CARD_GWCode', 'payDevice', 'createdAt',
                'packageName', 'expired_day', 'cardNumberFirst', 'deleted', 'price',
                'product_id'
            ];

            let paymentUser = await paymentModel.find({
                idUser: user._id
            }, field);

            let membership = {
                "com.omnner.app.premium": "premium",
                "com.omnner.app.standard" : "standard",
                "com.omnner.app.basic": "basic",
                "1": "basic",
                "2": "standard",
                "3": "premium"
            }

            Object.entries(paymentUser).forEach(([n, pay]) => {
                pay.goodName = pay.goodName ?? membership[pay.product_id];
            });

            return response.status(200).json({
                status: true,
                data: paymentUser
            });

        } catch (error) {
            errors.push(error.message);
            return logger.status400(response, error, errors);
        }
    }

    //[GET] /payment/korean-banks
    async getKoreanBanks(request, response, next) {
        const errors = [];
        try {
            const koreanBanks = await KoreanBankModel.find();

            return logger.status200(
                response,
                true,
                '',
                koreanBanks
            );

        } catch (error) {
            errors.push(error.message);
            return logger.status400(response, error, errors);
        }
    }

    //[POST] /payment/formpay
    async formpay(request, response, next) {
        let userData = request.user;
        let formData = request.body;
        let paymentParam = {};
        let session = await mongoose.startSession();
        session.startTransaction();

        try {
            //check user have exist in user_payment
           
            let checkCardUser = await userPaymentModel.findOne({
                // cardNumber: paymentParam.cardNumber,
                idUser: userData._id,
                deleted: false
            });

            if (!checkCardUser) {
                //save user in user_payment
                paymentParam.cardNumber = signatureUtil.encrypt(process.env.INIAPIKEY, process.env.IV, formData.cardNumber);
                paymentParam.cardExpire = signatureUtil.encrypt(process.env.INIAPIKEY, process.env.IV, formData.cardExpire);
                paymentParam.regNo = signatureUtil.encrypt(process.env.INIAPIKEY, process.env.IV, formData.regNo);
                paymentParam.cardPw = signatureUtil.encrypt(process.env.INIAPIKEY, process.env.IV, formData.cardPw);
                paymentParam.cardNumberFirst = google.formatCard(formData.cardNumber);

                await userPaymentModel({
                    cardNumberFirst: paymentParam.cardNumberFirst,
                    idUser: userData._id,
                    cardExpire: paymentParam.cardExpire,
                    regNo: paymentParam.regNo,
                    cardPw: paymentParam.cardPw,
                    cardNumber: paymentParam.cardNumber,
                    cardQuota: formData.cardQuota,
                    buyerTel: formData.buyerTel
                }).save({session: session});

                //save tracking
                let trackingData = {
                    cardNumberFirst: paymentParam.cardNumberFirst,
                    idUser: userData._id,
                    cardExpire: paymentParam.cardExpire,
                    regNo: paymentParam.regNo,
                    cardPw: paymentParam.cardPw,
                    cardNumber: paymentParam.cardNumber,
                    cardQuota: formData.cardQuota,
                    buyerTel: formData.buyerTel
                };

                await tracking({
                    header: 'User id ' + userData._id + ' register trial success',
                    content: JSON.stringify(trackingData)
                }).save({session: session});

                //Check month admin set time trial
                //Create payment trial
                trackingData.expired_day = moment().add(14, 'days');
                trackingData.goodName = formData.goodName;
                trackingData.price = formData.price;
                trackingData.buyerName = formData.buyerName;
                trackingData.buyerEmail = userData.userEmail;
                trackingData.currency = formData.currency ?? 'WON'
                let payment = await paymentModel(trackingData).save({session: session});

                let member = await memberShipModel.findOne({
                    packageName: formData.goodName
                });

                if (member) {
                    await userData.updateOne({
                        userMembership: member._id,
                        memberShipStartDay: payment.createdAt,
                        memberShipEndDay: payment.expired_day
                    }).session(session);

                    await session.commitTransaction();
                    session.endSession();
                    return response.status(200).json({
                        status: true,
                        msg: 'Register trial success!'
                    });
                } else {
                    return response.status(201).json({
                        status: system.error,
                        data: 'Member ship error, Please contact admin'
                    });
                }
            } else {
                let paramSave = {};
                if (formData.card == 1) {
                    //card new
                    paymentParam.cardNumber = signatureUtil.encrypt(process.env.INIAPIKEY, process.env.IV, formData.cardNumber);
                    paymentParam.cardExpire = signatureUtil.encrypt(process.env.INIAPIKEY, process.env.IV, formData.cardExpire);
                    paymentParam.regNo = signatureUtil.encrypt(process.env.INIAPIKEY, process.env.IV, formData.regNo);
                    paymentParam.cardPw = signatureUtil.encrypt(process.env.INIAPIKEY, process.env.IV, formData.cardPw);
                    paymentParam.cardNumberFirst = google.formatCard(formData.cardNumber);
                    paramSave = {
                        cardNumberFirst: paymentParam.cardNumberFirst,
                        cardExpire: paymentParam.cardExpire,
                        regNo: paymentParam.regNo,
                        cardPw: paymentParam.cardPw,
                        cardNumber: paymentParam.cardNumber,
                        cardQuota: formData.cardQuota,
                        buyerTel: formData.buyerTel
                    }
                }

                //check user is trial
                if (!checkCardUser.firstPayment) {
                    let paymentUser = await paymentModel.findOne({idUser: userData._id, deleted: false});
                    if (paymentUser) {
                        let member = await memberShipModel.findOne({
                            packageName: formData.goodName
                        });

                        await userData.updateOne({
                            userMembership: member._id,
                        }).session(session);

                        await paymentUser.updateOne({ 
                            goodName: formData.goodName,
                            currency: formData.currency,
                            price: formData.price,
                            cardQuota: formData.cardQuota
                        }).session(session);
                    }
                } else {
                    //user is not trial
                    paramSave.currency = formData.currency;
                    paramSave.price    = formData.price;
                    paramSave.goodName = formData.goodName;
                }

                await checkCardUser.updateOne(paramSave).session(session);
                await session.commitTransaction();
                session.endSession();
                return response.status(200).json({
                    status: true,
                    msg: 'Change info payment success!'
                });
            }

        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            return response.status(400).json({
                status: system.error,
                msg: error
            });
        }
    }

    //[POST] /payment/renew
    async renewPay(request, response, next) {
        let userData = request.user;
        let formData = request.body;
        let session = await mongoose.startSession();
        session.startTransaction();

        try {
            //if 0 info old, if 1 info new (check use old or new)
            let userPayment = {};
            if (!formData.use) {
                userPayment = await userPaymentModel
                        .findOne({ idUser: userData._id})
                        .sort({ expired_day: -1})
                        .lean();
                if (userPayment) {
                    let payment = await paymentModel
                        .findOne({ idUser: userData._id})
                        .sort({ expired_day: -1})
                        .lean();
                    userPayment = Object.assign(userPayment, {
                        buyerEmail : userData.userEmail,
                        buyerName  : payment.buyerName
                    });
                    userPayment.price = userPayment.price ?? payment.price;
                    userPayment.goodName = userPayment.goodName ?? payment.goodName;
                    userPayment.currency = userPayment.currency ?? payment.currency;
                } else {
                    await session.abortTransaction();
                    session.endSession();
                    return response.status(400).json({
                        status: false,
                        msg: 'Info payment old have issue, please contact admin'
                    });
                }
            } else {
                formData.cardNumberFirst =  google.formatCard(formData.cardNumber);
                userPayment = Object.assign(formData, {buyerEmail : userData.userEmail});
            }

            let urlPayment = process.env.URL_FORMPAY;
            let paymentParam = iniStdPayBill.getPaymentRenew(userPayment);
            await axios.post(urlPayment, qs.stringify(paymentParam), {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8'
                    }
                })
                .then(async function (res) {
                    if (res.status == 200) {
                        let data = res.data;
                        if (data.resultCode == '00') {
                            Object.assign(data, paymentParam);
                            let user = await userModel.findOne({
                                userEmail: paymentParam.buyerEmail,
                                deleted: false
                            });
                            data.idUser = user._id;
                            let existPayment = await paymentModel.find({
                                idUser: user._id,
                                deleted: false
                            });
                            if (existPayment.length > 0) {
                                Object.entries(existPayment).forEach(async ([v, va]) => {
                                    await va.updateOne({
                                        deleted: true
                                    }).session(session);
                                });
                            }
                            data.cardNumberFirst = userPayment.cardNumberFirst;
                            data.expired_day = moment().add(30, 'days');
                            if (userPayment.goodName) {
                                data.goodName = userPayment.goodName;
                            }
                            let payment = await paymentModel(data).save({ session });

                            //update membership
                            let member = await memberShipModel.findOne({
                                packageName: payment.goodName
                            });

                            //save card user
                            let checkCardUser = await userPaymentModel.find({
                                cardNumber: payment.cardNumber,
                                idUser: user._id
                            });

                            if (!checkCardUser.length || formData.use) {
                                if (formData.use) {
                                    await userPaymentModel
                                        .findOne({ idUser: user._id })
                                        .updateOne({ firstPayment: true , deleted: true})
                                        .session(session); 
                                }
                                await userPaymentModel({
                                    cardNumberFirst: payment.cardNumberFirst,
                                    idUser: user._id,
                                    cardExpire: payment.cardExpire,
                                    regNo: payment.regNo,
                                    cardPw: payment.cardPw,
                                    cardNumber: payment.cardNumber,
                                    cardQuota: payment.cardQuota,
                                    buyerTel: payment.buyerTel,
                                    currency: payment.currency,
                                    goodName: payment.goodName,
                                    price: payment.price,
                                    firstPayment: true
                                }).save({ session });
                            }

                            if (member) {
                                await user.updateOne({
                                    userMembership: member._id,
                                    memberShipStartDay: payment.createdAt,
                                    memberShipEndDay: payment.expired_day
                                }).session(session);

                                //write tracking data
                                let trackingData = {};
                                Object.assign(trackingData, payment.toObject());
                                await tracking({
                                    header: 'Success payment',
                                    content: JSON.stringify(trackingData)
                                }).save({ session });
 
                                await session.commitTransaction();
                                session.endSession();

                                return response.status(200).json({
                                    status: true,
                                    data: {
                                        resultCode: payment.resultCode,
                                        resultMsg: payment.resultMsg,
                                        cardName: payment.cardName,
                                        buyerEmail: payment.buyerEmail,
                                        buyerTel: payment.buyerTel,
                                        created_at: payment.createdAt,
                                        expired_day: payment.expired_day
                                    }
                                });
                            } else {
                                console.log('Member ship error (id: ' + user._id + ')');
                            }
                        } else {
                            let user = await userModel.findOne({
                                userEmail: userData.userEmail
                            });
                            data.idUser = user._id;

                            //write tracking error
                            let trackingData = {};
                            Object.assign(trackingData, data);
                            await tracking({
                                header: 'Payment error!',
                                content: JSON.stringify(trackingData)
                            }).save({ session });

                            await userPaymentModel
                                .findOne({ idUser: user._id })
                                .updateOne({ firstPayment: true }).session(session);

                            await session.commitTransaction();
                            session.endSession();
                            return response.status(400).json({
                                status: false,
                                data: {
                                    resultCode: data.resultCode,
                                    resultMsg: data.resultMsg
                                }
                            });
                        }
                    } else {
                        pushNotificationPaymentProblem(userPaymentModel.idUser, constants.PAYMENT_PROBLEM.ERROR)
                    }
                })
                .catch(async function (error) {
                    await session.abortTransaction();
                    session.endSession();
                    console.log('Billing jobs error');
                    return response.status(400).json({
                        status: false,
                        msg: 'Payment error'
                    });
                });
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            return response.status(400).json({
                status: system.error,
                msg: error
            });
        }
    }

    //[GET] /payment/refund
    async refundPay(request, response, next) {
        const errors = [];
        let urlPayment = process.env.URL_CANCEL;
        let userData = request.user;
        let session = await mongoose.startSession();
        session.startTransaction();

        try {
            //check user payment 
            let userPay = await userPaymentModel.findOne({idUser: userData._id});
            if (userPay.firstPayment) {
                let paymentData = await paymentModel.findOne({
                    idUser: userData._id,
                    tid: {
                        $ne: null
                    }
                }).sort({expired_day: -1});

                if (paymentData) {
                    if (userData.hasService 
                        && Date.parse(paymentData.expired_day) > Date.parse(userData.hasService) 
                        && Date.parse(paymentData.createdAt) < Date.parse(userData.hasService)) {
                        //case user have use service
                        return response.status(201).json({
                            status: false,
                            msg: "Account have use service , couldn't refund"
                        });
                    } else {
                        if (Date.now() - paymentData.createdAt >= day) {
                            let paymentParam = iniStdPayBill.getPaymentBillCancel(paymentData.toObject());
                            await axios.post(urlPayment, qs.stringify(paymentParam), {
                                    headers: {
                                        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
                                    }
                                })
                                .then(async function (res) {
                                    if (res.status == 200) {
                                        let data = res.data;
                                        if (data.resultCode == '00') {
                                            //cancel success -> remove payment
                                            data.refund = false;
                                            await paymentData.updateOne(data).session(session);
                                            //tracking cancel billing
                                            let trackingData = {};
                                            Object.assign(trackingData, paymentData.toObject(), data);
                                            await tracking({
                                                header: 'Cancel payment',
                                                content: JSON.stringify(trackingData)
                                            }).save({ session: session });

                                            // Save history user
                                            await historyModel.create([{
                                                userID: userData._id,
                                                action: 2,
                                                reason: 'Hold Account',
                                                title: 'Refund pay',
                                                byUser: ''
                                            }], { session: session } );
    
                                            await session.commitTransaction();
                                            session.endSession();
    
                                            return response.status(200)
                                                .json({ status: true, data: data });
                                        } else {
                                            let trackingData = {};
                                            Object.assign(trackingData, paymentData.toObject(), data);
                                            await tracking({
                                                header: 'Cancel payment error',
                                                content: JSON.stringify(trackingData)
                                            }).save({ session: session });
    
                                            await session.commitTransaction();
                                            session.endSession();
                                            return response.status(201).json({
                                                status: false,
                                                data: data
                                            });
                                        }
                                    }
                                })
                                .catch(async function (error) {
                                    await session.abortTransaction();
                                    session.endSession();
                                    return response.status(400).json({
                                        status: false,
                                        error: error
                                    });
                                });
                        } else {
                            return response.status(201).json({
                                status: false,
                                msg: "Can't refund, please contact admin."
                            });
                        }

                    }
                }
            }
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            errors.push(error.message);
            return logger.status400(response, error, errors);
        }
    } 
}

module.exports = new PaymentController();
