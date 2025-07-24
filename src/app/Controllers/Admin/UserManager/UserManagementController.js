const mongoose = require('mongoose');

const system = require('../../../Constant/General/SystemConstant');
const businessQuery = require('../../../Business/QueryModel');
const logger = require('../../../Constant/Logger/loggerConstant');
const moment = require('moment-timezone');
const paymentModel = require('../../../Models/Payment/PaymentModel');
const userModel = require('../../../Models/User/UserModel');
const rsService = require('../../../Service/RsUser/RsFormula');
const userFeedbackModel = require('../../../Models/User/UserFeedbackModel');
const constants = require("../../../Constant/constants");
const xl = require("excel4node");
const common = require('../../../Service/common');
const sendEmail = require('../../../Service/Email/EmailService');
const _ = require('lodash');
const programModel = require('../../../Models/Program/ProgramModel');
const signatureUtil = require('../../../Service/Payment/SignatureUtil');
const historyModel = require('../../../Models/User/HistoryAccountModel');

class UserManagementController {
    // [GET] /admin/user-management/refund
    async indexRefund(request, response) {
        const errors = [];

        try {
            let data = [];

            let _export = null;
            let lang = null;
            if (request.query.export) {
                _export = request.query.export;
                delete request.query.export;
            }

            if (request.query.lang && request.query.lang != '') {
				lang = request.query.lang.toLowerCase();
				delete request.query.lang;
			} else {
				delete request.query.lang;
			}

            let listRefund = await paymentModel.find({
                cancelDate: { $ne: null },
                refund: { $in: [false, true] }
            }).lean();

            let userID = {
                'refund': [],
                'id': []
            }

            listRefund.forEach((itemRefund, index) => {
                userID['refund'][itemRefund.idUser] = itemRefund;
                userID['id'][index] = itemRefund.idUser;
            })

            request.query._id = { $in: userID['id'] };

            let refuntFromUser = await businessQuery.handle(userModel, request, '', '');

            Object.entries(refuntFromUser.docs).forEach(async ([v, item]) => {
                item = item.toObject();
                let temp = {};
                temp._id = userID['refund'][item._id]._id;
                temp.pgRefund = userID['refund'][item._id].PGrefund
                    ? moment(userID['refund'][item._id].PGrefund).format('yyyy-MM-DD')
                    : null;
                temp.dateJoin = moment(item.createdAt).format('yyyy-MM-DD');
                temp.phone = item?.idUser?.userPhoneNumber?.areaCode
                    + item?.idUser?.userPhoneNumber?.phoneNumber;
                temp.userName = item.userName;
                temp.userEmail = userID['refund'][item._id].buyerEmail;
                if (_export) {
                    temp.refund = userID['refund'][item._id].refund
                        ? 'Refunded' : '-';
                } else {
                    temp.refund = userID['refund'][item._id].refund;
                }

                temp.deletedAt = userID['refund'][item._id].updatedAt
                    ? moment(userID['refund'][item._id].updatedAt).format('yyyy-MM-DD') : '';
                data.push(temp);
            });

            if (_export) {
                let headers = [
                    "STT", "Status", "Name", "Creator Account",
                    "Phone Number", "Date Joined", "Deleted Date", "PG Refund Date"
                ];
                let paramField = [
                    'refund', 'userName', 'userEmail', 'phone',
                    'dateJoin', 'deletedAt', 'pgRefund'
                ];

                if (lang == constants.LANGUAGE.EN) {
                    return common.exportExcel(data, headers, paramField, 'User Refund List', response);
				} else {
					headers = [
						"연번", "상태", "이름", "크리에이터 계정",
						"연락처", "가입 일자", "계정삭제 날짜", "PG 환불 날짜"
					];
					return common.exportExcel(
						data, headers, paramField, 'User Refund List', 
						response, 20, "환불 가능 계정 내역"
					);
                } 
            }

            refuntFromUser.docs = data;

            return logger.status200(response, system.success, "", refuntFromUser);
        } catch (error) {
            errors.push(error.message);
            return logger.status500(response, error, errors);
        }
    }

