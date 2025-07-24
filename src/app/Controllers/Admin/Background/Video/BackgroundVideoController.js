const mongoose = require('mongoose');

const _ = require('lodash');

const logger = require('../../../../Constant/Logger/loggerConstant');
const constants = require('../../../../Constant/constants');
const system = require('../../../../Constant/General/SystemConstant');

const backgroundModel = require('../../../../Models/Background/BackgroundModel');
const programModel = require('../../../../Models/Program/ProgramModel');
const businessQuery = require('../../../../Business/QueryModel');
const tagModel = require('../../../../Models/Manage/Tag/TagModel');
const categoryManageModel = require('../../../../Models/Manage/CategoryManage/CategoryManageModel');
const backgroundVideoModel = require('../../../../Models/Background/BackgroundVideoModel');
const s3Service = require('../../../../Service/S3/S3Service');
const backgroundConstant = require('../../../../Constant/Background/BackgroundConstant');
const mediaConvert = require('../../../../Service/MediaConvert/MediaConvertService');

class BackgroundVideoController {
    // [POST] /admin/background/video/
    async index(request, response) {
        const errors = [];

        try {
            // find data in background video
            let backgroundVideoList = await backgroundVideoModel
                .find()
                .populate({
                    path: 'backgroundVideoProgramID',
                    populate: {
                        path: 'programCategory.categoryManageId userID',
                        select: 'categoryMangeName userName userEmail',
                    },
                    select: 'programName programCategory.categoryManageId userID programType programAddUploadTrailer programRemoveUploadTrailer',
                })
                // .select(
                //     'programName programCategory.categoryManageId userID programType programAddUploadTrailer programRemoveUploadTrailer'
                // )
                .limit(2)
                .lean();

            // let backgroundVideoList = await businessQuery.handle(
            //     backgroundVideoModel,
            //     request,
            //     relations
            // );

            if (!backgroundVideoList) {
                // if not data in background video, data is empty
                return logger.status200Data(response, system.success, data);
            }

            const data = JSON.parse(JSON.stringify(backgroundVideoList));

            await Promise.all(
                data.map((item) => {
                    // basic data return

                    item.backgroundVideoTrailerStatus = !item.backgroundVideoTrailer
                        ? false
                        : true;
                    item.programCategory = item.backgroundVideoProgramID.programCategory;
                    item.programType = item.backgroundVideoProgramID.programType;
                    item.programAddUploadTrailer =
                        item.backgroundVideoProgramID.programAddUploadTrailer;
                    item.programName = item.backgroundVideoProgramID.programName;
                    item.userID = item.backgroundVideoProgramID.userID;
                    item.shouldViewVideo = !item.backgroundVideoTrailer ? false : true;
                    item.backgroundVideoProgramID = item.backgroundVideoProgramID._id;
                    delete item.backgroundVideoID;
                    delete item.__v;
                    delete item.createdAt;
                    delete item.updatedAt;
                    delete item.deleted;
                })
            );

            // basic data return

            return logger.status200Data(response, system.success, data);
        } catch (error) {
            errors.push(error.message);
            return logger.status400(response, error, errors);
        }
    }

    // [POST] /admin/background/video/
    async indexDropdownlist(request, response) {
        const errors = [];

        try {
            let backgroundVideoList = await backgroundVideoModel
                .find()
                .populate({
                    path: 'backgroundVideoProgramID',
                    select: 'programName',
                })
                .sort({ createdAt: -1 })
                .select('backgroundVideoProgramID');

            return logger.status200Data(response, system.success, backgroundVideoList);
        } catch (error) {
            errors.push(error.message);
            return logger.status400(response, error, errors);
        }
    }

