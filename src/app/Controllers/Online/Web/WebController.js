const system = require('../../../Constant/General/SystemConstant');
const logger = require('../../../Constant/Logger/loggerConstant');
const programModel = require('../../../Models/Program/ProgramModel');
const businessQuery = require('../../../Business/QueryModel');
const likeUnlikeModel = require('../../../Models/Action/LikeAndUnlikeModel');
const myListModel = require('../../../Models/User/MyListModel');
const constants = require('../../../Constant/constants');
const programConstant = require('../../../Constant/Program/ProgramConstant');
const moment = require('moment-timezone');
const MembershipModel = require('../../../Models/Manage/Membership/MembershipModel');
const UserProgramModel = require('../../../Models/User/UserProgramModel');
const homeSetModel = require('../../../Models/HomeSet/HomeSetModel');
const categoriesSetModel = require('../../../Models/CategoriesSet/CategoriesSetModel');
const listModel = require('../../../Models/List/ListModel');
const homeConstant = require('../../../Constant/Home/HomeConstant');

class WebOnlineController {
    // [GET] /web/get-seasons/:id
    async getSeasons(request, response, next) {
        const errors = [];
        const params = request.params;
        try {
            const program = await programModel
                .findOne(
                    {
                        _id: params.id,
                        deleted: false,
                        programTypeVideo: constants.TYPE_VIDEO.SS,
                        programDisplay: true,
                        programSeasonChild: false,
                    },
                    {
                        programSeasonData: 1,
                    }
                )
                .populate({
                    path: 'programSeasonData.episode',
                    match: { deleted: false, programDisplay: true },
                })
                .lean();

            if (!program) {
                return logger.status404(
                    response,
                    system.success,
                    programConstant.notFound(params.id)
                );
            }

            const result = await Promise.all(
                program.programSeasonData.map((item) => {
                    item.totalEpisode = item.episode.length;
                    delete item.episode;
                    return item;
                })
            );
            return logger.status200(response, system.success, '', result);
        } catch (error) {
            errors.push(error.message);
            return logger.status500(response, error, errors);
        }
    }

    // [GET] /web/get-episodes/:id
    async getEpisodes(request, response, next) {
        const errors = [];
        const params = request.params;
        const query = request.query;

        try {
            const program = await programModel
                .findOne(
                    {
                        _id: params.id,
                        deleted: false,
                        programTypeVideo: constants.TYPE_VIDEO.SS,
                        programDisplay: true,
                        programSeasonChild: false,
                    },
                    {
                        programSeasonData: 1,
                    }
                )
                .lean();

            if (!program) {
                return logger.status404(
                    response,
                    system.success,
                    programConstant.notFound(params.id)
                );
            }

            const season = program.programSeasonData.find(
                (item) => item._id.toString() === query.seasonID
            );
            delete request.query.seasonID;

            request.query._id = {
                $in: season.episode,
            };

            request.query.programDisplay = true;
            request.query.deleted = false;
            const result = await businessQuery.handle(
                programModel,
                request,
                {
                    path: 'programCategory.categoryManageId',
                    select: 'categoryMangeName',
                },
                programConstant.FIELD_SELECT_PROGRAM_HOME
            );
            return logger.status200(response, system.success, '', result);
        } catch (error) {
            errors.push(error.message);
            return logger.status500(response, error, errors);
        }
    }

    // [GET] /web/detail/:id
    async getDetailProgram(request, response, next) {
        const errors = [];
        const params = request.params;
        const userData = request.user;

        try {
            const program = await programModel
                .findOne(
                    {
                        _id: params.id,
                        deleted: false,
                        programDisplay: true,
                    },
                    {
                        programImagePoster: 1,
                        linkVideo: 1,
                        linkVideoDRM: 1,
                        isLike: 1,
                        isUnlike: 1,
                        programTypeVideo: 1,
                        programType: 1,
                        programTitle: 1,
                        'programCategory.categoryArrayTag': 1,
                        programImageTitleResize1: 1,
                        programImageTitleResize2: 1,
                        programThumbnailResizeX1: 1,
                        programThumbnailResizeX2: 1,
                        programImagePosterNoTitleResize : 1,
                        programImagex1: 1,
                        programImagex2: 2,
                        programOriginalPosterResizeX1: 1,
                        programOriginalPosterResizeX2: 1,
                    }
                )
                .populate([
                    {
                        path: 'programCategory.categoryArrayTag',
                        select: 'tagName',
                        limit: 3,
                    },
                ])
                .lean();

            if (!program) {
                return logger.status404(
                    response,
                    system.success,
                    programConstant.notFound(params.id)
                );
            }

            program.showBtnPlay = true;
            if (program.programType === constants.PROGRAM_TYPE.PROGRAM_ORIGINAL) {
                const memberShip = await MembershipModel.findById(
                    userData.userMembership
                );

                if (
                    !memberShip ||
                    memberShip.packageName !== constants.MEMBER_SHIP.PREMIUM
                ) {
                    delete program.linkVideoDRM;
                    delete program.linkVideo;
                    program.showBtnPlay = false;
                }
            }

            //get like & unlike user
            // let likeUnlike = await likeUnlikeModel.find({ userId: userData._id });

            // //get video like unlike
            // let videos = {};
            // await Promise.all(
            // 	likeUnlike.map((v) => {
            // 		videos = Object.assign(videos, { [v.programId]: v.type });
            // 	})
            // );

            // program.isLike = videos[program._id] === 'like' ? true : false;
            // program.isUnlike = videos[program._id] === 'unlike' ? true : false;

            program.isMyList = !!(await myListModel.findOne({
                userID: userData._id,
                programs: program._id,
            }));

            const programPlay = await UserProgramModel.findOne({ userID: userData._id });
            const timePlay = programPlay?.programIDs?.find(
                (programID) => programID.id === params.id
            );
            program.timePlay = (timePlay && timePlay.time) || 0;

            return logger.status200(response, system.success, '', program);
        } catch (error) {
            errors.push(error.message);
            return logger.status500(response, error, errors);
        }
    }

