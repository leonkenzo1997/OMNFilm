const system = require('../../../Constant/General/SystemConstant');
const logger = require('../../../Constant/Logger/loggerConstant');
const categoriesSetModel = require('../../../Models/CategoriesSet/CategoriesSetModel');
const programModel = require('../../../Models/Program/ProgramModel');
const categoryManageModel = require('../../../Models/Manage/CategoryManage/CategoryManageModel');
const tagModel = require('../../../Models/Manage/Tag/TagModel');
const homeSetModel = require('../../../Models/HomeSet/HomeSetModel');
const listModel = require('../../../Models/List/ListModel');
const businessQuery = require('../../../Business/QueryModel');
const moment = require('moment-timezone');
const mongoose = require('mongoose');
const likeUnlikeModel = require('../../../Models/Action/LikeAndUnlikeModel');
const myListModel = require('../../../Models/User/MyListModel');
const BractersModel = require('../../../Models/Bracters/BractersModelV2');
const constants = require('../../../Constant/constants');
const challengerConstant = require('../../../Constant/Challenger/ChallengerConstant');
const programConstant = require('../../../Constant/Program/ProgramConstant');
const MembershipModel = require('../../../Models/Manage/Membership/MembershipModel');
const UserProgramModel = require('../../../Models/User/UserProgramModel');
const homeConstant = require('../../../Constant/Home/HomeConstant');
const NotificationModel = require('../../../Models/Push/UserPushNotificationModel')

const _ = require('lodash');

class homeOnlineController {
    // [GET] online/trending
    async trending(request, response, next) {
        const userData = request.user;
        const errors = [];
        try {
            // Get data from before 1 month to now
            const oneMonth = 60 * 60 * 24 * 30 * 1000;
            const beforeOneMonth = Date.now() - oneMonth;
            const year = new Date(beforeOneMonth).getFullYear();
            const month = new Date(beforeOneMonth).getMonth() + 1;
            const date = new Date(beforeOneMonth).getDate();
            request.query.fromDate = `${year}-${month}-${date}`;
            request.query.toDate = `${new Date().getFullYear()}-${new Date().getMonth() + 1
                }-${new Date().getDate()}`;

            request.query.programDisplay = true;
            request.query.deleted = false;
            request.query.sort = 'programTotalView,desc';
            request.query.programType = constants.PROGRAM_TYPE_ONLINE_SHOW;
            Object.assign(request.query, programConstant.FIELD_QUERY_DEFAULT);

            let topPlay = await businessQuery.handle(
                programModel,
                request,
                {
                    path: 'programCategory.categoryManageId',
                    select: 'categoryMangeName',
                },
                programConstant.FIELD_SELECT_PROGRAM_HOME
            );

            // //get like & unlike user
            // let likeUnlike = await likeUnlikeModel.find({ userId: userData._id });

            // //get video like unlike
            // let videos = {};

            // await Promise.all(
            //     likeUnlike.map((v) => {
            //         videos = Object.assign(videos, { [v.programId]: v.type });
            //     })
            // );

            // Object.entries(topPlay.docs).forEach(([v, va]) => {
            //     va.isLike = videos[va._id] === 'like';
            //     va.isUnlike = videos[va._id] === 'unlike';
            // });

            topPlay = JSON.parse(JSON.stringify(topPlay));

            const myList = JSON.parse(
                JSON.stringify(await myListModel.findOne({ userID: userData._id }))
            );

            const programPlay = await UserProgramModel.findOne({ userID: userData._id });
            await Promise.all(
                topPlay.docs.map((item) => {
                    item.isMyList = myList?.programs?.includes(item._id);

                    const timePlay = programPlay?.programIDs?.find(
                            (programID) => programID.id === item._id
                        );
                    item.timePlay = (timePlay && timePlay.time) || 0;
                })
            );
            return logger.status200(response, system.success, '', topPlay);
        } catch (error) {
            errors.push(error.message);
            return logger.status500(response, error, errors);
        }
    }

    // [GET] online/top
    async topShow(request, response, next) {
        const userData = request.user;
        const errors = [];
        try {
            request.query.programDisplay = true;
            request.query.deleted = false;
            request.query.sort = 'programTotalView,desc';
            request.query.programType = constants.PROGRAM_TYPE_ONLINE_SHOW;
            Object.assign(request.query, programConstant.FIELD_QUERY_DEFAULT);

            let topPlay = await businessQuery.handle(
                programModel,
                request,
                {
                    path: 'programCategory.categoryManageId',
                    select: 'categoryMangeName',
                },
                programConstant.FIELD_SELECT_PROGRAM_HOME
            );

            // //get like & unlike user
            // let likeUnlike = await likeUnlikeModel.find({ userId: userData._id });

            // //get video like unlike
            // let videos = {};
            // await Promise.all(
            //     likeUnlike.map((v) => {
            //         videos = Object.assign(videos, { [v.programId]: v.type });
            //     })
            // );

            // Object.entries(topPlay.docs).forEach(([v, va]) => {
            //     va.isLike = videos[va._id] === 'like';
            //     va.isUnlike = videos[va._id] === 'unlike';
            // });

            topPlay = JSON.parse(JSON.stringify(topPlay));

            const myList = JSON.parse(
                JSON.stringify(await myListModel.findOne({ userID: userData._id }))
            );
            const programPlay = await UserProgramModel.findOne({ userID: userData._id });
            await Promise.all(
                topPlay.docs.map((item, i) => {
                    item.isMyList = myList?.programs?.includes(item._id);
                    item.top = ++i;

                    const timePlay = programPlay?.programIDs?.find(
                            (programID) => programID.id === item._id
                        );
                    item.timePlay = (timePlay && timePlay.time) || 0;
                })
            );
            return logger.status200(response, system.success, '', topPlay);
        } catch (error) {
            errors.push(error.message);
            return logger.status500(response, error, errors);
        }
    }

