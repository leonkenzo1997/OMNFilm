const programModel = require('../../../Models/Program/ProgramModel');

const system = require('../../../Constant/General/SystemConstant');
const logger = require('../../../Constant/Logger/loggerConstant');
const rsService = require('../../../Service/RsUser/RsFormula');
const moment = require('moment-timezone');
const McashSeed = require('../../../../app/Service/Cipher/McashSeed');
const rsModel = require('../../../Models/RS/RSModel');
const constants = require('../../../Constant/constants');
const userModel = require('../../../Models/User/UserModel');
const memberShipModel = require('../../../Models/Manage/Membership/MembershipModel');
const ObjectId = require('mongoose').Types.ObjectId;
const businessQuery = require('../../../Business/QueryModel');
const mongoose = require('mongoose');
const rsConstants = require('../../../Constant/RevenusSharing/RevenusSharingConstant')
const MessageModel = require('../../../Models/Message/MessageModel')
const notificationModel = require('../../../Models/Push/UserPushNotificationModel')

class RsUserController {
    // [GET] /offline/rs-user/
    async revenue(request, response, next) {
        const user = request.user;
        const query = request.query;
        const errors = [];

        try {
            if (query.year) {
                let data = {};
                let program = await programModel.find({
                    userID: user.id,
                    deleted: false,
                    ['programView.' + [query.year]]: {
                        $ne: null
                    }
                });

                Object.entries(program).forEach(([v, item]) => {
                    if (item.programView &&
                        item.programView[query.year]
                    ) {
                        Object.assign(data, {
                            [item.programName]: item.programView[query.year]
                        });
                    }
                });

                let dataMonth = {};

                Object.entries(data).forEach(([name, item]) => {
                    Object.entries(item).forEach(([k, viewData]) => {
                        let basic = Number((viewData.basic / 60).toFixed(0));
                        let standard = Number((viewData.standard / 60).toFixed(0));
                        let premium = Number((viewData.premium / 60).toFixed(0));

                        if (dataMonth[k]) {
                            dataMonth[k] = {
                                basic: dataMonth[k].basic + basic,
                                standard: dataMonth[k].standard + standard,
                                premium: dataMonth[k].premium + premium
                            }
                        } else {
                            dataMonth[k] = {
                                basic: basic,
                                standard: standard,
                                premium: premium
                            }
                        }
                    });
                });

                //total all program 
                program = await programModel.find({
                    deleted: false,
                    ['programView.' + [query.year]]: {
                        $ne: null
                    }
                });

                let time_all = {};

                Object.entries(program).forEach(([v, item]) => {
                    if (item.programView &&
                        item.programView[query.year]
                    ) {
                        Object.entries(item.programView[query.year]).forEach(([k, viewData]) => {
                            let basic = Number((viewData.basic / 60).toFixed(0));
                            let standard = Number((viewData.standard / 60).toFixed(0));
                            let premium = Number((viewData.premium / 60).toFixed(0));
                            if (time_all[k]) {
                                time_all[k] = {
                                    basic: time_all[k].basic + basic,
                                    standard: time_all[k].standard + standard,
                                    premium: time_all[k].premium + premium
                                }
                            } else {
                                time_all[k] = {
                                    basic: basic,
                                    standard: standard,
                                    premium: premium
                                }
                            }
                        });
                    }
                });

                let view_rate = {};
                let final_price = {};

                Object.entries(dataMonth).forEach(([v, item]) => {
                    if (time_all[v]) {
                        let basic_view = 0;
                        let standard_view = 0;
                        let premium_view = 0;

                        if (user.userType == constants.USER_TYPE.RS) {
                            if (item.basic > 0) {
                                basic_view = Number(item.basic / time_all[v].basic) * 100
                            } else {
                                basic_view = 0;
                            }

                            if (item.standard > 0) {
                                standard_view = Number(item.standard / time_all[v].standard) * 100
                            } else {
                                standard_view = 0;
                            }

                            if (item.premium > 0) {
                                premium_view = Number(item.premium / time_all[v].premium) * 100
                            } else {
                                premium_view = 0
                            }

                            view_rate = {
                                basic: basic_view,
                                standard: standard_view,
                                premium: premium_view
                            }

                            let rate_tax = {
                                rsRate: user.rsRate,
                                tax: user.taxRate
                            }
                            final_price[v] = rsService.formula(true, view_rate, rate_tax);
                        } else {
                            final_price[v] = rsService.formula(false, dataMonth[v]);
                        }
                        final_price[v].rate = user.rsRate;
                        final_price[v].tax = user.taxRate;
                        final_price[v].withdrawled = final_price[v].total;
                    }
                });

                let monthAvailable = Number(moment().format('MM'));
                let yaerAvailable = Number(moment().format('yyyy'));
                if (query.year < yaerAvailable) {
                    monthAvailable = 12;
                }
                // Add month missing in data
                for (let i = 1; i <= monthAvailable; i++) {
                    if (final_price[i]) {

                    } else {
                        final_price[i] = {
                            "basic": 0,
                            "standard": 0,
                            "premium": 0,
                            "total": 0,
                            "rate": user.rsRate,
                            "tax": user.taxRate,
                            "withdrawled": 0
                        };
                    }
                }

                let results = {
                    final_price: final_price
                }

                return logger.status200(response, system.success, '', results);
            } else {
                return response.status(400).json({
                    status: system.error,
                    msg: rsConstants.dataError,
                });
            }
        } catch (error) {
            errors.push(error.message);
            return logger.status500(response, error, errors);
        }
    }

