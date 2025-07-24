const programModel = require('../../../Models/Program/ProgramModel');
const programEditModel = require('../../../Models/ProgramEdit/ProgramEditModel');
const paymentModel = require('../../../Models/Payment/PaymentModel');
const RSModel = require('../../../Models/RS/RSModel');
const userModel = require('../../../Models/User/UserModel');
const system = require('../../../Constant/General/SystemConstant');
const businessQuery = require('../../../Business/QueryModel');
const logger = require('../../../Constant/Logger/loggerConstant');
const constants = require('../../../Constant/constants');
const signatureUtil = require('../../../Service/Payment//SignatureUtil');
const programConstant = require('../../../Constant/Program/ProgramConstant');
const McashSeed = require('../../../../app/Service/Cipher/McashSeed');
const moment = require('moment-timezone');
const rsService = require('../../../Service/RsUser/RsFormula');
const crmConstant = require('../../../Constant/CRM/CRMConstant')

class CRMController {
    // [GET] /admin/crm/search-customer
    async searchCustomer(request, response, next) {
        const errors = [];
        const selectFields = [
            'userName',
            'nameSocial',
            'userEmail',
            'userGender',
            'userDOB'
        ]

        try {

            if (request.query.search) {
                request.query = Object.assign(request.query, {
                    $or: [
                        { userName: new RegExp(request.query.search, 'i') },
                        { userEmail: new RegExp(request.query.search, 'i') }
                    ]
                });
                delete request.query.search;
            }

            request.query.userType = { $in: [constants.USER_TYPE.USER, constants.USER_TYPE.RS] }
            let users = await businessQuery.handle(userModel, request, null, selectFields);

            return logger.status200(response, system.success, '', users);
        } catch (error) {
            errors.push(error.message);
            return logger.status500(response, error, errors);
        }
    }

    // [GET] /admin/crm/detail-customer
    async detailCustomer(request, response, next) {
        const errors = [];
        const params = request.params
        const selectFields = [
            'userName',
            'nameSocial',
            'userEmail',
            'userGender',
            'userDOB',
            'createdAt',
            'userMembership',
            'deactivate'
        ]

        try {
            const user = await userModel.findById(params.id, selectFields).populate({
                path: 'userMembership',
                select: 'packageName'
            }).lean();

            if (!user) {
                return logger.status404(response, null, crmConstant.userIDNotFound);
            }

            const payment = await paymentModel.findOne({
                idUser: params.id,
                cardNumber: { $ne: null }
            })
                .sort({ createdAt: -1 })
                .lean();

            user.paymentInfo = null
            try {
                if (payment) {
                    const cardNumber = signatureUtil.decrypt(process.env.INIAPIKEY, process.env.IV, payment.cardNumber);
                    user.paymentInfo = `Credit - ${cardNumber.substr(cardNumber.length - 4)}`
                }
            } catch (error) {

            }

            user.statusMembership = 'Deactive'
            user.membership = null
            if (user.userMembership) {
                user.statusMembership = !user.deactivate ? 'Active' : user.statusMembership
                user.membership = user.userMembership.packageName

                delete user.userMembership
            }

            return logger.status200(response, system.success, '', user);
        } catch (error) {
            errors.push(error.message);
            return logger.status500(response, error, errors);
        }
    }

    // [GET] /admin/crm/uploads/:id
    async listUploads(request, response, next) {
        const errors = [];
        const params = request.params
        const selectFields = [
            'createdAt',
            'programName',
            'programType',
            'programTypeVideo',
            'programChildrenSeasonData',
            'programCurrentStatus'
        ]

        try {
            const user = await userModel.findById(params.id)

            if (!user) {
                return logger.status404(response, null, crmConstant.userIDNotFound);
            }

            request.query.userID = params.id
            request.query.programType = constants.PROGRAM_TYPE.UPLOAD

            request.query['$or'] = [
                {
                    programTypeVideo: constants.TYPE_VIDEO.SS,
                    programSeasonChild: true
                },
                {
                    programTypeVideo: constants.TYPE_VIDEO.SA,
                    programSeasonChild: false
                }
            ]

            let programs = await businessQuery.handle(programModel, request, null, selectFields);

            programs = JSON.parse(JSON.stringify(programs))

            await Promise.all(programs.docs.map(async program => {
                if (program.programCurrentStatus === constants.PROGRAM_STATUS.EDIT) {
                    const programEdit = await programEditModel.findOne({
                        programID: program._id
                    })

                    program.programCurrentStatus = programEdit ? 'program' : 'upload'
                }
            }))

            return logger.status200(response, system.success, '', programs);
        } catch (error) {
            errors.push(error.message);
            return logger.status500(response, error, errors);
        }
    }

    // [GET] /admin/crm/detail-program/:id
    async detailProgram(request, response, next) {
        const params = request.params;
        const errors = [];

        try {
            const program = await programModel.findById(params.id).populate([
                { path: 'userID', select: 'userName' },
                { path: 'programCategory.categoryManageId', select: 'categoryMangeName' },
                { path: 'programCategory.categoryArrayTag', select: 'tagName' },
                { path: 'programSeasonData.episode', select: [...programConstant.FIELD_SELECT_PROGRAM_HOME, 'createdAt'], match: { deleted: false } }
            ]);

            if (!program) {
                return logger.status404(response, system.error, programConstant.notFound(params.id));
            }

            return logger.status200(response, system.success, '', program);
        } catch (error) {
            errors.push(error.message);
            return logger.status500(response, error, errors);
        }
    }