    // [GET] /online/Mylist
    async getMyList(request, response, next) {
        const userData = request.user;
        const errors = [];
        request.query.programDisplay = true;
        request.query.deleted = false;
        request.query.sort = 'createdAt,asc';
        request.query.programType = constants.PROGRAM_TYPE_ONLINE_SHOW;

        // // Query program original
        // request.query['$or'] = [
        //     { programType: { $ne: constants.PROGRAM_TYPE.PROGRAM_ORIGINAL } },
        //     {
        //         programType: constants.PROGRAM_TYPE.PROGRAM_ORIGINAL,
        //         originalDate: {
        //             $lte: Date.now(),
        //         },
        //     },
        // ];
        Object.assign(request.query, programConstant.FIELD_QUERY_DEFAULT);

        try {
            //get list category
            const myListUser = await myListModel.findOne({ userID: userData._id });
            request.query._id = myListUser?.programs || [];
            let myList = await businessQuery.handle(
                programModel,
                request,
                {
                    path: 'programCategory.categoryManageId',
                    select: 'categoryMangeName',
                },
                programConstant.FIELD_SELECT_PROGRAM_HOME
            );

            // //get like & unlike user
            // let likeUnlike = await likeUnlikeModel.find({ userId: userData._id });

            // //get video like unlike
            // let videos = {};
            // await Promise.all(
            //     likeUnlike.map((v) => {
            //         videos = Object.assign(videos, { [v.programId]: v.type });
            //     })
            // );

            // Object.entries(myList.docs).forEach(([v, va]) => {
            //     va.isLike = videos[va._id] === 'like';
            //     va.isUnlike = videos[va._id] === 'unlike';
            // });

            myList = JSON.parse(JSON.stringify(myList));

            const programPlay = await UserProgramModel.findOne({ userID: userData._id });
            await Promise.all(
                myList.docs.map((item) => {
                    item.isMyList = true;

                    const timePlay = programPlay?.programIDs?.find(
                            (programID) => programID.id === item._id
                        );
                    item.timePlay = (timePlay && timePlay.time) || 0;
                })
            );
            return logger.status200(response, system.success, '', myList);
        } catch (error) {
            errors.push(error.message);
            return logger.status500(response, error, errors);
        }
    }

    // [GET] /online/other
    async getOther(request, response, next) {
        const userData = request.user;
        const errors = [];
        request.query.programDisplay = true;
        request.query.deleted = false;
        request.query.sort = 'createdAt,desc';
        request.query.programType = constants.PROGRAM_TYPE_ONLINE_SHOW;
        Object.assign(request.query, programConstant.FIELD_QUERY_DEFAULT);

        try {
            let other = await businessQuery.handle(
                programModel,
                request,
                {
                    path: 'programCategory.categoryManageId',
                    select: 'categoryMangeName',
                },
                programConstant.FIELD_SELECT_PROGRAM_HOME
            );

            // //get like & unlike user
            // let likeUnlike = await likeUnlikeModel.find({ userId: userData._id });

            // //get video like unlike
            // let videos = {};
            // await Promise.all(
            //     likeUnlike.map((v) => {
            //         videos = Object.assign(videos, { [v.programId]: v.type });
            //     })
            // );

            // Object.entries(other.docs).forEach(([v, va]) => {
            //     va.isLike = videos[va._id] === 'like';
            //     va.isUnlike = videos[va._id] === 'unlike';
            // });

            other = JSON.parse(JSON.stringify(other));

            const myList = JSON.parse(
                JSON.stringify(await myListModel.findOne({ userID: userData._id }))
            );
            const programPlay = await UserProgramModel.findOne({ userID: userData._id });
            await Promise.all(
                other.docs.map((item) => {
                    item.isMyList = myList?.programs?.includes(item._id);

                    const timePlay = programPlay?.programIDs?.find(
                            (programID) => programID.id === item._id
                        );
                    item.timePlay = (timePlay && timePlay.time) || 0;
                })
            );
            return logger.status200(response, system.success, '', other);
        } catch (error) {
            errors.push(error.message);
            return logger.status500(response, error, errors);
        }
    }