    // [GET] /admin/user-management/refund/detail/id
    async refundDetail(request, response) {
        const errors = [];
        const params = request.params;
        const id = params.id;

        try {

            let refund = await paymentModel.findOne({
                _id: id
            })
                .populate({
                    path: "idUser"
                })
                .populate('userProgram')
                .lean();

            // if (!refund.idUser) {
            //     return logger.status400(response, 'Detail error, ID user null');
            // }
            //day membership
            const from = moment(refund.createdAt);
            const to = moment();

            let days = Math.abs(
                moment(from)
                    .startOf('day')
                    .diff(moment(to).startOf('day'), 'days')
            ) + 1;

            let data = {
                userName: refund.idUser.userName,
                userGender: refund.idUser.userGender,
                userAge: refund.idUser.socialNo != null
                    ? rsService.getAge(refund.idUser.socialNo)
                    : null,
                userPhone: refund.idUser.userPhoneNumber.areaCode
                    + refund.idUser.userPhoneNumber.phoneNumber,
                memberShipType: refund.goodName,
                memberShipStatus: refund.deleted,
                dateRegister: refund.idUser.createdAt,
                lastestMembership: {
                    dateMembership: refund.createdAt,
                    days: days ?? 0
                },
                viewTime: refund.userProgram.accumlative != null
                    ? rsService.convertTime(refund.userProgram.accumlative)
                    : null,
                refundStatus: refund.refund,
                pgDate: refund.PGrefund ?? null,
                idUser: refund.idUser._id
            }

            return logger.status200(response, system.success, "", data);
        } catch (error) {
            errors.push(error.message);
            return logger.status500(response, error, errors);
        }
    }

    // [GET] /admin/user-management/deactivate
    async deactivateList(request, response) {
        const errors = [];

        try {

            let data = [];
            request.query.deactivateDay = {}
            if (request.query.startDate) {
                request.query.deactivateDay = {
                    "$gte": request.query.startDate + " 00:00:00"
                };
                delete request.query.startDate;
            }
            if (request.query.endDate) {
                request.query.deactivateDay = {
                    ...request.query.deactivateDay,
                    "$lte": request.query.endDate + " 23:59:59"
                };
                delete request.query.endDate;
            }
            if (_.isEmpty(request.query.deactivateDay)) delete request.query.deactivateDay

            let _export = null;
            let lang = null;

            if (request.query.export) {
                _export = request.query.export;
                delete request.query.export;
            }

            if (request.query.lang && request.query.lang != '') {
				lang = request.query.lang.toLowerCase();
				delete request.query.lang;
			} else {
				delete request.query.lang;
			}

            request.query.deactivate = true;
            let deactivateList = await businessQuery.handle(userModel, request, null, null);

            Object.entries(deactivateList.docs).forEach(async ([v, item]) => {
                item = item.toObject();
                let temp = {};
                temp.id = item.userID;
                temp.email = item.userEmail;
                temp.phone = item.userPhoneNumber
                    ? item?.userPhoneNumber?.areaCode + item?.userPhoneNumber?.phoneNumber
                    : '';
                temp.dateJoin = item.createdAt;
                temp.dateDeactivate = new Date(item.deactivateDay);
                temp.infoExpire = new Date(moment(item.updatedAt).add(7, 'days'));
                temp._id = item._id;
                data.push(temp);
            });

            if (_export) {
                let headers = [
                    "STT", "ID", "Creator Account", "Phone Number", "Date Sign Up",
                    "Date Deactivate", "Infomation Expire"
                ];
                let paramField = [
                    'id', 'email', 'phone', 'dateJoin', 'dateDeactivate',
                    'infoExpire'
                ];

                if (lang == constants.LANGUAGE.EN) {
                    return common.exportExcel(data, headers, paramField, 'User Deactivate List', response);
				} else {
					headers = [
						"STT", "ID", "크리에이터 계정", "연락처", "가입 일자",
						"비활성화 날짜", "정보 만료"
					];

					return common.exportExcel(
						data, headers, paramField, 'User Deactivate List', 
						response, 20, "비활성화 계정 내역"
					);
                }
            }

            deactivateList.docs = data;
            return logger.status200(response, system.success, "", deactivateList);
        } catch (error) {
            errors.push(error.message);
            return logger.status500(response, error, errors);
        }
    }