    // [GET] /admin/background/video/:id
    async detail(request, response) {
        const errors = [];
        const paramsData = request.params;

        try {
            let data = await backgroundVideoModel.findById(paramsData.id).populate({
                path: 'backgroundVideoProgramID',
                populate: {
                    path: 'programCategory.categoryManageId userID',
                    select: 'categoryMangeName userName userEmail',
                },
                select: 'programName programCategory.categoryManageId userID programType programAddUploadTrailer programRemoveUploadTrailer',
            });

            if (!data) {
                return logger.status400(
                    response,
                    backgroundConstant.notFoundBackgroundVideo(paramsData.id),
                    system.error
                );
            }

            return logger.status200Data(response, system.success, data);
        } catch (error) {
            errors.push(error.message);
            return logger.status400(response, error, errors);
        }
    }

    // [POST] /admin/background/video/create
    async create(request, response) {
        const errors = [];
        const formData = request.body;
        let session = await mongoose.startSession();
        session.startTransaction();
        try {
            let isProgram = await programModel.findById(
                formData.backgroundVideoProgramID
            );

            if (!isProgram) {
                session.endSession();
                return logger.status400(
                    response,
                    errors,
                    backgroundConstant.notFoundProgram(formData.backgroundVideoProgramID)
                );
            }

            if (isProgram.programSeasonChild) {
                session.endSession();
                return logger.status400(
                    response,
                    errors,
                    backgroundConstant.notFoundProgram(formData.backgroundVideoProgramID)
                );
            }

            // check program having video trailer. if have, we still use again.
            if (!formData.backgroundVideoTrailer && isProgram.programVideoTrailer) {
                formData.backgroundVideoTrailer = isProgram.programVideoTrailer;
            }

            // find data in background video
            let backgroundVideoList = await backgroundVideoModel
                .find()
                .populate({
                    path: 'backgroundVideoProgramID',
                    populate: {
                        path: 'programCategory.categoryManageId userID',
                        select: 'categoryMangeName userName userEmail',
                    },
                    select: 'programName programCategory.categoryManageId userID programType programAddUploadTrailer programRemoveUploadTrailer',
                })
                .limit(2)
                .lean();

            switch (backgroundVideoList.length) {
                // case not data
                case 0:
                    formData.backgroundVideoType = constants.TYPE_BACKGROUND.VIDEO;
                    break;

                // case have one data. maybe video or backup
                case 1:
                    await Promise.all(
                        backgroundVideoList.map((item) => {
                            if (
                                item.backgroundVideoType ===
                                constants.TYPE_BACKGROUND.VIDEO
                            ) {
                                formData.backgroundVideoType =
                                    constants.TYPE_BACKGROUND.BACKUP;
                            } else {
                                formData.backgroundVideoType =
                                    constants.TYPE_BACKGROUND.VIDEO;
                            }
                        })
                    );
                    break;
                // case data >= 2. limit is 2 record
                default:
                    session.endSession();
                    return logger.status400(
                        response,
                        errors,
                        backgroundConstant.msgLimitBackgroundVideo
                    );
            }

            let data = await new backgroundVideoModel(formData).save({
                session: session,
            });

            // update video and date for program
            const dataProgram = await programModel
                .findByIdAndUpdate(
                    formData.backgroundVideoProgramID,
                    {
                        programAddUploadTrailer: Date.now(),
                        programVideoTrailer: formData.backgroundVideoTrailer,
                    },
                    {
                        new: true,
                    }
                )
                .session(session);

            await session.commitTransaction();
            session.endSession();

            backgroundVideoList = await backgroundVideoModel.findById(data._id).populate({
                path: 'backgroundVideoProgramID',
                populate: {
                    path: 'programCategory.categoryManageId userID',
                    select: 'categoryMangeName userName userEmail',
                },
                select: 'programName programCategory.categoryManageId userID programType programAddUploadTrailer programRemoveUploadTrailer',
            });

            data = {
                backgroundVideoTrailerStatus: !backgroundVideoList.backgroundVideoTrailer
                    ? false
                    : true,
                backgroundVideoTrailer: backgroundVideoList.backgroundVideoTrailer,
                programCategory:
                    backgroundVideoList.backgroundVideoProgramID.programCategory,
                programType: backgroundVideoList.backgroundVideoProgramID.programType,
                programAddUploadTrailer:
                    backgroundVideoList.backgroundVideoProgramID.programAddUploadTrailer,
                programName: backgroundVideoList.backgroundVideoProgramID.programName,
                userID: backgroundVideoList.backgroundVideoProgramID.userID,
                _id: backgroundVideoList._id,
                backgroundVideoType: backgroundVideoList.backgroundVideoType,
                backgroundVideoProgramID:
                    backgroundVideoList.backgroundVideoProgramID._id,
                shouldViewVideo: !backgroundVideoList.backgroundVideoTrailer
                    ? false
                    : true,
            };

            return logger.status200(
                response,
                system.success,
                backgroundConstant.msgAddSuccessful,
                data
            );
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            errors.push(error.message);
            return logger.status400(response, error, errors);
        }
    }