    // [GET] /online/homeset
    async getHomeSet(request, response, next) {
        const errors = [];
        const userData = request.user;
        const fieldSelect = {
            homeset: [
                'homesetListCount',
                'slugName',
                'homesetName',
                'homesetTimeStart',
                'homesetTimeEnd',
                'createdAt',
            ],
        };

        try {
            //get detial home set
            const time = moment().tz('Asia/Seoul');
            const we = time.format('ddd');
            const h = time.toObject();
            const timeNow = h.hours * 60 + h.seconds;
            const data = [];

            const homeSet = await homeSetModel
                .find(
                    {
                        ['homeset' + we]: true,
                    },
                    fieldSelect.homeset
                )
                .populate({
                    path: 'homesetCategoriesList',
                    populate: {
                        path: 'categoriesArrayList',
                    },
                })
                .lean();

            // Get home set by available time
            homeSet.forEach((v) => {
                const temp = v;
                let start = temp.homesetTimeStart;
                let end = temp.homesetTimeEnd;
                if (!end || !start) {
                    return;
                }
                const timeStart = start.split(/:| /);
                const timeEnd = end.split(/:| /);

                if (timeStart[2] === 'PM') timeStart[0] = Number(timeStart[0]) + 12
                if (timeEnd[2] === 'PM') timeEnd[0] = Number(timeEnd[0]) + 12
                start = timeStart[0] * 60 + Number(timeStart[1]);
                end = timeEnd[0] * 60 + Number(timeEnd[1]);
                if (start < timeNow && timeNow < end) {
                    data.push(temp);
                }
            });

            // Filter by videoRank
            let queryVideoRank = {};
            if (request.query.videoRank) {
                queryVideoRank.videoRank = parseInt(request.query.videoRank) || 0;
            }

            // Check isMyList
            const myList = JSON.parse(
                JSON.stringify(await myListModel.findOne({ userID: userData._id }))
            );
            const programPlay = await UserProgramModel.findOne({ userID: userData._id });
            // Get program in categories set
            await Promise.all(
                data.map(async (item) => {
                    item.programs = [];
                    item?.homesetCategoriesList?.map((category) => {
                        category?.categoriesArrayList?.map((list) => {
                            item.programs = item.programs.concat(list.listProgramList);
                        });
                    });

                    request.query.programDisplay = true;
                    Object.assign(request.query, programConstant.FIELD_QUERY_DEFAULT);

                    item.programs = await programModel
                        .find({
                            _id: {
                                $in: item.programs,
                            },
                            ...request.query,
                            deleted: false,
                            programType: {
                                $in: constants.PROGRAM_TYPE_ONLINE_SHOW,
                            },
                            ...queryVideoRank,
                        })
                        .populate({
                            path: 'programCategory.categoryManageId',
                            select: 'categoryMangeName',
                        })
                        .select(programConstant.FIELD_SELECT_PROGRAM_HOME)
                        .limit(10)
                        .sort({ createdAt: -1 })
                        .lean();
                    delete item.homesetCategoriesList;
                    item.ableShowMore = true;
                    item.headingName = item.homesetName;

                    await Promise.all(
                        item.programs.map((program) => {
                            program.isMyList = myList?.programs?.includes(item._id);

                            const timePlay = programPlay?.programIDs?.find(
                                    (programID) => programID.id === program._id.toString()
                                );
                            program.timePlay = (timePlay && timePlay.time) || 0;
                        })
                    );
                })
            );

            // //get like & unlike user
            // const likeUnlike = await likeUnlikeModel.find({ userId: userData._id });

            // //get video like unlike
            // let videos = {};
            // await Promise.all(
            //     likeUnlike.map((v) => {
            //         videos = Object.assign(videos, { [v.programId]: v.type });
            //     })
            // );

            // Object.entries(data).forEach(([i, home]) => {
            //     Object.entries(home['programs']).forEach(([l, program]) => {
            //         program.isLike = videos[program._id] === 'like';
            //         program.isUnlike = videos[program._id] === 'unlike';
            //     });
            // });

            const result = data.filter((item) => {
                return item?.programs?.length;
            });
            return logger.status200(response, system.success, '', result);
        } catch (error) {
            errors.push(error.message);
            return logger.status400(response, error, errors);
        }
    }