    // [GET] /admin/crm/payment-history
    async paymentHistory(request, response, next) {
        const errors = [];
        const params = request.params
        const selectFields = [
            'price',
            'cardNumber',
            'goodName',
            'cancelDate',
            'cancelTime',
            'createdAt'
        ]

        try {
            const user = await userModel.findById(params.id)

            if (!user) {
                return logger.status404(response, null, crmConstant.userIDNotFound);
            }

            request.query.sort = 'createdAt,desc'
            request.query.idUser = params.id
            request.query.cardNumber = { $ne: null }

            let payments = await businessQuery.handle(paymentModel, request, null, selectFields);

            payments = JSON.parse(JSON.stringify(payments))
            payments.docs.map(payment => {
                const cardNumber = signatureUtil.decrypt(process.env.INIAPIKEY, process.env.IV, payment.cardNumber);
                payment.cardNumber = cardNumber.substr(cardNumber.length - 4)

                payment.status = !payment.cancelDate && !payment.cancelTime ? 'Paid' : 'Unpaid'
            })
            return logger.status200(response, system.success, '', payments);
        } catch (error) {
            errors.push(error.message);
            return logger.status500(response, error, errors);
        }
    }

    // [GET] /admin/crm/originals/:id
    async listOriginals(request, response, next) {
        const errors = [];
        const params = request.params
        const selectFields = [
            'createdAt',
            'programName',
            'programType',
            'programTypeVideo',
            'programChildrenSeasonData',
            'programCurrentStatus'
        ]

        try {
            const user = await userModel.findById(params.id)

            if (!user) {
                return logger.status404(response, null, crmConstant.userIDNotFound);
            }

            request.query.userID = params.id
            request.query.programType = constants.PROGRAM_TYPE.PROGRAM_ORIGINAL

            request.query['$or'] = [
                {
                    programTypeVideo: constants.TYPE_VIDEO.SS,
                    programSeasonChild: true
                },
                {
                    programTypeVideo: constants.TYPE_VIDEO.SA,
                    programSeasonChild: false
                }
            ]

            let programs = await businessQuery.handle(programModel, request, null, selectFields);

            programs = JSON.parse(JSON.stringify(programs))

            await Promise.all(programs.docs.map(async program => {
                if (program.programCurrentStatus === constants.PROGRAM_STATUS.EDIT) {
                    const programEdit = await programEditModel.findOne({
                        programID: program._id
                    })

                    program.programCurrentStatus = programEdit ? 'program' : 'upload'
                }
            }))

            return logger.status200(response, system.success, '', programs);
        } catch (error) {
            errors.push(error.message);
            return logger.status500(response, error, errors);
        }
    }

    // [GET] /admin/crm/profit/:id
    async listProfit(request, response, next) {
        const errors = [];
        const params = request.params;
        let data = [];

        try {
            const user = await userModel.findById(params.id).populate('user-program');

            if (!user) {
                return logger.status404(response, null, crmConstant.userIDNotFound);
            }
            const mcashSeed = new McashSeed();

            request.query.userID = params.id
            request.query.sort = 'createAt,desc'

            const profit = await businessQuery.handle(RSModel, request);

            Object.entries(profit.docs).forEach(async ([v, item]) => {
                item = item.toObject();
                let temp = {};

                temp.stt = Number(v) + 1;
                temp.paidDate = item.hasConfirm ? moment(item.updatedAt).format('yyyy-MM-DD') : '';
                temp.paidAmount = Number(mcashSeed.decodeString(item.payable, process.env.KEYPROFIT).replace(/\0/g, ''));
                temp.totalView = user?.['user-program']?.accumlative ?? 0;
                temp.remainPaid = Number(mcashSeed.decodeString(item.forward, process.env.KEYPROFIT).replace(/\0/g, ''));
                temp.status = item.hasConfirm;
                data.push(temp);
            });

            profit.docs = data;
            return logger.status200(response, system.success, '', profit);
        } catch (error) {
            errors.push(error.message);
            return logger.status500(response, error, errors);
        }
    }

    // [GET] /admin/crm/profit-revenue
    async revenue(request, response, next) {
        const user = request.user;
        const query = request.query;
        const params = request.params;
        const errors = [];

        try {
            if (checkAdmin(user.userType) && query.year && params.id) {
                let data = {};
                let program = await programModel.find({
                    userID: params.id,
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
                    msg: crmConstant.dataError,
                });
            }
        } catch (error) {
            errors.push(error.message);
            return logger.status500(response, error, errors);
        }
    }