    // [GET] /admin/background/video/:id
    async update(request, response) {
        const errors = [];
        const paramsData = request.params;
        const formData = request.body;
        let session = await mongoose.startSession();
        session.startTransaction();
        try {
            let data = await backgroundVideoModel.findById(paramsData.id);

            if (!data) {
                return logger.status400(
                    response,
                    backgroundConstant.notFoundBackgroundVideo(paramsData.id),
                    system.error
                );
            }

            //when update backgroundVideoTrailer, we must update time
            if (formData.backgroundVideoTrailer) {
                formData.backgroundVideoTrailerStatus = true;

                let dataProgram = await programModel.findById(
                    data.backgroundVideoProgramID
                );

                if (dataProgram.programVideoTrailer) {
                    //delete file s3 folder input
                    let dataLink = dataProgram.programVideoTrailer.split(
                        process.env.LINK_INPUT + '/'
                    );
                    let Key = dataLink[1];
                    let media = new mediaConvert();
                    await media.deleteFileS3(Key);
                }

                // update time and new url video trailer when add trailer for program in program
                dataProgram = await programModel
                    .findByIdAndUpdate(
                        data.backgroundVideoProgramID,
                        {
                            programAddUploadTrailer: Date.now(),
                            programVideoTrailer: formData.backgroundVideoTrailer,
                        },
                        {
                            new: true,
                        }
                    )
                    .session(session);
            }

            const backgroundVideoList = await backgroundVideoModel
                .findByIdAndUpdate(paramsData.id, formData, {
                    new: true,
                })
                .populate({
                    path: 'backgroundVideoProgramID',
                    populate: {
                        path: 'programCategory.categoryManageId userID',
                        select: 'categoryMangeName userName userEmail',
                    },
                    select: 'programName programCategory.categoryManageId programType userID programAddUploadTrailer programRemoveUploadTrailer programVideoTrailer',
                })
                .session(session);

            await session.commitTransaction();
            session.endSession();

            data = {
                backgroundVideoTrailerStatus:
                    !backgroundVideoList.backgroundVideoTrailerStatus ? false : true,
                backgroundVideoTrailer: backgroundVideoList.backgroundVideoTrailer,
                programCategory:
                    backgroundVideoList.backgroundVideoProgramID.programCategory,
                programType: backgroundVideoList.backgroundVideoProgramID.programType,
                programAddUploadTrailer:
                    backgroundVideoList.backgroundVideoProgramID.programAddUploadTrailer,
                programName: backgroundVideoList.backgroundVideoProgramID.programName,
                userID: backgroundVideoList.backgroundVideoProgramID.userID,
                backgroundVideoType: backgroundVideoList.backgroundVideoType,
                _id: backgroundVideoList._id,
                backgroundVideoProgramID:
                    backgroundVideoList.backgroundVideoProgramID._id,
                shouldViewVideo: !backgroundVideoList.backgroundVideoTrailer
                    ? false
                    : true,
            };

            return logger.status200(
                response,
                system.success,
                backgroundConstant.msgUpdate(paramsData.id),
                data
            );
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            errors.push(error.message);
            return logger.status400(response, error, errors);
        }
    }