    // [GET] /online/homeset/:id
    async getDetailHomeSet(request, response, next) {
        const errors = [];
        const params = request.params;
        const query = request.query;

        const type = {
            category: '1',
            list: '2',
        };
        try {
            let arrayList = [];

            if (!query || !query.type || !Object.values(type).includes(query.type)) {
                return logger.status404(
                    response,
                    false,
                    homeConstant.typeIsNotDefined
                );
            }

            // Filter by videoRank
            let queryVideoRank = {};
            if (request.query.videoRank) {
                queryVideoRank.videoRank = parseInt(request.query.videoRank) || 0;
            }

            if (query.type === type.category) {
                const homeSet = await homeSetModel
                    .findOne({ slugName: params.id })
                    .populate({
                        path: 'homesetCategoriesList',
                        populate: [
                            {
                                path: 'categoriesArrayList',
                                select: 'listName listChildren listProgramList slugName _id',
                                populate: [
                                    {
                                        path: 'listProgramList',
                                        match: {
                                            programDisplay: true,
                                            deleted: false,
                                            programType:
                                                constants.PROGRAM_TYPE_ONLINE_SHOW,
                                            ...programConstant.FIELD_QUERY_DEFAULT,
                                            ...queryVideoRank,
                                        },
                                        select: '_id slugName',
                                    },
                                    {
                                        path: 'listChildren',
                                        select: '_id slugName',
                                    },
                                ],
                            },
                            {
                                path: 'categoritesPosterProgramID',
                                select: 'programImagePoster',
                            },
                        ],
                    })
                    .lean();

                if (!homeSet) {
                    return logger.status404(response, false, homeConstant.categorySetIDNotFound);
                }

                await Promise.all(
                    homeSet?.homesetCategoriesList?.map((category) => {
                        const poster = category?.categoritesPosterProgramID?.programImagePoster || '';

                        category.categoriesArrayList.map((list) => {
                            list.categoriesPoster = poster;
                        });

                        arrayList = arrayList.concat(category.categoriesArrayList);
                    })
                );

                arrayList = arrayList.filter((item) => {
                    item.ableShowMore = false;
                    item.headingName = item.listName;
                    if (item.listChildren && item.listChildren.length) {
                        item.ableShowMore = true;
                    }
                    delete item.listChildren;
                    item.totalProgram = item.listProgramList.length;
                    return item?.listProgramList?.length;
                });
            } else {
                const list = await listModel
                    .findOne({ slugName: params.id })
                    .populate({
                        path: 'listChildren',
                        select: 'listName listChildren listProgramList slugName',
                        populate: [
                            {
                                path: 'listProgramList',
                                match: {
                                    programDisplay: true,
                                    deleted: false,
                                    programType: constants.PROGRAM_TYPE_ONLINE_SHOW,
                                    ...programConstant.FIELD_QUERY_DEFAULT,
                                    ...queryVideoRank,
                                },
                                select: '_id slugName',
                            },
                            {
                                path: 'listChildren',
                                select: '_id slugName',
                            },
                        ],
                    })
                    .lean();

                if (!list) {
                    return logger.status404(response, false, homeConstant.listIDNotFound);
                }

                const arrayAvailable = list.listChildren.filter((item) => {
                    item.headingName = item.listName;
                    item.totalProgram = item.listProgramList.length;
                    return item?.listProgramList?.length;
                });
                arrayList = arrayList.concat(arrayAvailable);
            }

            return logger.status200(response, system.success, '', [
                ...new Set(arrayList),
            ]);
        } catch (error) {
            errors.push(error.message);
            return logger.status400(response, error, errors);
        }
    }

    // [GET] /online/program-in-list/:id
    async getProgramInList(request, response, next) {
        const errors = [];
        const userData = request.user;
        const params = request.params;

        try {
            const programID = await listModel.findOne({ slugName: params.id });

            if (!programID) {
                return logger.status404(response, false, 'List id not found');
            }
            request.query._id = {
                $in: programID.listProgramList,
            };
            request.query.programDisplay = true;
            request.query.deleted = false;
            request.query.sort = 'programTotalView,desc';
            request.query.programType = constants.PROGRAM_TYPE_ONLINE_SHOW;
            Object.assign(request.query, programConstant.FIELD_QUERY_DEFAULT);

            let programs = await businessQuery.handle(
                programModel,
                request,
                {
                    path: 'programCategory.categoryManageId',
                    select: 'categoryMangeName',
                },
                programConstant.FIELD_SELECT_PROGRAM_HOME
            );

            // //get like & unlike user
            // let likeUnlike = await likeUnlikeModel.find({ userId: userData._id });

            // //get video like unlike
            // let videos = {};
            // await Promise.all(
            //     likeUnlike.map((v) => {
            //         videos = Object.assign(videos, { [v.programId]: v.type });
            //     })
            // );

            // Object.entries(programs.docs).forEach(([v, va]) => {
            //     va.isLike = videos[va._id] === 'like';
            //     va.isUnlike = videos[va._id] === 'unlike';
            // });

            programs = JSON.parse(JSON.stringify(programs));

            const myList = JSON.parse(
                JSON.stringify(await myListModel.findOne({ userID: userData._id }))
            );
            const programPlay = await UserProgramModel.findOne({ userID: userData._id });
            await Promise.all(
                programs.docs.map(async (item) => {
                    item.isMyList = myList?.programs?.includes(item._id);

                    const timePlay = programPlay?.programIDs?.find(
                            (programID) => programID.id === item._id
                        );
                    item.timePlay = (timePlay && timePlay.time) || 0;
                })
            );
            return logger.status200(response, system.success, '', programs);
        } catch (error) {
            errors.push(error.message);
            return logger.status400(response, error, errors);
        }
    }