    // [GET] /admin/user-management/deactivate-detail/:id
    async deactivateDetail(request, response) {
        const errors = [];
        const params = request.params;
        const id = params.id;

        try {

            let user = await userModel.findOne({
                _id: id
            })
                .populate('user-program')
                .populate({
                    path: 'count-program',
                    populate: {
                        path: 'programSeasonData.episode',
                        select: ['_id'],
                        match: { deleted: false }
                    }
                })
                .populate('user-payment')
                .lean();

            let count = {
                program: 0,
                total: 0
            };

            Object.entries(user?.['count-program']).forEach(async ([v, item]) => {
                count.program += 1;
                Object.entries(item.programSeasonData).forEach(async ([i, program]) => {
                    count.total += program.episode.length;
                });
                if (!item.programSeasonData) {
                    count.total += 1;
                }
            });

            let age = null;
            if (user.socialNo) {
                age = user.socialNo.slice(0, 4)
                    + '-' + user.socialNo.slice(4, 6)
                    + '-' + user.socialNo.slice(6, 8)
                age = rsService.getAge(age);
            }

            let data = {
                userName: user.userName,
                userGender: user.userGender,
                userEmail: user.userEmail,
                userAge: age,
                userPhone: user?.userPhoneNumber.areaCode
                    + user?.userPhoneNumber.phoneNumber,
                memberShipType: user?.['user-payment']?.goodName ?? '',
                memberShipStatus: user.userMembership == null && user.deactivate ? false : true,
                dateRegister: user.createdAt,
                totalProgram: count.program + ' Programs (total ' + count.total + ')',
                viewTime: user?.['user-program']?.accumlative != null
                    ? rsService.convertTime(user?.['user-program']?.accumlative)
                    : 0,
                cancelMembership: user?.['user-payment']?.updatedAt ?? null,
                deactivateDay: user.deactivateDay ?? null,
                destructionDay: user.destructionDay ?? new Date(moment(user.deletedAt).add(5, 'years')),
                userID: user._id
            }

            return logger.status200(response, system.success, "", data);
        } catch (error) {
            errors.push(error.message);
            return logger.status500(response, error, errors);
        }
    }

    // [GET] /admin/user-management/deleted-list
    async deletedList(request, response) {
        const errors = [];

        try {

            let data = [];
            request.query.deletedAt = {}
            if (request.query.startDate) {
                request.query.deletedAt = {
                    "$gte": new Date(request.query.startDate + " 00:00:00").toUTCString(),
                };
                delete request.query.startDate;
            }
            if (request.query.endDate) {
                request.query.deletedAt = {
                    ...request.query.deletedAt,
                    "$lte": new Date(request.query.endDate + " 23:59:59").toUTCString()
                };
                delete request.query.endDate;
            }
            if (_.isEmpty(request.query.deletedAt)) delete request.query.deletedAt

            let _export = null;
            let lang = null;
            if (request.query.export) {
                _export = request.query.export;
                delete request.query.export;
            }

            if (request.query.lang && request.query.lang != '') {
				lang = request.query.lang.toLowerCase();
				delete request.query.lang;
			} else {
				delete request.query.lang;
			}

            request.query.deleted = true;

            let deleteList = await businessQuery.handle(userModel, request, null, null);

            Object.entries(deleteList.docs).forEach(async ([v, item]) => {
                item = item.toObject();
                let temp = {};
                temp.id = Number(item.userID);
                if (!item.deactivateDay) {
                    item.deactivateDay = new Date(moment(item.deletedAt).add(-7, 'days'));
                }
                temp.holdDay = item.deactivateDay;
                temp.deletedAt = item.deletedAt;
                temp.userEmail = item.userEmail;
                if (_export) {
                    temp.status = 'Deleted';
                } else {
                    temp.status = item.deleted;
                }
                temp.destructionDay = item.destructionDay ?? new Date(moment(item.deletedAt).add(5, 'years'));
                temp._id = item._id;
                data.push(temp);
            });

            if (_export) {
                let headers = [
                    "STT", "ID", "Hold Date", "User Account", "Status",
                    "Appeal Expiration Date"
                ];
                let paramField = [
                    'id', 'holdDay', 'userEmail', 'status', 'destructionDay'
                ];

                if (lang == constants.LANGUAGE.EN) {
                    return common.exportExcel(data, headers, paramField, 'User Deleted List', response, 25);
                } else {
					headers = [
						"STT", "ID", "삭제 날짜", "크리에이터 계정",
						"상태", "만료 일자"
					];

					return common.exportExcel(
						data, headers, paramField, 'User Deleted List', 
						response, 25, "삭제된 계정 내역"
					);
                }  
            }

            deleteList.docs = data;
            return logger.status200(response, system.success, "", deleteList);
        } catch (error) {
            errors.push(error.message);
            return logger.status500(response, error, errors);
        }
    }