    async searchProgram(request, response) {
        const errors = [];

        try {
            // get default program have status: approval, omn and instant
            request.query['programCurrentStatus'] = [
                constants.PROGRAM_STATUS.APPROVAL,
                constants.PROGRAM_STATUS.OMN,
                constants.PROGRAM_STATUS.INSTANT,
            ];

            // get two type video: upload and original
            request.query.programType = [
                constants.PROGRAM_TYPE.UPLOAD,
                constants.PROGRAM_TYPE.PROGRAM_ORIGINAL,
            ];

            // just only get program parents
            request.query.programSeasonChild = false;

            const relation = {
                path: 'programCategory.categoryManageId userID',
                select: 'categoryMangeName userName userEmail',
            };

            const select = [
                'programTypeVideo',
                'programCategory.categoryManageId',
                'programName',
                'programType',
                'programImagePosterNoTitle',
                'programImagePoster',
                'programAddUploadTrailer',
                'programRemoveUploadTrailer',
                'userID',
                'programID',
                'programVideoTrailer',
            ];

            const programs = await businessQuery.handle(
                programModel,
                request,
                relation,
                select
            );

            const data = JSON.parse(JSON.stringify(programs));

            await Promise.all(
                data.docs.map((item) => {
                    item.id = item.programID;
                    delete item.programID;

                    if (!item.programVideoTrailer) {
                        item.backgroundVideoTrailer = '';
                    } else {
                        item.backgroundVideoTrailer = item.programVideoTrailer;
                    }
                    delete item.programVideoTrailer;
                })
            );

            return logger.status200Data(response, system.success, data);
        } catch (error) {
            errors.push(error.message);
            return logger.status400(response, error, errors);
        }
    }

    // [DELETE] /admin/background/video/:id
    async destroy(request, response, next) {
        const paramsData = request.params;
        const errors = [];
        let session = await mongoose.startSession();
        try {
            session.startTransaction();

            let data = await backgroundVideoModel.findById(paramsData.id);

            if (!data) {
                return logger.status400(
                    response,
                    backgroundConstant.notFoundBackgroundVideo(paramsData.id),
                    system.error
                );
            }

            //delete file s3 folder input
            // let dataLink = data.backgroundVideoTrailer.split(
            //     process.env.LINK_INPUT + '/'
            // );
            // let Key = dataLink[1];
            // let media = new mediaConvert();
            // await media.deleteFileS3(Key);

            if (data.backgroundVideoType === constants.TYPE_BACKGROUND.VIDEO) {
                
                let dataDelete = {};
                // find data in background video
                let backgroundVideoList = await backgroundVideoModel
                    .find()
                    .limit(2)
                    .lean();

                await Promise.all(
                    backgroundVideoList.map((item) => {
                        if (
                            item.backgroundVideoType === constants.TYPE_BACKGROUND.BACKUP
                        ) {
                            dataDelete._id = item._id;
                        }
                    })
                );

                const updateBackgroundVideo = await backgroundVideoModel
                    .findByIdAndUpdate(
                        dataDelete._id,
                        {
                            backgroundVideoType: constants.TYPE_BACKGROUND.VIDEO,
                        },
                        {
                            new: true,
                        }
                    )
                    .session(session);
            }

            const dataProgram = await programModel
                .findByIdAndUpdate(
                    data.backgroundVideoProgramID,
                    {
                        programRemoveUploadTrailer: Date.now(),
                    },
                    {
                        new: true,
                    }
                )
                .session(session);

            data = await backgroundVideoModel
                .delete({ _id: paramsData.id })
                .session(session);

            if (!data.nModified) {
                await session.abortTransaction();
                session.endSession();
                return logger.status404(
                    response,
                    system.error,
                    backgroundConstant.notFound(paramsData.id)
                );
            }
            await session.commitTransaction();
            session.endSession();

            return logger.status200(
                response,
                system.success,
                backgroundConstant.msgDelete(paramsData.id)
            );
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            errors.push(error.message);
            return logger.status500(response, error, errors);
        }
    }