    // [GET] /online/user-categories-set
    async getUserCategoriesSet(request, response, next) {
        const userData = request.user;
        const errors = [];

        try {
            //get detial home set

            const userCategoriesSet = JSON.parse(
                JSON.stringify(userData.userCategoriesSet)
            );

            // Filter by videoRank
            let queryVideoRank = {};
            if (request.query.videoRank) {
                queryVideoRank.videoRank = parseInt(request.query.videoRank) || 0;
            }
            const categories = await Promise.all(
                userCategoriesSet.map(async (item, index) => {
                    if (index >= 3) return;
                    const categoriesSet = await categoriesSetModel.findById(item);

                    if (!categoriesSet) return;
                    const distinctPrograms = await listModel.distinct('listProgramList', {
                        _id: { $in: categoriesSet.categoriesArrayList },
                    });

                    const programs = await programModel
                        .find({
                            _id: {
                                $in: distinctPrograms,
                            },
                            programDisplay: true,
                            deleted: false,
                            ...queryVideoRank,
                            programType: {
                                $in: constants.PROGRAM_TYPE_ONLINE_SHOW,
                            },
                            ...programConstant.FIELD_QUERY_DEFAULT,
                        })
                        .populate({
                            path: 'programCategory.categoryManageId',
                            select: 'categoryMangeName',
                        })
                        .select(programConstant.FIELD_SELECT_PROGRAM_HOME)
                        .sort({
                            programTotalView: -1,
                        })
                        .limit(request.query.limit || 24);

                    return {
                        categoriesName: categoriesSet.categoriesName,
                        programs,
                    };
                })
            );

            // // get like & unlike user
            // const likeUnlike = await likeUnlikeModel.find({ userId: userData._id });

            // // get video like unlike
            // let videos = {};
            // await Promise.all(
            //     likeUnlike.map((v) => {
            //         videos = Object.assign(videos, { [v.programId]: v.type });
            //     })
            // );

            const result = JSON.parse(JSON.stringify(categories.filter((item) => item)));

            // get video like unlike
            const myList = JSON.parse(
                JSON.stringify(await myListModel.findOne({ userID: userData._id }))
            );
            const programPlay = await UserProgramModel.findOne({ userID: userData._id });
            await Promise.all(
                result.map(async (item) => {
                    await Promise.all(
                        item.programs.map(async (program) => {
                            // program.isLike = videos[program._id] === 'like'
                            // program.isUnlike = videos[program._id] === 'unlike'
                            program.isMyList = myList?.programs?.includes(program._id);

                            const timePlay = programPlay?.programIDs?.find(
                                    (programID) => programID.id === program._id
                                );
                            program.timePlay = (timePlay && timePlay.time) || 0;
                        })
                    );
                })
            );
            return logger.status200(response, system.success, '', result);
        } catch (error) {
            errors.push(error.message);
            return logger.status500(response, error, errors);
        }
    }

    // [GET] /online/list/:id
    async getDetailList(request, response, next) {
        const params = request.params;
        const errors = [];
        const userData = request.user;
        request.query.programDisplay = true;
        request.query.deleted = false;
        request.query.sort = 'createdAt,desc';
        request.query.programType = constants.PROGRAM_TYPE_ONLINE_SHOW;
        Object.assign(request.query, programConstant.FIELD_QUERY_DEFAULT);

        try {
            const listArray = await listModel.distinct('listProgramList', {
                _id: params.id,
            });

            request.query._id = listArray;
            let data = await businessQuery.handle(
                programModel,
                request,
                {
                    path: 'programCategory.categoryManageId',
                    select: 'categoryMangeName',
                },
                programConstant.FIELD_SELECT_PROGRAM_HOME
            );

            // //get like & unlike user
            // let likeUnlike = await likeUnlikeModel.find({ userId: userData._id });

            // //get video like unlike
            // let videos = {};
            // await Promise.all(
            //     likeUnlike.map((v) => {
            //         videos = Object.assign(videos, { [v.programId]: v.type });
            //     })
            // );

            // Object.entries(data.docs).forEach(([v, va]) => {
            //     va.isLike = videos[va._id] === 'like';
            //     va.isUnlike = videos[va._id] === 'unlike';
            // });

            data = JSON.parse(JSON.stringify(data));

            const myList = JSON.parse(
                JSON.stringify(await myListModel.findOne({ userID: userData._id }))
            );
            const programPlay = await UserProgramModel.findOne({ userID: userData._id });
            await Promise.all(
                data.docs.map((item) => {
                    item.isMyList = myList?.programs?.includes(item._id);

                    const timePlay = programPlay?.programIDs?.find(
                            (programID) => programID.id === item._id
                        );
                    item.timePlay = (timePlay && timePlay.time) || 0;
                })
            );
            return logger.status200(response, system.success, '', data);
        } catch (error) {
            errors.push(error.message);
            return logger.status500(response, error, errors);
        }
    }