    // [GET] /offline/rs-user/
    async payment(request, response, next) {
        const user = request.user;
        const query = request.query;
        const errors = [];

        try {
            if (user.userType === constants.USER_TYPE.RS) {
                let data = {};
                let program = await programModel.find({
                    userID: user.id
                });
                Object.entries(program).forEach(([v, item]) => {
                    Object.assign(data, {
                        [item.programName]: item.programView[query.year][0][query.month]
                    });
                });

                let total = {
                    'total': 0,
                    'basic': 0,
                    'standard': 0,
                    'premium': 0
                };

                Object.entries(data).forEach(([name, item]) => {
                    data[name] = {
                        'basic': Number((item.basic / 60).toFixed(0)),
                        'standard': Number((item.standard / 60).toFixed(0)),
                        'premium': Number((item.premium / 60).toFixed(0))
                    }
                    let basic = Number((item.basic / 60).toFixed(0));
                    let standard = Number((item.standard / 60).toFixed(0));
                    let premium = Number((item.premium / 60).toFixed(0));

                    total.total += basic + standard + premium;
                    total.basic += basic;
                    total.standard += standard;
                    total.premium += premium;
                });

                let results = {
                    total: total.total,
                    total_basic: total.basic,
                    total_standard: total.standard,
                    total_premium: total.premium,
                    result: data
                }

                return logger.status200(response, system.success, '', results);
            } else {
                return response.status(400).json({
                    status: system.error,
                    msg: rsConstants.permissionError,
                });
            }
        } catch (error) {
            errors.push(error.message);
            return logger.status500(response, error, errors);
        }
    }