    // [DELETE] /admin/background/video/:id
    async deleteFileVideo(request, response, next) {
        const formData = request.body;
        const errors = [];

        try {
            // //delete file s3 folder input
            // let dataLink = formData.backgroundVideoTrailer.split(
            //     process.env.LINK_INPUT + '/'
            // );
            // let Key = dataLink[1];
            // let media = new mediaConvert();
            // await media.deleteFileS3(Key);

            await s3Service.deleteFileVideoS3(formData.backgroundVideoTrailer);
            // await s3Service.deleteFileImageS3(formData.data);
            return logger.status200(
                response,
                system.success,
                backgroundConstant.msgDeleteFileVideo
            );
        } catch (error) {
            errors.push(error.message);
            return logger.status500(response, error, errors);
        }
    }

    // [GET] /admin/background/video/find
    async find(request, response) {
        const errors = [];
        try {
            if (request.query.id) {
                let data = await backgroundModel.findById(request.query.id).populate({
                    path: 'program',
                    select: [
                        'programTypeVideo',
                        'programCategory',
                        'programName',
                        'programType',
                        'createdAt',
                        'linkVideo',
                        'programTitle',
                        'programSubTitle',
                        'programImagePosterNoTitle',
                        'programImagePoster',
                        'programImageTitle',
                        'programImageBracter',
                        'programChildrenSeasonData',
                        'programEpisodeSummary',
                    ],
                    populate: {
                        path: 'programCategory.categoryArrayTag programCategory.categoryManageId',
                        // populate: {
                        //     path: "categoryMangeArrayTag",
                        // },
                        select: 'tagName categoryMangeName',
                    },
                });

                return logger.status200(response, system.success, '', data);
            }

            let filters = [];
            const { startAt, endAt, sort, limit, page } = request.query;

            filters.push({ type: constants.TYPE_BACKGROUND.VIDEO });

            if (startAt) {
                filters.push({ startAt: { $gte: new Date(startAt) } });
            }

            if (endAt) {
                filters.push({ endAt: { $lte: new Date(endAt) } });
            }

            if (sort) {
                console.log(`Sort no-release`);
            }
            let filter;
            if (filters.length == 0) {
                filter = {};
            } else filter = { $and: filters };

            let limitDoc = parseInt(limit) || 50;
            let pageDoc = parseInt(page) || 1;

            let data = await backgroundModel.paginate(filter, {
                populate: {
                    path: 'program',
                    populate: {
                        path: 'programCategory.categoryArrayTag programCategory.categoryManageId',
                        // populate: {
                        //     path: "categoryMangeArrayTag",
                        // },
                        select: 'tagName categoryMangeName',
                    },
                    select: [
                        'programTypeVideo',
                        'programCategory',
                        'programName',
                        'programType',
                        'createdAt',
                        'linkVideo',
                        'programTitle',
                        'programSubTitle',
                        'programImagePoster',
                        'programImageTitle',
                        'programImagePosterNoTitle',
                        'programImageBracter',
                        'programChildrenSeasonData',
                        'programEpisodeSummary',
                    ],
                },
                limit: limitDoc,
                page: pageDoc,
            });

            return logger.status200(response, system.success, '', data);
        } catch (error) {
            errors.push(error.message);
            return logger.status400(response, error, errors);
        }
    }

    // [GET] /admin/background/video/category
    async categories(request, response, next) {
        const errors = [];
        try {
            const categories = await categoryManageModel.find(
                {},
                { categoryMangeName: 1, categoryMangeID: 1 }
            );
            return logger.status200(response, system.success, '', categories);
        } catch (error) {
            errors.push(error.message);
            return logger.status500(response, error, errors, system.error);
        }
    }

    // [GET]  /admin/background/video/tag
    async tags(request, response, next) {
        const errors = [];
        try {
            const tags = await tagModel.find({}, { tagName: 1, tagID: 1 });
            return logger.status200(response, system.success, '', tags);
        } catch (error) {
            errors.push(error.message);
            return logger.status500(response, error, errors, system.error);
        }
    }
}

module.exports = new BackgroundVideoController();