    // [POST] /online/add/list
    async addMyList(request, response, next) {
        const user = request.user;
        const formData = request.body;
        const errors = [];
        const updates = Object.keys(formData);

        const allowedUpdates = ['id'];

        const isValidOperation = updates.every((update) => {
            return allowedUpdates.includes(update);
        });

        if (!isValidOperation) {
            return response.status(400).json({
                status: system.error,
                msg: 'Field error',
            });
        }
        let session = await mongoose.startSession();
        session.startTransaction();

        try {
            const program = await programModel.findById(formData.id);
            if (!program) {
                session.endSession();
                return logger.status404(
                    response,
                    system.errorValue,
                    challengerConstant.notFound(formData.id)
                );
            }

            if (program.programType === constants.PROGRAM_TYPE.PROGRAM_ORIGINAL) {
                const memberShip = await MembershipModel.findById(user.userMembership);

                if (
                    !memberShip ||
                    memberShip.packageName !== constants.MEMBER_SHIP.PREMIUM
                ) {
                    session.endSession();
                    return logger.status400(response, system.membershipInvalid, errors);
                }
            }

            // If programTypeVideo = season and it is child then programID = parentID
            const programIDs = [mongoose.Types.ObjectId(formData.id)];
            if (
                program.programTypeVideo === constants.TYPE_VIDEO.SS &&
                program.programSeasonChild
            ) {
                programIDs.push(program.programChildrenSeasonData.parentID);
            }

            let myList = await myListModel.findOne({ userID: user._id });

            if (myList) {
                if (!myList.programs.includes(mongoose.Types.ObjectId(formData.id))) {
                    myList.programs = myList.programs.concat(programIDs);

                    myList.programs = _.uniqWith(myList.programs, _.isEqual);
                    await myList.save({ session: session });
                } else {
                    myList.programs = myList.programs.filter(
                        (item) => item && item.toString() !== formData.id
                    );
                    await myList.save({ session: session });
                    await session.commitTransaction();
                    session.endSession();
                    return logger.status200MyList(
                        response,
                        system.success,
                        false,
                        'Remove id: ' + formData.id + ' success in my list!'
                    );
                }
            } else {
                const newMyList = new myListModel({
                    userID: user._id,
                    programs: programIDs,
                });
                await newMyList.save({ session });
            }

            await session.commitTransaction();
            session.endSession();
            return logger.status200MyList(
                response,
                system.success,
                true,
                'Add id: ' + formData.id + ' success in my list!'
            );
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            errors.push(error.message);
            return logger.status500(response, error, errors);
        }
    }

    // // [GET] /online/search
    // async searchVideo(request, response, next) {
    // 	const errors = [];

    // 	try {
    // 		let keyword = request.query.keyword
    // 		// if (request.query.keyword) {
    // 		// 	keyword = new RegExp(request.query.keyword, 'i');
    // 		// }

    // 		// Search by category and tag
    // 		const categories = await categoryManageModel.distinct('_id', {
    // 			categoryMangeName: keyword,
    // 			deleted: false,
    // 		});
    // 		const tags = await tagModel.distinct('_id', { tagName: keyword, deleted: false });

    // 		// Query
    // 		const select = {
    // 			$or: [
    // 				{
    // 					$text: { $search: keyword }
    // 				}
    // 			],
    // 			programDisplay: true,
    // 			deleted: false,
    // 			programType: { $in: constants.PROGRAM_TYPE_ONLINE_SHOW },
    // 			...programConstant.FIELD_QUERY_DEFAULT
    // 		}
    // 		if (categories.length) {
    // 			select['$or'].push({
    // 				'programCategory.categoryManageId': { $in: categories },
    // 			});
    // 		}
    // 		if (tags.length) {
    // 			select['$or'].push({
    // 				'programCategory.categoryArrayTag': { $in: tags },
    // 			});
    // 		}
    // 		if (request.query.videoRank) {
    // 			select.videoRank = request.query.videoRank
    // 		}
    // 		const page = parseInt(request.query.page) || 1
    // 		const limit = parseInt(request.query.limit) || 10
    // 		const offset = (page - 1) * limit

    // 		const totalDocs = await programModel.count(select)
    // 		const totalPages = Math.ceil(totalDocs / limit)

    // 		const programs = await programModel.find(select, { score: { $meta: "textScore" } })
    // 			.select(programConstant.FIELD_SELECT_PROGRAM_HOME)
    // 			.sort({ score: { $meta: "textScore" } })
    // 			.skip((page - 1) * limit)
    // 			.limit(limit)

    // 		return logger.status200(response, system.success, '', {
    // 			docs: programs,
    // 			totalDocs,
    // 			offset,
    // 			limit,
    // 			totalPages,
    // 			page
    // 		});
    // 	} catch (error) {
    // 		errors.push(error.message);
    // 		return logger.status500(response, error, errors, system.error);
    // 	}
    // }

    // [GET] /online/search
    async searchVideo(request, response, next) {
        const errors = [];

        try {
            const keyword = new RegExp(request.query.keyword || '', 'i');
            delete request.query.keyword;

            request.query['$or'] = [
                {
                    programName: keyword,
                },
                {
                    programTitle: keyword,
                },
                {
                    programSubTitle: keyword,
                },
                {
                    programSummary: keyword,
                },
                {
                    'programParticipants.dataType': keyword,
                },
                {
                    'programChildrenSeasonData.episodeSummary': keyword,
                },
            ];

            // Search by category and tag
            const categories = await categoryManageModel.distinct('_id', {
                categoryMangeName: keyword,
                deleted: false,
            });
            const tags = await tagModel.distinct('_id', {
                tagName: keyword,
                deleted: false,
            });
            if (!categories || !categories.length) {
                request.query['$or'].push({
                    'programCategory.categoryManageId': { $in: categories },
                });
            }
            if (!tags || !tags.length) {
                request.query['$or'].push({
                    'programCategory.categoryArrayTag': { $in: tags },
                });
            }

            // Search by status
            request.query.programDisplay = true;
            request.query.deleted = false;

            // Search by type
            request.query.programType = constants.PROGRAM_TYPE_ONLINE_SHOW;
            Object.assign(request.query, programConstant.FIELD_QUERY_DEFAULT);

            const programs = await businessQuery.handle(
                programModel,
                request,
                {
                    path: 'programCategory.categoryManageId',
                    select: 'categoryMangeName',
                },
                programConstant.FIELD_SELECT_PROGRAM_HOME
            );
            return logger.status200(response, system.success, '', programs);
        } catch (error) {
            errors.push(error.message);
            return logger.status500(response, error, errors, system.error);
        }
    }