    // [GET] /offline/rs-list-year/
    async listYear(request, response, next) {
        const user = request.user;
        const query = request.query;
        const errors = [];

        try {
            if (query.year && query.month) {
                let program = await programModel.find({
                    userID: user.id,
                    deleted: false,
                    programCurrentStatus: { $ne: constants.PROGRAM_STATUS.DELETE },
                    ['programView.' + [query.year] + '.' + [query.month]]: {
                        $ne: null
                    }
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
                    total: 0
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
                            total: total_videos.total + total
                        }
                    } else {
                        total_videos = {
                            basic: basic,
                            standard: standard,
                            premium: premium,
                            total: total
                        }
                    }
                });

                let programAll = await programModel.find({
                    deleted: false,
                    programCurrentStatus: { $ne: constants.PROGRAM_STATUS.DELETE },
                    ['programView.' + [query.year] + '.' + [query.month]]: {
                        $ne: null
                    }
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
                                premium: total_all.premium + premium
                            }
                        } else {
                            total_all = {
                                basic: basic,
                                standard: standard,
                                premium: premium
                            }
                        }
                    }
                });

                //view rate
                let view_rate = {
                    basic: total_videos.basic == 0 ? 0 : Number(((total_videos.basic / total_all.basic) * 100).toFixed(2)),
                    standard: total_videos.standard == 0 ? 0 : Number(((total_videos.standard / total_all.standard) * 100).toFixed(2)),
                    premium: total_videos.premium == 0 ? 0 : Number(((total_videos.premium / total_all.premium) * 100).toFixed(2))
                };
                let rate_tax = {};
                let final_price = {};
                if (user.userType == 3) {
                    rate_tax = {
                        rsRate: user.rsRate,
                        tax: user.taxRate
                    }
                    final_price = rsService.formula(true, view_rate, rate_tax);
                } else {
                    final_price = rsService.formula(false, view_rate);
                }

                let profits_detail = {
                    confirmed: final_price.total,
                    actucal: final_price.total,
                    carryover: 0
                }

                let results = {
                    year: query.year,
                    month: query.month,
                    username: user.userName,
                    data: data,
                    view_rate: view_rate,
                    profits: final_price,
                    rate_tax: rate_tax,
                    total_all: total_all,
                    profits_detail: profits_detail,
                    total_videos: total_videos
                }

                return request.exportExcel ? results : logger.status200(response, system.success, '', results);
            } else {
                return request.exportExcel ? {} : response.status(400).json({
                    status: system.error,
                    msg: rsConstants.dataError,
                });
            }
        } catch (error) {
            errors.push(error.message);
            return logger.status500(response, error, errors);
        }
    }

    // [GET] /offline/rs-list-year/
    async requestProfit(request, response, next) {
        const user = request.user;
        const formData = request.body;
        const errors = [];

        let session = await mongoose.startSession();
        session.startTransaction();
        try {
            let mcashSeed = new McashSeed();
            let day = Number(moment().tz("Asia/Seoul").format('DD'));
            // if (day >= 1 && day <= 5) {
                let month = Number(moment().tz("Asia/Seoul").format('MM'));
                let year = Number(moment().tz("Asia/Seoul").format('YYYY'));

                if (month == 1) {
                    month = 12;
                    year = year - 1;
                } else {
                    month--;
                }

                let rs = await rsModel.findOne({
                    deleted: false,
                    userID: user._id,
                    date: month + '-' + year
                });

                if (rs && rs.request == false) {
                    let payable = Number(mcashSeed.decodeString(rs.payable, process.env.KEYPROFIT).replace(/\0/g, ''));
                    let residual = Number(mcashSeed.decodeString(rs.residual, process.env.KEYPROFIT).replace(/\0/g, ''));
                    if (residual >= formData.payable) {
                        payable = String(formData.payable);
                        rs.payable = mcashSeed.encodeString(payable, process.env.KEYPROFIT);
                        rs.request = true;
                        rs.able = false;
                        rs.hasConfirm = false;
                        await rs.save({ session: session });

                        const title = `Profit Request`
                        const content = `
                        ${user.userName}  님

                        21년 1월 급여 신청이 완료되었습니다. 급여는 신청한 달의
                        10일에 지급되며 어뷰징, 개인정보 불일치, 계좌 정보 불일치
                        등으로 급여 지급이 취소될 수 있습니다. 자세한 사항은 이용
                        약관에서 확인하실 수 있습니다.`
                        // Create message
                        const message = new MessageModel({
                            title,
                            content,
                            senderID: user._id,
                            receiver: user._id,
                            receiverEmail: user.userEmail,
                            type: constants.MESSAGE_TYPE.AUTO,
                            category: constants.MESSAGE_CATEGORY.PROFIT,
                            display: constants.DISPLAY_NOTIFICATION.OFFLINE,
                        })
                        await message.save({ session: session });

                        await new notificationModel({
                            senderID: user._id,
                            receiverID: user._id,
                            title: 'Profit Request',
                            body: {
                                profitID: rs.id,
                                type: constants.NOTIFICATION_BODY_TYPE.PROFIT,
                                title,
                                message: content,
                                category: constants.CATEGORY_NOTIFICATION.PAYMENT
                            },
                            display: constants.DISPLAY_NOTIFICATION.OFFLINE,
                        }).save({ session: session });

                        if (sockets)
                            sockets.emit(constants.MESSAGES_NOTIFICATION.OTHER_MESSAGES, {
                                userIDs: [rs.userID],
                            });

                        await session.commitTransaction();
                        session.endSession();
                        return response.status(200).json({
                            status: system.success,
                            msg: rsConstants.confirmSuccess
                        });
                    } else {
                        await session.abortTransaction();
                        session.endSession();
                        return response.status(201).json({
                            status: system.error,
                            msg: 'Price request larger confirmed!'
                        });
                    }

                } else {
                    await session.abortTransaction();
                    session.endSession();
                    if (rs.able || rs.hasConfirm) {
                        return response.status(201).json({
                            status: system.error,
                            msg: 'Profit only request once.'
                        });
                    } else {
                        return response.status(201).json({
                            status: system.error,
                            msg: rsConstants.dataError
                        });
                    }
                }
            // } else {
            //     await session.abortTransaction();
            //     session.endSession();
            //     return response.status(200).json({
            //         status: system.error,
            //         msg: "Can't request profit.Please only request profit from 1 to 5 monthly or user have sent request"
            //     });
            // }
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            errors.push(error.message);
            return logger.status500(response, error, errors);
        }
    }

    // [GET] /offline/rs-list-year/
    async profit(request, response, next) {
        const user = request.user;
        const errors = [];

        try {
            let mcashSeed = new McashSeed();
            let month = Number(moment().tz("Asia/Seoul").format('MM'));
            let year = Number(moment().tz("Asia/Seoul").format('YYYY'));

            if (month == 1) {
                month = 12;
                year = year - 1;
            } else {
                month--;
            }

            let select = [
                'date',
                'confirmed',
                'payable',
                'residual',
                'forward',
                'request',
                'able',
                'hasConfirm',
                'ofMonth'
            ];

            let rs = await rsModel.findOne({
                deleted: false,
                userID: user._id,
                date: month + '-' + year
            }, select);

            let data = {};
            if (rs) {
                data = {
                    useID: user._id,
                    confirmed: Number(mcashSeed.decodeString(rs.confirmed, process.env.KEYPROFIT).replace(/\0/g, '')),
                    payable: Number(mcashSeed.decodeString(rs.payable, process.env.KEYPROFIT).replace(/\0/g, '')),
                    residual: Number(mcashSeed.decodeString(rs.residual, process.env.KEYPROFIT).replace(/\0/g, '')),
                    forward: Number(mcashSeed.decodeString(rs.forward, process.env.KEYPROFIT).replace(/\0/g, '')),
                    request: rs.request,
                    hasConfirm: rs.hasConfirm,
                    able: rs.able,
                    ofMonth: rs.ofMonth
                }
            } else {
                data = {
                    useID: user._id,
                    confirmed: 0,
                    payable: 0,
                    residual: 0,
                    forward: 0,
                    request: false,
                    hasConfirm: false,
                    able: false,
                    ofMonth: ''
                }
            }

            return response.status(200).json({
                status: system.success,
                data: data
            });
        } catch (error) {
            errors.push(error.message);
            return logger.status500(response, error, errors);
        }
    }

    // [GET] /offline/rs-list-year/
    async profitFollowMonth(request, response, next) {
        const user = request.user;
        const query = request.query;
        const errors = [];

        try {
            if (query.month && query.year) {
                let mcashSeed = new McashSeed();
                let month = query.month;
                let year = query.year;
                let userID = user._id;

                if (user.userType == 1 && query.userID) {
                    userID = query.userID;
                }

                if (month == 1) {
                    month = 12;
                    year = year - 1;
                }

                let select = [
                    'date',
                    'confirmed',
                    'payable',
                    'residual',
                    'forward',
                    'request',
                    'able',
                    'hasConfirm',
                    'info',
                    'ofMonth'
                ];

                let rs = await rsModel.findOne({
                    deleted: false,
                    userID: userID,
                    date: month + '-' + year
                }, select);

                let data = {};
                if (rs) {
                    data = {
                        userID: userID,
                        confirmed: Number(mcashSeed.decodeString(rs.confirmed, process.env.KEYPROFIT).replace(/\0/g, '')),
                        payable: Number(mcashSeed.decodeString(rs.payable, process.env.KEYPROFIT).replace(/\0/g, '')),
                        residual: Number(mcashSeed.decodeString(rs.residual, process.env.KEYPROFIT).replace(/\0/g, '')),
                        forward: Number(mcashSeed.decodeString(rs.forward, process.env.KEYPROFIT).replace(/\0/g, '')),
                        request: rs.request,
                        able: rs.able,
                        hasConfirm: rs.hasConfirm,
                        info: rs.info ?? [],
                        ofMonth: rs.ofMonth
                    }
                } else {
                    data = {
                        userID: userID,
                        confirmed: 0,
                        payable: 0,
                        residual: 0,
                        forward: 0,
                        request: false,
                        able: false,
                        hasConfirm: false,
                        info: [],
                        ofMonth: ''
                    }
                }

                return response.status(200).json({
                    status: system.success,
                    data: data
                });
            } else {
                return response.status(201).json({
                    status: system.error,
                    msg: rsConstants.dataError
                });
            }

        } catch (error) {
            errors.push(error.message);
            return logger.status500(response, error, errors);
        }
    }

    // [GET] /offline/rs-list-year/
    async infoZendesk(request, response, next) {
        const query = request.query;
        const errors = [];

        try {
            if ((query.mail || query.search) && query.month && query.year) {
                let decode = new McashSeed();
                let user = {};
                if (query.search) {
                    query.search = decode.decodeString(query.search, process.env.KEYPROFIT).replace(/\0/g, '');
                    if (ObjectId.isValid(query.search)) {
                        user = await userModel.findOne({ _id: query.search, deleted: false });
                    } else {
                        user = await userModel.findOne({ userEmail: query.search, deleted: false });
                    }
                } else {
                    query.mail = decode.decodeString(query.mail, process.env.KEYPROFIT).replace(/\0/g, '');
                    user = await userModel.findOne({ userEmail: query.mail, deleted: false });
                }

                if (user) {
                    let membership = await memberShipModel.findOne({ _id: user.userMembership });
                    let program = await programModel.find({ userID: user._id, deleted: false });
                    let month = query.month;
                    let year = query.year;
                    let userID = user._id;
                    let email = user.userEmail;

                    month = decode.decodeString(month, process.env.KEYPROFIT).replace(/\0/g, '');
                    year = decode.decodeString(year, process.env.KEYPROFIT).replace(/\0/g, '');

                    let select = [
                        'date',
                        'confirmed',
                        'payable',
                        'residual',
                        'forward'
                    ];

                    let rs = await rsModel.findOne({
                        deleted: false,
                        userID: userID,
                        date: month + '-' + year
                    }, select);

                    let data = {};
                    if (rs) {
                        data = {
                            date: month + '-' + year,
                            userID: userID,
                            email: email,
                            memberShip: membership.packageName,
                            start: user.memberShipStartDay,
                            end: user.memberShipEndDay,
                            number_upload: program.length,
                            confirmed: Number(decode.decodeString(rs.confirmed, process.env.KEYPROFIT).replace(/\0/g, '')),
                            payable: Number(decode.decodeString(rs.payable, process.env.KEYPROFIT).replace(/\0/g, '')),
                            residual: Number(decode.decodeString(rs.residual, process.env.KEYPROFIT).replace(/\0/g, '')),
                            forward: Number(decode.decodeString(rs.forward, process.env.KEYPROFIT).replace(/\0/g, ''))
                        }
                    } else {
                        data = {
                            date: month + '-' + year,
                            userID: userID,
                            email: email,
                            memberShip: membership.packageName,
                            start: user.memberShipStartDay,
                            end: user.memberShipEndDay,
                            number_upload: program.length,
                            confirmed: 0,
                            payable: 0,
                            residual: 0,
                            forward: 0
                        }
                    }

                    return response.status(200).json({
                        status: system.success,
                        data: data
                    });
                } else {
                    return response.status(200).json({
                        status: system.error,
                        msg: rsConstants.dataNotExit
                    });
                }
            } else {
                return response.status(200).json({
                    status: system.error,
                    msg: rsConstants.dataError
                });
            }
        } catch (error) {
            errors.push(error.message);
            return logger.status500(response, error, errors);
        }
    }

    // [GET] /offline/rs-list-year/
    async encodeZendesk(request, response, next) {
        const query = request.query;
        const errors = [];

        try {
            if ((query.mail || query.search) && query.month && query.year) {
                let encode = new McashSeed();
                let link = '';
                if (query.year) {
                    link += 'year=' + encode.encodeString(query.year, process.env.KEYPROFIT) + '&';
                }

                if (query.month) {
                    link += 'month=' + encode.encodeString(query.month, process.env.KEYPROFIT) + '&';
                }

                if (query.mail) {
                    link += 'mail=' + encode.encodeString(query.mail, process.env.KEYPROFIT);
                }

                if (query.search) {
                    link += 'search=' + encode.encodeString(query.search, process.env.KEYPROFIT);
                }

                return response.status(200).json({
                    status: system.success,
                    data: link
                });
            } else {
                return response.status(200).json({
                    status: system.error,
                    msg: system.errorField
                });
            }

        } catch (error) {
            errors.push(error.message);
            return logger.status500(response, error, errors);
        }
    }

    // [GET] /offline/profit-user/
    async profitUser(request, response, next) {
        const user = request.user;
        const query = request.query;
        const errors = [];

        try {
            let date_local = moment().tz('Asia/Seoul').toObject();
            let mcashSeed = new McashSeed();
            let month = date_local.months;
            let year = date_local.years;
            let userID = user._id;

            if (checkAdmin(user.userType) && query.userID) {
                userID = query.userID;
            }

            if (month == 0) {
                month = 12;
                year = year - 1;
            }

            let select = [
                'date',
                'confirmed',
                'payable',
                'residual',
                'forward',
                'request',
                'able',
                'info',
                'hasConfirm'
            ];

            let rs = await rsModel.findOne({
                deleted: false,
                userID: userID,
                date: month + '-' + year
            }, select);

            let data = {};
            if (rs) {
                data = {
                    confirmed: Number(mcashSeed.decodeString(rs.confirmed, process.env.KEYPROFIT).replace(/\0/g, '')),
                    payable: Number(mcashSeed.decodeString(rs.payable, process.env.KEYPROFIT).replace(/\0/g, '')),
                    residual: Number(mcashSeed.decodeString(rs.residual, process.env.KEYPROFIT).replace(/\0/g, '')),
                    forward: Number(mcashSeed.decodeString(rs.forward, process.env.KEYPROFIT).replace(/\0/g, '')),
                    request: rs.request,
                    able: rs.able,
                    hasConfirm: rs.hasConfirm,
                    info: rs.info ?? []
                }
            } else {
                data = {
                    confirmed: 0,
                    payable: 0,
                    residual: 0,
                    forward: 0,
                    request: false,
                    able: false,
                    hasConfirm: false,
                    info: []
                }
            }

            return response.status(200).json({
                status: system.success,
                data: data
            });
        } catch (error) {
            errors.push(error.message);
            return logger.status500(response, error, errors);
        }
    }

    // [GET] /offline/list-user-request/
    async listRequestUser(request, response, next) {
        const user = request.user;
        const errors = [];

        try {
            if (checkAdmin(user.userType)) {
                let date_local = moment().tz('Asia/Seoul').toObject();
                let month = date_local.months;
                let year = date_local.years;
                let select = [
                    'date',
                    'request',
                    'able',
                    'confirm',
                    'updatedAt'
                ];
                let relation = {
                    path: 'userID',
                    select: [
                        'userName',
                        'userEmail'
                    ],
                    // match: {userType : 3}
                };
                request.query.deleted = false;
                // request.query.date = month + '-' + year;
                request.query.request = true;
                request.query.isRS = true;
                if (request.query.startDate && request.query.endDate) {
                    request.query.updatedAt = {
                        $gte: new Date(request.query.startDate + ' 00:00:00').toUTCString(),
                        $lte: new Date(request.query.endDate + ' 23:59:59').toUTCString(),
                    }
                    delete request.query.startDate;
                    delete request.query.endDate;
                }

                // request.query.able = false;
                // request.query.hasConfirm = false;
                let rs = await businessQuery.handle(rsModel, request, relation, select);
                let data = [];

                //map data
                Object.entries(rs.docs).forEach(([v, item]) => {
                    item = item.toObject();
                    item.userName = item.userID.userName ?? '';
                    item.userEmail = item.userID.userEmail ?? '';
                    item.updatedAt = moment(item.updatedAt).format('yyyy-MM-DD');
                    delete item.userID;
                    data.push(item);
                });

                rs.docs = data;
                return response.status(200).json({
                    status: system.success,
                    data: rs
                });
            } else {
                return response.status(201).json({
                    status: system.error,
                    msg: rsConstants.error
                });
            }
        } catch (error) {
            errors.push(error.message);
            return logger.status500(response, error, errors);
        }
    }

    // [GET] /offline/list-user-request/
    async acceptRequest(request, response, next) {
        const user = request.user;
        const id = request.params.id;
        const dataPut = request.body;
        const errors = [];
        let session = await mongoose.startSession();
        session.startTransaction();

        try {
            if (checkAdmin(user.userType) && id) {
                let mcashSeed = new McashSeed();
                let rs = await rsModel.findOne({ _id: id, able: false });
                if (rs) {
                    let userRequest = await userModel.findOne({ _id: rs.userID, deleted: false });
                    if (!dataPut.accept) {
                        rs.hasConfirm = true;
                        rs.able = false;
                        rs.byConfirm = {
                            userID: user._id,
                            name: user.userName
                        }
                        let payable = Number(mcashSeed.decodeString(rs.payable, process.env.KEYPROFIT).replace(/\0/g, ''));
                        if (rs.info) {
                            rs.info.push(
                                {
                                    payable: payable,
                                    date: moment()
                                        .tz("Asia/Seoul")
                                        .format('YYYY-MM-DD HH:mm'),
                                    hasConfirm: rs.hasConfirm
                                }
                            );
                        } else {
                            rs.info = [
                                {
                                    payable: payable,
                                    date: moment()
                                        .tz("Asia/Seoul")
                                        .format('YYYY-MM-DD HH:mm'),
                                    hasConfirm: rs.hasConfirm
                                }
                            ];
                        }

                        await rs.updateOne(rs).session(session);

                        let title = userRequest.userName + ' 님 .\n21년 1월 급여 신청이 완료되었습니다.';
                        title += '급여는 신청한 달의 10일에 지급되며 어뷰징, 개인정보 불일치, 계좌 정보 불일치 등으로 급여 지급이 취소될 수 있습니다.';
                        title += '자세한 사항은 이용 약관에서 확인하실 수 있습니다.';
                        await new notificationModel({
                            senderID: user.id,
                            receiverID: rs.userID,
                            programID: rs.id,
                            title: 'Profit Request Cancel',
                            body: {
                                profitID: rs.id,
                                type: constants.NOTIFICATION_BODY_TYPE.PROFIT,
                                title: 'Profit Request Cancel',
                                message: title,
                                category: constants.CATEGORY_NOTIFICATION.PAYMENT
                            },
                            display: constants.DISPLAY_NOTIFICATION.OFFLINE,
                        }).save({ session: session });

                        // Create message
                        await new MessageModel({
                            title: 'Profit Request Cancel',
                            content: `${userRequest.userName}  님
                            21년 1월 급여 지급이 취소되었습니다.
                            급여 지급 취소에 관한 이유는 어뷰징, 개인 정보 불일치, 계좌 정보 불일치 등을 비롯한 여러 이유로 급여 지급이 취소될 수 있습니다. 자세한 사항은 이용 약관에서 확인하실 수 있습니다. 
                            실시간 채팅 문의는 ‘옴넷’ 고객센터에서 진행하실 수 있습니다.
                            감사합니다.`,
                            receiver: userRequest._id,
                            receiverEmail: userRequest.userEmail,
                            type: constants.MESSAGE_TYPE.AUTO,
                            category: constants.MESSAGE_CATEGORY.PROFIT,
                            display: constants.DISPLAY_NOTIFICATION.OFFLINE,
                        }).save({ session: session });

                        if (sockets)
                            sockets.emit(constants.MESSAGES_NOTIFICATION.OTHER_MESSAGES, {
                                userIDs: [rs.userID],
                            });

                        await session.commitTransaction();
                        session.endSession();
                        sockets.emit('accept_success', { stutus: false, userID: userRequest?._id });
                        return response.status(200).json({
                            status: system.success,
                            msg: 'Denial id: ' + id + ' '
                        });
                    } else {
                        let payable = Number(mcashSeed.decodeString(rs.payable, process.env.KEYPROFIT).replace(/\0/g, ''));
                        let residual = Number(mcashSeed.decodeString(rs.residual, process.env.KEYPROFIT).replace(/\0/g, ''));
                        residual = String(residual - payable);
                        rs.payable = mcashSeed.encodeString(payable, process.env.KEYPROFIT);
                        rs.residual = mcashSeed.encodeString(residual, process.env.KEYPROFIT);
                        rs.forward = rs.residual;
                        rs.hasConfirm = true;
                        rs.able = true;
                        // rs.request = false;
                        if (rs.info) {
                            rs.info.push(
                                {
                                    payable: payable,
                                    date: moment()
                                        .tz("Asia/Seoul")
                                        .format('YYYY-MM-DD HH:mm'),
                                    hasConfirm: rs.hasConfirm
                                }
                            );
                        } else {
                            rs.info = [
                                {
                                    payable: payable,
                                    date: moment()
                                        .tz("Asia/Seoul")
                                        .format('YYYY-MM-DD HH:mm'),
                                    hasConfirm: rs.hasConfirm
                                }
                            ];
                        }

                        await rs.updateOne(rs).session(session);

                        let title = userRequest.userName + ' 님 \n21년 1월 급여 지급이 완료되었습니다.';
                        title += '급여 신청은 매월 5일까지 신청이 가능하며 급여 지급은 신청한 달의 10일에 지급됩니다.';
                        title += '실시간 채팅 문의는 ‘옴넷’ 고객센터에서 진행하실 수 있습니다.';
                        title += '감사합니다.';

                        await new notificationModel({
                            senderID: user.id,
                            receiverID: rs.userID,
                            programID: rs.id,
                            title: 'Profit Paid Complete',
                            body: {
                                profitID: rs.id,
                                type: constants.NOTIFICATION_BODY_TYPE.PROFIT,
                                title: 'Profit Paid Complete',
                                message: title,
                                category: constants.CATEGORY_NOTIFICATION.PAYMENT
                            },
                            display: constants.DISPLAY_NOTIFICATION.OFFLINE,
                        }).save({ session: session });

                        // Create message
                        await new MessageModel({
                            title: 'Profit Paid Complete',
                            content: `${userRequest.userName}  님
                            21년 1월 급여 지급이 완료되었습니다. 
                            급여 신청은 매월 5일까지 신청이 가능하며 급여 지급은 신청한 달의 10일에 지급됩니다. 
                            실시간 채팅 문의는 ‘옴넷’ 고객센터에서 진행하실 수 있습니다. 감사합니다.`,
                            receiver: userRequest._id,
                            receiverEmail: userRequest.userEmail,
                            type: constants.MESSAGE_TYPE.AUTO,
                            category: constants.MESSAGE_CATEGORY.PROFIT,
                            display: constants.DISPLAY_NOTIFICATION.OFFLINE,
                        }).save({ session: session });

                        if (sockets)
                            sockets.emit(constants.MESSAGES_NOTIFICATION.OTHER_MESSAGES, {
                                userIDs: rs.userID,
                            });

                        await session.commitTransaction();
                        session.endSession();
                        sockets.emit('accept_success', { stutus: true, userID: userRequest?._id });
                        return response.status(200).json({
                            status: system.success,
                            msg: 'Accept success id: ' + id + ' '
                        });
                    }

                } else {
                    await session.abortTransaction();
                    session.endSession();
                    return response.status(200).json({
                        status: system.error,
                        msg: 'Not exist or have accept!'
                    });
                }
            } else {
                await session.abortTransaction();
                session.endSession();
                return response.status(201).json({
                    status: system.error,
                    msg: rsConstants.error
                });
            }
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            errors.push(error.message);
            return logger.status500(response, error, errors);
        }
    }

    // [GET] /offline/payment-profit/
    async paymentProfit(request, response, next) {
        const user = request.user;
        const query = request.query;
        const errors = [];
        let mcashSeed = new McashSeed();
        const now = new Date()

        try {
            if (Number(query.year) > now.getFullYear()) {
                return response.status(400).json({
                    status: system.error,
                    msg: rsConstants.yearNotAvailable
                });
            }
            //list profit
            let rs = await rsModel.find({
                userID: user._id,
                date: new RegExp(query.year, 'i')
            }, ['confirmed', 'payable', 'date']);

            let rsData = [];
            Object.entries(rs).forEach(([o, item]) => {
                item = item.toObject();
                let temp = {};
                temp.confirmed = Number(mcashSeed.decodeString(item.confirmed, process.env.KEYPROFIT).replace(/\0/g, ''));
                temp.payable = Number(mcashSeed.decodeString(item.payable, process.env.KEYPROFIT).replace(/\0/g, ''));
                temp.date = item.date;
                temp.month = item.date.split('-');
                temp.month = Number(temp.month[0]);
                rsData[temp.month] = temp;
            });

            //list program
            let program = {};
            let programs = [];
            let monthProfit = [];

            let rate_tax = {
                rsRate: user?.rsRate,
                tax: user?.taxRate
            };

            if (query.programID) {
                program = await programModel.find({
                    'userID': user._id,
                    '_id': query.programID,
                    ['programView.' + [query.year]]: {
                        $ne: null,
                    },
                }, ['programName', 'programImagePoster', 'programView']);

                Object.entries(program).forEach(([k, item]) => {
                    item = item.toObject();
                    Object.entries(item.programView).forEach(([h, followYear]) => {
                        Object.entries(followYear).forEach(([l, followMonth]) => {
                            //formula rsService
                            followMonth.basic = followMonth.basic == 0
                                ? 0
                                : Number((followMonth.basic / 60).toFixed(0));
                            followMonth.standard = followMonth.standard == 0
                                ? 0
                                : Number((followMonth.standard / 60).toFixed(0));
                            followMonth.premium = followMonth.premium == 0
                                ? 0
                                : Number((followMonth.premium / 60).toFixed(0));

                            let amount = user.userType == constants.USER_TYPE.RS
                                ? rsService.formula(true, followMonth, rate_tax)
                                : rsService.formula(false, followMonth);

                            if (!monthProfit[l]) {
                                monthProfit[l] = 0;
                            }
                            monthProfit[l] = amount.total;
                        });
                    });
                });
            } else {
                program = await programModel.find({
                    'userID': user._id,
                    ['programView.' + [query.year]]: {
                        $ne: null,
                    },
                }, ['programName', 'programImagePoster']);
            }

            let monthAvailable = Number(moment().format('MM'));
            let yaerAvailable = Number(moment().format('yyyy'));
            if (query.year < yaerAvailable) {
                monthAvailable = 12;
            }
            // Add month missing in data
            for (let i = 1; i <= monthAvailable; i++) {
                if (rsData[i]) {
                    rsData[i].confirmed = monthProfit[i] ?? rsData[i].confirmed;
                } else {
                    rsData[i] = {
                        confirmed: monthProfit[i] ?? 0,
                        payable: 0,
                        date: `${i}-${Number(query.year)}`,
                        month: i
                    }
                }
            }

            rsData = rsData.filter(function () { return true });
            let data = { rsProfits: rsData, programs: program };

            return response.status(200).json({
                status: system.success,
                data: data
            });
        } catch (error) {
            errors.push(error.message);
            return logger.status500(response, error, errors);
        }
    }

    // [GET] /offline/payment-year/
    async paymentYearMonth(request, response, next) {
        const user = request.user;
        const query = request.query;
        const errors = [];
        let mcashSeed = new McashSeed();

        try {
            //list profit
            let date = query.month + '-' + query.year;
            // let rs = await rsModel.find({
            //     userID: user._id, 
            //     date: date
            // }, ['confirmed', 'payable', 'date']);

            let rsData = [];
            // Object.entries(rs).forEach(([o, item]) => {
            //     item = item.toObject();
            //     let temp = {};
            //     temp.confirmed = Number(mcashSeed.decodeString(item.confirmed, process.env.KEYPROFIT).replace(/\0/g, ''));
            //     temp.payable   = Number(mcashSeed.decodeString(item.payable, process.env.KEYPROFIT).replace(/\0/g, ''));
            //     temp.date      = item.date;
            //     temp.month     = item.date.split('-');
            //     temp.month     = Number(temp.month[0]);
            //     rsData.push(temp);
            // });

            let programAll = await programModel.find({
                deleted: false,
                ['programView.' + [query.year] + '.' + [query.month]]: {
                    $ne: null,
                },
            });

            // get total time all video for user follow month
            let total_all = {};
            Object.entries(programAll).forEach(([months, pro]) => {
                if (pro.programView[query.year][query.month]) {
                    let datas = pro.programView[query.year][query.month];
                    let basic = datas.basic > 0
                        ? Number(datas.basic)
                        : 0;
                    let standard = datas.standard > 0
                        ? Number(datas.standard)
                        : 0;
                    let premium = datas.premium > 0
                        ? Number(datas.premium)
                        : 0;
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

            total_all = {
                basic: Number((total_all.basic / 60).toFixed(0)),
                standard: Number((total_all.standard / 60).toFixed(0)),
                premium: Number((total_all.premium / 60).toFixed(0))
            }

            //list program
            let program = {};
            if (query.programID) {
                program = await programModel.find({
                    'userID': user._id,
                    _id: query.programID,
                    ['programView.' + [query.year] + '.' + [query.month]]: {
                        $ne: null,
                    },
                }, ['programName', 'programView', 'programImagePoster']);
            } else {
                program = await programModel.find({
                    'userID': user._id,
                    ['programView.' + [query.year] + '.' + [query.month]]: {
                        $ne: null,
                    },
                }, ['programName', 'programView', 'programImagePoster']);
            }

            let programs = [];
            let rate_tax = {
                rsRate: user?.rsRate ?? 0,
                tax: user?.taxRate ?? 0
            };

            Object.entries(program).forEach(([k, item]) => {
                item = item.toObject();
                let bsp = item.programView[query.year][query.month];
                bsp.basic = bsp.basic == 0 ? 0 : Number((bsp.basic / 60).toFixed(0));
                bsp.standard = bsp.standard == 0 ? 0 : Number((bsp.standard / 60).toFixed(0));
                bsp.premium = bsp.premium == 0 ? 0 : Number((bsp.premium / 60).toFixed(0));

                //formula rsService
                let view_rate = {
                    basic:
                        bsp.basic == 0
                            ? 0
                            : Number(((bsp.basic / total_all.basic) * 100).toFixed(2)),
                    standard:
                        bsp.standard == 0
                            ? 0
                            : Number(((bsp.standard / total_all.standard) * 100).toFixed(2)),
                    premium:
                        bsp.premium == 0
                            ? 0
                            : Number(((bsp.premium / total_all.premium) * 100).toFixed(2))
                };

                //formula rsService
                let temp = [];
                temp = {
                    id: item._id,
                    name: item.programName,
                    amount: user.userType == constants.USER_TYPE.RS
                        ? rsService.formula(true, view_rate, rate_tax)
                        : rsService.formula(false, view_rate),
                    image: item.programImagePoster
                }

                programs.push(temp);
            });

            if (rsService.isEmpty(rsData)) {
                rsData = {
                    confirmed: 0,
                    payable: 0,
                    date: [query.month] + '-' + [query.year]
                }

                programs.forEach(it => {
                    rsData.confirmed += it.amount.basic + it.amount.standard + it.amount.premium;
                });
            }

            let data = { rsProfits: rsData, programs: programs };

            return response.status(200).json({
                status: system.success,
                data: data
            });
        } catch (error) {
            errors.push(error.message);
            return logger.status500(response, error, errors);
        }
    }

    // // [GET] /offline/get-message/user
    // async getMessage(request, response, next) {
    //     const user = request.user;
    //     const errors = [];
    //     request.query.receiver = user.id;

    //     try {
    //         let message = await businessQuery.handle(MessageModel, request);

    //         return response.status(200).json({
    //             status: system.success,
    //             data: message
    //         });
    //     } catch (error) {
    //         errors.push(error.message);
    //         return logger.status500(response, error, errors);
    //     }
    // }
}

module.exports = new RsUserController();