    // [GET] /crm/profit-revenue-year/
    async profitYearMonth(request, response, next) {
        const user = request.user;
        const query = request.query;
        const params = request.params;
        const errors = [];

        try {
            if (checkAdmin(user.userType)
                && query.year && query.month
                && params.id) {
                let program = await programModel.find({
                    userID: params.id,
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
                    final_price = rsService.formula(false, total_videos);
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

                return logger.status200(response, system.success, '', results);
            } else {
                return request.exportExcel ? {} : response.status(400).json({
                    status: system.error,
                    msg: crmConstant.dataError,
                });
            }
        } catch (error) {
            errors.push(error.message);
            return logger.status500(response, error, errors);
        }
    }

    // [GET] /crm/payment-profit/
    async paymentProfit(request, response, next) {
        const user = request.user;
        const query = request.query;
        const params = request.params;
        const errors = [];
        const mcashSeed = new McashSeed();
        const now = new Date()

        try {
            if (checkAdmin(user.userType) && params.id) {
                if (Number(query.year) > now.getFullYear()) {
                    return response.status(400).json({
                        status: system.error,
                        msg: crmConstant.yearNotAvailable
                    });
                }
                //list profit
                let rs = await RSModel.find({
                    userID: params.id,
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
                        'userID': params.id,
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
                        'userID': params.id,
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

                // rsData.sort((a, b) => a.month - b.month)
                rsData = rsData.filter(function () { return true });
                let data = { rsProfits: rsData, programs: program };

                return response.status(200).json({
                    status: system.success,
                    data: data
                });
            } else {
                return response.status(200).json({
                    status: system.error,
                    msg: crmConstant.deniedOrMissingID
                });
            }
        } catch (error) {
            errors.push(error.message);
            return logger.status500(response, error, errors);
        }
    }

    // [GET] /crm/payment-year/
    async paymentYearMonth(request, response, next) {
        const user = request.user;
        const query = request.query;
        const params = request.params;
        const errors = [];
        const mcashSeed = new McashSeed();

        try {
            //list profit
            if (checkAdmin(user.userType) && params.id) {

                let userCheck = await userModel.findOne({
                    _id: params.id
                });
                let date = query.month + '-' + query.year;
                // let rs = await RSModel.find({
                //     userID: params.id,
                //     date: date
                // }, ['confirmed', 'payable', 'date']);

                let rsData = [];
                // Object.entries(rs).forEach(([o, item]) => {
                //     item = item.toObject();
                //     let temp = {};
                //     temp.confirmed = Number(mcashSeed.decodeString(item.confirmed, process.env.KEYPROFIT).replace(/\0/g, ''));
                //     temp.payable = Number(mcashSeed.decodeString(item.payable, process.env.KEYPROFIT).replace(/\0/g, ''));
                //     temp.date = item.date;
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
                        'userID': params.id,
                        _id: query.programID,
                        ['programView.' + [query.year] + '.' + [query.month]]: {
                            $ne: null,
                        },
                    }, ['programName', 'programView', 'programImagePoster']);
                } else {
                    program = await programModel.find({
                        'userID': params.id,
                        ['programView.' + [query.year] + '.' + [query.month]]: {
                            $ne: null,
                        },
                    }, ['programName', 'programView', 'programImagePoster']);
                }

                let programs = [];
                let rate_tax = {
                    rsRate: userCheck?.rsRate ?? 0,
                    tax: userCheck?.taxRate ?? 0
                };

                Object.entries(program).forEach(([k, item]) => {
                    item = item.toObject();
                    let bsp = item.programView[query.year][query.month];
                    bsp.basic = Number((bsp.basic / 60).toFixed(0));
                    bsp.standard = Number((bsp.standard / 60).toFixed(0));
                    bsp.premium = Number((bsp.premium / 60).toFixed(0));

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
                    let temp = [];
                    temp = {
                        id: item._id,
                        name: item.programName,
                        amount: userCheck.userType == constants.USER_TYPE.RS
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
            } else {
                return response.status(200).json({
                    status: system.error,
                    msg: crmConstant.deniedOrMissingID
                });
            }
        } catch (error) {
            errors.push(error.message);
            return logger.status500(response, error, errors);
        }
    }

    // [GET] /crm/status-history/
    async statusHistory(request, response, next) {
        const errors = [];
        const user = request.user;
        const params = request.params;
        let data = [];

        try {
            if (checkAdmin(user.userType) && params.id) {
                request.query.userID = params.id;
                request.query.hasConfirm = true;

                let relation = {
                    path: 'byConfirm.userID',
                    select: ['userName'],
                };

                const profit = await businessQuery.handle(RSModel, request, relation);
                Object.entries(profit.docs).forEach(async ([v, item]) => {
                    item = item.toObject();
                    let temp = {};
                    temp.status = item.hasConfirm;
                    temp.paidDate = item.hasConfirm ? moment(item.updatedAt).format('yyyy-MM-DD') : '';
                    temp.byConfirm = item.byConfirm ?? '';
                    data.push(temp);
                });

                profit.docs = data;
                return logger.status200(response, system.success, '', profit);
            } else {
                return response.status(200).json({
                    status: system.error,
                    msg: crmConstant.deniedOrMissingID
                });
            }
        } catch (error) {
            errors.push(error.message);
            return logger.status500(response, error, errors);
        }
    }
}

module.exports = new CRMController();