    // [GET] /online/categories
    async getCategoriesUser(request, response, next) {
        const userData = request.user;
        const errors = [];
        request.query.programDisplay = true;
        request.query.deleted = false;
        request.query.sort = 'createdAt,asc';
        request.query.programType = constants.PROGRAM_TYPE_ONLINE_SHOW;

        try {
            //get list category
            const category = JSON.parse(JSON.stringify(userData.userCategoriesSet));
            const listCategory = await categoriesSetModel.distinct(
                'categoriesArrayList',
                { _id: category }
            );

            // get list
            const listArray = await listModel.distinct('listProgramList', {
                _id: listCategory,
            });

            request.query._id = listArray;
            Object.assign(request.query, programConstant.FIELD_QUERY_DEFAULT);

            let myList = await businessQuery.handle(
                programModel,
                request,
                {
                    path: 'programCategory.categoryManageId',
                    select: 'categoryMangeName',
                },
                programConstant.FIELD_SELECT_PROGRAM_HOME
            );

            // //get like & unlike user
            // let likeUnlike = await likeUnlikeModel.find({ userId: userData._id });

            // //get video like unlike
            // let videos = {};
            // await Promise.all(
            //     likeUnlike.map((v) => {
            //         videos = Object.assign(videos, { [v.programId]: v.type });
            //     })
            // );

            // Object.entries(myList.docs).forEach(([v, va]) => {
            //     va.isLike = videos[va._id] === 'like';
            //     va.isUnlike = videos[va._id] === 'unlike';
            // });

            return logger.status200(response, system.success, '', myList);
        } catch (error) {
            errors.push(error.message);
            return logger.status500(response, error, errors);
        }
    }

    // [GET] /online/:id
    async getDetailProgram(request, response, next) {
        const params = request.params;
        const user = request.user;
        const errors = [];

        try {
            const programUser = await programModel.findById(params.id).populate([
                { path: 'userID', select: 'userName' },
                { path: 'programCategory.categoryManageId', select: 'categoryMangeName' },
                { path: 'programCategory.categoryArrayTag', select: 'tagName' },
                {
                    path: 'programSeasonData.episode',
                    select: [...programConstant.FIELD_SELECT_PROGRAM_HOME, 'createdAt'],
                    match: { deleted: false, programDisplay: true }
                },
            ]);

            const program = JSON.parse(JSON.stringify(programUser));
            if (!program) {
                return logger.status404(
                    response,
                    system.error,
                    system.notFound(params.id)
                );
            }

            program.showBtnPlay = true;
            if (program.programType === constants.PROGRAM_TYPE.PROGRAM_ORIGINAL) {
                const memberShip = await MembershipModel.findById(user.userMembership);

                if (
                    !memberShip ||
                    memberShip.packageName !== constants.MEMBER_SHIP.PREMIUM
                ) {
                    delete program.linkVideoDRM;
                    delete program.linkVideo;
                    program.showBtnPlay = false;
                }
            }

            // // Check like unlike
            // const like = await likeUnlikeModel.distinct('type', {
            //     userId: request.user._id,
            //     programId: program._id,
            //     deleted: false,
            // });

            // program.isLike = like.some((item) => item === 'like');
            // program.isUnlike = like.some((item) => item === 'unlike');

            // Check is my list
            const myList = JSON.parse(
                JSON.stringify(await myListModel.findOne({ userID: request.user._id }))
            );
            program.isMyList = myList ? myList.programs.includes(program._id) : false;

            const programPlay = await UserProgramModel.findOne({
                userID: request.user._id,
            });
            const timePlay = programPlay?.programIDs?.find((programID) => programID.id === params.id);
            program.timePlay = (timePlay && timePlay.time) || 0;

            await Promise.all(
                program?.programSeasonData?.map((item) => {
                    item.seasonEpisode = item.episode || [];

                    item?.episode?.map((episode) => {
                        const timePlayChild = programPlay?.programIDs?.find(
                                (programID) => programID.id === episode._id
                            );
                        episode.timePlay = (timePlayChild && timePlayChild.time) || 0;
                    });
                })
            );
            return logger.status200(response, system.success, '', program);
        } catch (error) {
            errors.push(error.message);
            return logger.status500(response, error, errors);
        }
    }

    // [GET] /online/similar/:id
    async getSimilarPrograms(request, response, next) {
        const params = request.params;
        const errors = [];
        const limit = 24;
        try {
            const program = await programModel.findById(params.id);
            if (!program) {
                return logger.status404(
                    response,
                    system.error,
                    system.notFound(params.id)
                );
            }

            const similarPrograms = await programModel
                .find({
                    _id: { $ne: params.id },
                    ...programConstant.FIELD_QUERY_DEFAULT,
                    programDisplay: true,
                    deleted: false,
                    programType: constants.PROGRAM_TYPE_ONLINE_SHOW,
                    'programCategory.categoryManageId':
                        program.programCategory.categoryManageId,
                })
                .select(programConstant.FIELD_SELECT_PROGRAM_HOME)
                .populate({
                    path: 'programCategory.categoryManageId',
                    select: 'categoryMangeName',
                })
                .limit(limit);

            return logger.status200(response, system.success, '', similarPrograms);
        } catch (error) {
            errors.push(error.message);
            return logger.status500(response, error, errors);
        }
    }