    // [GET] /admin/user-management/deactivate-detail/:id
    async deletedDetail(request, response) {
        const errors = [];
        const params = request.params;
        const id = params.id;

        try {

            let user = await userModel.findOne({
                _id: id,
                deleted: true
            })
                .populate('user-program')
                .populate({
                    path: 'count-program',
                    populate: {
                        path: 'programSeasonData.episode',
                        select: ['_id'],
                        // match: {deleted: false}
                    }
                })
                .populate('user-payment')
                .lean();

            let count = {
                program: 0,
                total: 0
            };

            Object.entries(user?.['count-program']).forEach(async ([v, item]) => {
                count.program += 1;
                Object.entries(item.programSeasonData).forEach(async ([i, program]) => {
                    count.total += program.episode.length;
                });
            });

            let age = null;
            if (user.socialNo) {
                age = user.socialNo.slice(0, 4)
                    + '-' + user.socialNo.slice(4, 6)
                    + '-' + user.socialNo.slice(6, 8)
                age = rsService.getAge(age);
            }

            let payment = await paymentModel.findOne({
                idUser: id,
                cardNumber: { $ne: null }
            })
                .sort({ createdAt: -1 })
                .lean();

            let cardNumber = '';
            if (payment && payment.cardNumber) {
                try {
                    cardNumber = signatureUtil.decrypt(process.env.INIAPIKEY, process.env.IV, payment.cardNumber);
                } catch (error) {

                }
            }

            if (!user.deactivateDay) {
                user.deactivateDay = new Date(moment(user.deletedAt).add(-7, 'days'));
            }

            let data = {
                userName: user.userName,
                userGender: user.userGender,
                userAge: age,
                userEmail: user.userEmail,
                dateSignedUp: user.createdAt,
                paymentInfo: cardNumber != ''
                    ? 'Credit' + ' - ' + cardNumber.substr(cardNumber.length - 4)
                    : '',
                totalProgram: count.program,
                viewTime: user?.['user-program']?.accumlative != null
                    ? rsService.convertTime(user?.['user-program']?.accumlative)
                    : 0,
                status: user.deleted ? 'Inactive' : 'Active',
                deactivateDay: user.deactivateDay ?? null,
                holdDay: user.deactivateDay ?? null,
                destructionDay: user.destructionDay ?? new Date(moment(user.deletedAt).add(5, 'years')),
                userID: user._id
            }

            return logger.status200(response, system.success, "", data);
        } catch (error) {
            // errors.push(error.message);
            errors.push('Error data');
            return logger.status500(response, error, errors);
        }
    }

    // [GET] /admin/user-management/feedback
    async feedbackList(request, response) {
        const errors = [];

        try {

            if (request.query.startDate) {
                request.query.fromDate = request.query.startDate;
                delete request.query.startDate;
            }
            if (request.query.endDate) {
                request.query.toDate = request.query.endDate;
                delete request.query.endDate;
            }

            let _export = null;
            let lang = null;

            if (request.query.export) {
                _export = request.query.export;
                delete request.query.export;
            }

            if (request.query.lang && request.query.lang != '') {
				lang = request.query.lang.toLowerCase();
				delete request.query.lang;
			} else {
				delete request.query.lang;
			}

            let feedbackList = await businessQuery.handle(userFeedbackModel, request, null, null);

            feedbackList = JSON.parse(JSON.stringify(feedbackList))

            feedbackList.docs.map(item => {
                item.feedbackStatusExport = item.feedbackStatus ? 'Yes' : 'No';
                item.id = item.userFeedbackID;
                let feedbackType = '';
                if (item.feedbackType) {
                    item.feedbackType.forEach((feebback) => {
                        feedbackType += constants.USERFEEDBACK_TYPE[feebback] + ', ';
                    });
                    item.feedbackType = feedbackType.slice(0, -2);
                }
            })

            if (_export) {
                let headers = [
                    "STT", "ID", "Feedback Date", "Feedback Type", "Program",
                    "User Account", "Feedback Status"
                ];
                let paramField = [
                    'id', 'createdAt', 'feedbackType', 'watched', 'userEmail',
                    'feedbackStatusExport'
                ];

                if (lang == constants.LANGUAGE.EN) {
                    return common.exportExcel(feedbackList.docs, headers, paramField, 'User Feedbacks', response);
                } else {
					headers = [
						"STT", "ID", "피드백 날짜", "피드백 종류",
						"프로그램", "크리에이터 계정", "피드백 상태"
					];

					return common.exportExcel(
						feedbackList.docs, headers, paramField, 'User Feedbacks', 
						response, 20, "도움이필요하세요 내역"
					);
                } 
            }
            return logger.status200(response, system.success, "", feedbackList);
        } catch (error) {
            errors.push(error.message);
            return logger.status500(response, error, errors);
        }
    }