    // [GET] /web/poster
    async getPoster(request, response, next) {
        const errors = [];

        try {
            const program = await programModel
                .findOne(
                    {
                        deleted: false,
                        programDisplay: true,
                    },
                    {
                        programImageTitle: 1,
                        linkVideo: 1,
                        programSummary: 1,
                        videoRank: 1,
                        programTypeVideo: 1,
                        programImagePoster: 1,
                    }
                )
                .sort({
                    createdAt: -1,
                });
            return logger.status200(response, system.success, '', program);
        } catch (error) {
            errors.push(error.message);
            return logger.status500(response, error, errors);
        }
    }

    // [GET] /web/original
    async getProgramOriginal(request, response, next) {
        const userData = request.user;
        const errors = [];
        request.query = {
            ...request.query,
            programDisplay: true,
            deleted: false,
            sort: 'createdAt,desc',
            programType: constants.PROGRAM_TYPE.PROGRAM_ORIGINAL,
            ...programConstant.FIELD_QUERY_DEFAULT,
        };
        try {
            let programs = await businessQuery.handle(
                programModel,
                request,
                {
                    path: 'programCategory.categoryManageId',
                    select: 'categoryMangeName',
                },
                programConstant.FIELD_SELECT_PROGRAM_HOME
            );

            programs = JSON.parse(JSON.stringify(programs));

            const myList = JSON.parse(
                JSON.stringify(await myListModel.findOne({ userID: userData._id }))
            );
            const programPlay = await UserProgramModel.findOne({ userID: userData._id });
            await Promise.all(
                programs.docs.map((item) => {
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
            return logger.status500(response, error, errors);
        }
    }

    // [GET] /web/this-week
    async newestThisWeek(request, response) {
        const errors = [];
        request.query.programType = constants.PROGRAM_TYPE.PROGRAM_ORIGINAL;
        request.query.deleted = false;
        request.query.programDisplay = true;

        const startOfWeek = moment().startOf('isoWeek').toDate();
        const endOfWeek = moment().endOf('isoWeek').toDate();

        request.query.originalDate = {
            $gte: startOfWeek,
            $lte: endOfWeek,
        };

        try {
            Object.assign(request.query, programConstant.FIELD_QUERY_DEFAULT);

            const data = await businessQuery.handle(
                programModel,
                request,
                {
                    path: 'programCategory.categoryManageId',
                    select: 'categoryMangeName',
                },
                programConstant.FIELD_SELECT_PROGRAM_HOME
            );
            return logger.status200(response, system.success, '', data);
        } catch (error) {
            errors.push(error.message);
            return logger.status500(response, error, errors);
        }
    }

    // [GET] /web/next-week
    async newestNextWeek(request, response) {
        const errors = [];
        request.query.programType = constants.PROGRAM_TYPE.PROGRAM_ORIGINAL;
        request.query.deleted = false;
        request.query.programDisplay = true;

        const startNextWeek = moment().startOf('isoWeek').add(1, 'week').toDate();
        const endNextWeek = moment().endOf('isoWeek').add(1, 'week').toDate();

        request.query.originalDate = {
            $gte: startNextWeek,
            $lte: endNextWeek,
        };

        try {
            Object.assign(request.query, programConstant.FIELD_QUERY_DEFAULT);

            const data = await businessQuery.handle(
                programModel,
                request,
                {
                    path: 'programCategory.categoryManageId',
                    select: 'categoryMangeName',
                },
                programConstant.FIELD_SELECT_PROGRAM_HOME
            );
            return logger.status200(response, system.success, '', data);
        } catch (error) {
            errors.push(error.message);
            return logger.status500(response, error, errors);
        }
    }

    // [GET] /web/homeset
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

            // Filter by videoRank
            let queryVideoRank = {};
            if (request.query.videoRank) {
                queryVideoRank.videoRank = parseInt(request.query.videoRank) || 0;
            }

            const homeSet = await homeSetModel
                .find(
                    {
                        ['homeset' + we]: true,
                    },
                    fieldSelect.homeset
                )
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
                        },
                        {
                            path: 'categoritesPosterProgramID',
                            select: 'programImagePoster',
                        },
                    ],
                })
                .sort({ updatedAt: -1 })
                .lean();

            // Get home set by available time
            let data = homeSet.find((v) => {
                const temp = v;
                let start = temp.homesetTimeStart;
                let end = temp.homesetTimeEnd;
                if (!end || !start) {
                    return false;
                }
                const timeStart = start.split(/:| /);
                const timeEnd = end.split(/:| /);

                if (timeStart[2] === 'PM') timeStart[0] = Number(timeStart[0]) + 12;
                if (timeEnd[2] === 'PM') timeEnd[0] = Number(timeEnd[0]) + 12;
                start = timeStart[0] * 60 + Number(timeStart[1]);
                end = timeEnd[0] * 60 + Number(timeEnd[1]);
                if (start < timeNow && timeNow < end) {
                    return true;
                }
            });

            if (!data) data = homeSet[0];

            if (!data) {
                return logger.status404(response, system.error, homeConstant.notInTime);
            }
            // Check isMyList
            const myList = JSON.parse(
                JSON.stringify(await myListModel.findOne({ userID: userData._id }))
            );
            const programPlay = await UserProgramModel.findOne({ userID: userData._id });
            // Get program in categories set
            await Promise.all(
                data.homesetCategoriesList.map(async (item) => {
                    item.programs = [];
                    Array.from(item.categoriesArrayList).map((list) => {
                        item.programs = item.programs.concat(list.listProgramList);
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
                    item.ableShowMore = true;
                    item.headingName = item.categoriesName;
                    delete item.categoriesArrayList;
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

            const result = data.homesetCategoriesList.filter((item) => {
                return item.programs && item.programs.length;
            });
            return logger.status200(response, system.success, '', result);
        } catch (error) {
            errors.push(error.message);
            return logger.status400(response, error, errors);
        }
    }

    // [GET] /web/homeset/detail
    async getDetailHomeSet(request, response, next) {
        const errors = [];
        const query = request.query;

        const type = {
            category: '1',
            list: '2',
        };
        try {
            let result;

            if (!query || !query.type || !Object.values(type).includes(query.type)) {
                return logger.status404(response, false, homeConstant.typeIsNotDefined);
            }

            // Filter by videoRank
            let queryVideoRank = {};
            if (request.query.videoRank) {
                queryVideoRank.videoRank = parseInt(request.query.videoRank) || 0;
            }

            if (query.type === type.category) {
                const categoriesSet = await categoriesSetModel
                    .findOne({ slugName: query.category })
                    .select('categoriesName slugName')
                    .populate([
                        {
                            path: 'categoriesArrayList',
                            select: 'listName listChildren listProgramList slugName _id',
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
                        },
                        {
                            path: 'categoritesPosterProgramID',
                            select: 'programImagePoster',
                        },
                    ])
                    .lean();

                if (!categoriesSet) {
                    return logger.status404(
                        response,
                        false,
                        homeConstant.categorySetIDNotFound
                    );
                }

                categoriesSet.arrayData = categoriesSet.categoriesArrayList.filter(
                    (item) => {
                        item.ableShowMore = false;
                        item.headingName = item.listName;
                        if (item.listChildren && item.listChildren.length) {
                            item.ableShowMore = true;
                        }
                        delete item.listChildren;
                        item.totalProgram = item.listProgramList.length;
                        const check = item?.listProgramList?.length;

                        delete item.listProgramList;
                        return check;
                    }
                );

                delete categoriesSet.categoriesArrayList;
                result = categoriesSet;
            } else {
                const list = await listModel
                    .findOne({ slugName: query.list })
                    .select('listName slugName')
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

                list.arrayData = list.listChildren.filter((item) => {
                    item.ableShowMore = false;
                    item.headingName = item.listName;
                    if (item.listChildren && item.listChildren.length) {
                        item.ableShowMore = true;
                    }
                    delete item.listChildren;
                    item.totalProgram = item.listProgramList.length;
                    const check = item?.listProgramList?.length;

                    delete item.listProgramList;
                    return check;
                });

                delete list.listChildren;
                delete list.listProgramList;
                result = list;

                if (query.category) {
                    const category = await categoriesSetModel
                        .findOne({ slugName: query.category })
                        .populate({
                            path: 'categoritesPosterProgramID',
                            select: 'programImagePoster',
                        });

                    result.categoritesPosterProgramID =
                        category?.categoritesPosterProgramID;
                }
            }

            return logger.status200(response, system.success, '', result);
        } catch (error) {
            errors.push(error.message);
            return logger.status400(response, error, errors);
        }
    }
}

module.exports = new WebOnlineController();