    // [GET] /online/bracters
    async getBracters(request, response, next) {
        const errors = [];
        try {
            const bracters = await BractersModel.find()
                .select('limitProgramShow categoryID')
                .populate({
                    path: 'categoryID',
                    select: 'categoriesName',
                })
                .sort({
                    updatedAt: -1,
                });
            return logger.status200(response, system.success, '', bracters);
        } catch (error) {
            errors.push(error.message);
            return logger.status500(response, error, errors);
        }
    }

    // [GET] /online/bracter/:id
    async getListProgramInBracter(request, response, next) {
        const params = request.params;
        const errors = [];
        try {
            // Filter by videoRank
            let queryVideoRank = {};
            if (request.query.videoRank) {
                queryVideoRank.videoRank = parseInt(request.query.videoRank) || 0;
            }

            const bracter = await BractersModel.findById(params.id).populate([
                {
                    path: 'listPrograms.programID',
                    select: programConstant.FIELD_SELECT_PROGRAM_HOME,
                    match: {
                        programType: constants.PROGRAM_TYPE_ONLINE_SHOW,
                        deleted: false,
                        programDisplay: true,
                        ...programConstant.FIELD_QUERY_DEFAULT,
                        ...queryVideoRank,
                    },
                },
            ]);

            const programs = [];
            bracter &&
                bracter.listPrograms.reverse().forEach((item) => {
                    if (programs.length < bracter.limitProgramShow) {
                        if (item && item.programID) {
                            programs.push(item.programID);
                        }
                    } else {
                        return;
                    }
                });
            return logger.status200(response, system.success, '', programs);
        } catch (error) {
            errors.push(error.message);
            return logger.status500(response, error, errors);
        }
    }

    // [GET] online/newest
    async newestProgram(request, response, next) {
        const userData = request.user;
        const errors = [];
        try {
            request.query.programDisplay = true;
            request.query.deleted = false;
            request.query.sort = 'createdAt,desc';
            request.query.programType = constants.PROGRAM_TYPE_ONLINE_SHOW;
            request.query.limit = request.query.limit || 24;
            Object.assign(request.query, programConstant.FIELD_QUERY_DEFAULT);

            let newestPrograms = await businessQuery.handle(
                programModel,
                request,
                {
                    path: 'programCategory.categoryManageId',
                    select: 'categoryMangeName',
                },
                programConstant.FIELD_SELECT_PROGRAM_HOME
            );

            // //get like & unlike user
            // let likeUnlike = await likeUnlikeModel.find({ userId: userData._id });

            // //get video like unlike
            // let videos = {};

            // await Promise.all(
            //     likeUnlike.map((v) => {
            //         videos = Object.assign(videos, { [v.programId]: v.type });
            //     })
            // );

            // Object.entries(newestPrograms.docs).forEach(([v, va]) => {
            //     va.isLike = videos[va._id] === 'like';
            //     va.isUnlike = videos[va._id] === 'unlike';
            // });

            newestPrograms = JSON.parse(JSON.stringify(newestPrograms));

            // take a flag program which is in my list
            const myList = JSON.parse(
                JSON.stringify(await myListModel.findOne({ userID: userData._id }))
            );
            const programPlay = await UserProgramModel.findOne({ userID: userData._id });
            await Promise.all(
                newestPrograms.docs.map((item) => {
                    item.isMyList = myList?.programs?.includes(item._id);

                    const timePlay = programPlay?.programIDs?.find(
                            (programID) => programID.id === item._id
                        );
                    item.timePlay = (timePlay && timePlay.time) || 0;
                })
            );
            return logger.status200(response, system.success, '', newestPrograms);
        } catch (error) {
            errors.push(error.message);
            return logger.status500(response, error, errors);
        }
    }

    // [GET] /online/search-creator
    async searchCreatorInfo(request, response, next) {
        const errors = [];
        let query = request.query;

        try {
            let keyword = query.keyword ?? null;
            let categories = query.category ?? null;
            let videoRank = parseInt(query.videoRank) || 0;
            delete request.query.keyword;
            delete request.query.videoRank;
            delete request.query.category;
            request.query.programDisplay = true;
            request.query.deleted = false;
            request.query.videoRank = { $gte: 0, $lte: videoRank };
            if (keyword) {
                // request.query['programParticipants.nameType'] = 'Creator';
                request.query['programParticipants.dataType'] = { $in: keyword };
            }

            if (categories) {
                request.query['programCategory.categoryManageId'] = { $in: categories };
            }

            if (!keyword && !categories) {
                return logger.status200(response, system.error, 'Input is null');
            }

            const result = await businessQuery.handle(programModel, request);
            return logger.status200(response, system.success, '', result);
        } catch (error) {
            errors.push(error.message);
            return logger.status500(response, error, errors, system.error);
        }
    }
}

module.exports = new homeOnlineController();