    // [GET] /admin/user-management/deactivate-detail/:id
    async feedbackDetail(request, response) {
        const errors = [];
        const params = request.params;
        const id = params.id;

        try {

            let userFeedback = await userFeedbackModel.findOne({
                _id: id
            })
                .lean();

            let feedbackType = '';
            if (userFeedback.feedbackType) {
                userFeedback.feedbackType.forEach((feebback) => {
                    feedbackType += constants.USERFEEDBACK_TYPE[feebback] + ', ';
                });
                userFeedback.feedbackType = feedbackType.slice(0, -2);
            }

            return logger.status200(response, system.success, "", userFeedback);
        } catch (error) {
            errors.push(error.message);
            return logger.status500(response, error, errors);
        }
    }

    // [PUT] /admin/user-management/feedback/:id
    async updateFeedback(request, response) {
        const errors = [];
        const id = request.params.id;
        let formData = request.body;
        const field = Object.keys(formData);

        let session = await mongoose.startSession();
        session.startTransaction();

        try {

            const fieldAllowed = ['remark', 'feedbackStatus'];
            const isValidOperation = field.every((update) => {
                return fieldAllowed.includes(update);
            });

            if (!isValidOperation) {
                session.endSession();
                const fields = field.filter((item) => !fieldAllowed.includes(item)).join(', ');
                return logger.status400(response, system.invalidField + fields, errors);
            }

            let userFeedback = await userFeedbackModel.findOne({ _id: id });
            await userFeedback.updateOne(formData).session(session);
            await session.commitTransaction();
            session.endSession();
            return logger.status200(response, system.success, 'Update feedback success', null);
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            errors.push(error.message);
            return logger.status500(response, error, errors);
        }
    }

    // [DELETE] /admin/user-management/delete-account/:id
    async deleteAccount(request, response) {
        const userAdmin = request.user;
        const errors = [];
        const id = request.params.id;
        const data = request.body

        let session = await mongoose.startSession();
        session.startTransaction();

        try {
            let user = await userModel.findOne({ _id: id });

            if (user) {
                let del = {};
                del.deleted = true;
                if (data.reason) {
                    del.reasonDel = data.reason;
                }

                // Save history user
                await historyModel.create([{
                    userID: user._id,
                    action: 3,
                    reason: 'Deleted Account',
                    byUser: userAdmin.userName,
                    title: 'Deleted account'
                }], { session: session });

                await user.updateOne(del).session(session);
                await session.commitTransaction();
                session.endSession();
                return logger.status200(response, system.success, 'Deleted user success');
            } else {
                session.endSession();
                return logger.status404(response, system.success, 'User not found');
            }

        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            errors.push(error.message);
            return logger.status500(response, error, errors);
        }
    }

    // [POST] /admin/user-management/sent-email/:id
    async sentEmail(request, response) {
        const errors = [];
        const data = request.body;
        const id = request.params.id;

        try {

            let user = await userModel.findOne({ _id: id }).lean();

            if (user && !rsService.isEmpty(data)) {
                await sendEmail.sendEmailNormal(user.userEmail, data.body, data.title, 'emailNormal');
                return logger.status200(response,
                    system.success,
                    'Sent mail ' + user.userEmail + ' success'
                );
            } else {
                return logger.status404(response, system.success, 'User not found');
            }

        } catch (error) {
            errors.push(error.message);
            return logger.status500(response, error, errors);
        }
    }

    // [PUT] /admin/user-management/refund-detail/id
    async updateRefundDetail(request, response) {
        const errors = [];
        const params = request.params;
        const id = params.id;
        let data = request.body;
        let session = await mongoose.startSession();
        session.startTransaction();

        try {
            if (!rsService.isEmpty(data) && data.pgRefund) {
                let refund = await paymentModel.findOne({ _id: id });

                if (refund) {
                    refund.PGrefund = moment(data.pgRefund);
                    await refund.save(session);
                    await session.commitTransaction();
                    session.endSession();
                    return logger.status200(response, system.success, "", data);
                } else {
                    session.endSession();
                    return response.status(404).json({
                        status: system.error,
                        msg: "Not found refund user"
                    });
                }
            } else {
                session.endSession();
                return response.status(404).json({
                    status: system.error,
                    msg: "Data is null"
                });
            }
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            errors.push(error.message);
            return logger.status500(response, error, errors);
        }
    }

    // [PUT] /admin/user-management/refund-detail/id
    async refundSelect(request, response) {
        const errors = [];
        let data = request.body;

        try {
            if (!rsService.isEmpty(data)
                && (data.ids && !rsService.isEmpty(data.ids))
            ) {
                let refunds = await paymentModel.find({ _id: { $in: data.ids } });

                Object.entries(refunds).forEach(async ([v, item]) => {
                    await item.updateOne({ refund: true });
                });

                return logger.status200(response, system.success, "", data);
            } else {
                return response.status(404).json({
                    status: system.error,
                    msg: "Data is null"
                });
            }
        } catch (error) {
            errors.push(error.message);
            return logger.status500(response, error, errors);
        }
    }

    // [GET] /admin/user-management/viewProgramTime/id
    async viewProgramTime(request, response) {
        const errors = [];
        const params = request.params;
        const id = params.id;

        try {
            if (id) {
                if (request.query.startDate) {
                    request.query.fromDate = request.query.startDate;
                    delete request.query.startDate;
                } else {
                    request.query.fromDate = moment().format('yyyy-MM-DD');
                    delete request.query.startDate;
                }

                if (request.query.endDate) {
                    request.query.toDate = request.query.endDate;
                    delete request.query.endDate;
                } else {
                    request.query.toDate = moment().format('yyyy-MM-DD');
                    delete request.query.startDate;
                }

                request.query.userID = id;
                let program = await businessQuery.handle(programModel, request, '', '');
                let data = [];

                Object.entries(program.docs).forEach(async ([v, item]) => {
                    item = item.toObject();
                    let temp = {};
                    temp.programName = item.programName;
                    temp.id = item.programID;
                    temp.time = 0;
                    if (item.programView) {
                        Object.entries(item.programView).forEach(async ([v, programYear]) => {
                            Object.entries(programYear).forEach(async ([v, programMonth]) => {
                                temp.time += programMonth.basic ?? 0;
                                temp.time += programMonth.standard ?? 0;
                                temp.time += programMonth.premium ?? 0;
                            });
                        });
                    }
                    temp.time = rsService.convertTime(temp.time, true);
                    temp.createdAt = moment(item.createdAt).format('yyyy-MM-DD');
                    data.push(temp);
                });
                program.docs = data;
                return logger.status200(response, system.success, "", program);
            } else {
                return response.status(404).json({
                    status: system.error,
                    msg: "Data error"
                });
            }
        } catch (error) {
            errors.push(error.message);
            return logger.status500(response, error, errors);
        }
    }

    // [GET] /admin/user-management/status-account/id
    async statusAccount(request, response) {
        const errors = [];
        const params = request.params;
        const id = params.id;

        try {
            if (id) {

                request.query.userID = id;
                let history = await businessQuery.handle(historyModel, request, '', '');
                let data = [];

                Object.entries(history.docs).forEach(async ([v, item]) => {
                    item = item.toObject();
                    let temp = {};
                    temp.action = item.action;
                    temp.reason = item.reason;
                    temp.id = item.histotyID;
                    temp.byUser = item.byUser ?? '';
                    temp.createdAt = moment(item.createdAt).format('yyyy-MM-DD');
                    temp.title = item.title ?? '';
                    data.push(temp);
                });
                history.docs = data;
                return logger.status200(response, system.success, "", history);
            } else {
                return response.status(404).json({
                    status: system.error,
                    msg: "Data error"
                });
            }
        } catch (error) {
            errors.push(error.message);
            return logger.status500(response, error, errors);
        }
    }
}

module.exports = new UserManagementController();
