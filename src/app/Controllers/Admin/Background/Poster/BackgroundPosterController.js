const mongoose = require('mongoose');

const { fileLoader } = require('ejs');
const _ = require('lodash');

const logger = require('../../../../Constant/Logger/loggerConstant');
const constants = require('../../../../Constant/constants');
const system = require('../../../../Constant/General/SystemConstant');

const backgroundModel = require('../../../../Models/Background/BackgroundModel');
const backgroundPosterModel = require('../../../../Models/Background/BackgroundPosterModel');
const programModel = require('../../../../Models/Program/ProgramModel');
const businessQuery = require('../../../../Business/QueryModel');
const tagModel = require('../../../../Models/Manage/Tag/TagModel');
const categoryManageModel = require('../../../../Models/Manage/CategoryManage/CategoryManageModel');

const backgroundConstant = require('../../../../Constant/Background/BackgroundConstant');

class BackgroundPosterController {
    // [POST] /admin/background/poster/
    async index(request, response) {
        const errors = [];

        try {
            const relations = {
                path: 'backgroundPosterProgramID',
                populate: {
                    path: 'programCategory.categoryManageId programCategory.categoryArrayTag',
                    select: 'categoryMangeName tagName',
                },
                select: 'programName programCategory programParticipants programType',
            };

            let backgroundPosterList = await businessQuery.handle(
                backgroundPosterModel,
                request,
                relations
            );

            return logger.status200Data(response, system.success, backgroundPosterList);
        } catch (error) {
            errors.push(error.message);
            return logger.status400(response, error, errors);
        }
    }

    // [POST] /admin/background/poster/
    async indexDropdownlist(request, response) {
        const errors = [];

        try {
            let backgroundPosterList = await backgroundPosterModel
                .find()
                .populate({
                    path: 'backgroundPosterProgramID',
                    select: 'programName',
                })
                .sort({ createdAt: -1 })
                .select('backgroundPosterProgramID');

            return logger.status200Data(response, system.success, backgroundPosterList);
        } catch (error) {
            errors.push(error.message);
            return logger.status400(response, error, errors);
        }
    }

    // [GET] /admin/background/poster/:id
    async detail(request, response) {
        const errors = [];
        const paramsData = request.params;

        try {
            let data = await backgroundPosterModel.findById(paramsData.id).populate({
                path: 'backgroundPosterProgramID',
                populate: {
                    path: 'programCategory.categoryManageId programCategory.categoryArrayTag',
                    select: 'categoryMangeName tagName',
                },
            });

            return logger.status200Data(response, system.success, data);
        } catch (error) {
            errors.push(error.message);
            return logger.status400(response, error, errors);
        }
    }

    // [POST] /admin/background/poster/create
    async create(request, response) {
        const errors = [];
        const formData = request.body;
        let session = await mongoose.startSession();
        session.startTransaction();
        try {
            let isProgram = await programModel.findById(
                formData.backgroundPosterProgramID
            );

            if (!isProgram) {
                session.endSession();
                return logger.status400(
                    response,
                    errors,
                    backgroundConstant.notFoundProgram(formData.backgroundPosterProgramID)
                );
            }

            if (isProgram.programSeasonChild) {
                session.endSession();
                return logger.status400(
                    response,
                    errors,
                    backgroundConstant.notFoundProgram(formData.backgroundPosterProgramID)
                );
            }

            let data = await new backgroundPosterModel(formData).save({
                session: session,
            });
            // let data = await backgroundPosterModel.create({
            //     backgroundPosterProgramID: formData.backgroundPosterProgramID,
            // }).session(session);

            await session.commitTransaction();
            session.endSession();

            return logger.status200(
                response,
                system.success,
                backgroundConstant.msgAddSuccessfulPoster,
                data
            );
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            errors.push(error.message);
            return logger.status400(response, error, errors);
        }
    }

    // [GET] /admin/background/poster/:id
    async update(request, response) {
        const errors = [];
        const paramsData = request.params;
        const formData = request.body;
        try {
            let data = await backgroundPosterModel
                .findByIdAndUpdate(
                    paramsData.id,
                    {
                        backgroundPosterProgramID: formData.backgroundPosterProgramID,
                    },
                    {
                        new: true,
                    }
                )
                .populate({
                    path: 'backgroundPosterProgramID',
                    populate: {
                        path: 'programCategory.categoryManageId programCategory.categoryArrayTag',
                        select: 'categoryMangeName tagName',
                    },
                    select: 'programName programCategory programParticipants programType',
                })
                .session(session);

            await session.commitTransaction();
            session.endSession();

            return logger.status200(response, system.success, '', data);
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
            request.query['programCurrentStatus'] = [
                constants.PROGRAM_STATUS.APPROVAL,
                constants.PROGRAM_STATUS.OMN,
                constants.PROGRAM_STATUS.INSTANT,
            ];

            request.query.programType = [
                constants.PROGRAM_TYPE.UPLOAD,
                constants.PROGRAM_TYPE.PROGRAM_ORIGINAL,
            ];

            request.query.programSeasonChild = false;

            const relation = {
                path: 'programCategory.categoryArrayTag programCategory.categoryManageId',
                select: 'tagName categoryMangeName',
            };

            const select = [
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
            ];

            const programs = await businessQuery.handle(
                programModel,
                request,
                relation,
                select
            );

            return logger.status200Data(response, system.success, programs);
        } catch (error) {
            errors.push(error.message);
            return logger.status400(response, error, errors);
        }
    }

    // [GET] /admin/background/poster/find
    async find(request, response) {
        const errors = [];
        try {
            if (request.query.id) {
                let data = await backgroundModel
                    .findOne({
                        _id: request.query.id,
                        type: constants.TYPE_BACKGROUND.VIDEO,
                    })
                    .populate({
                        path: 'program',
                        select: [
                            'programTypeVideo',
                            'programCategory',
                            'programName',
                            'programType',
                            'createdAt',
                            'linkVideo',
                            'programTitle',
                            'programImagePosterNoTitle',
                            'programSubTitle',
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
            const { type, startAt, endAt, sort, limit, page } = request.query;

            filters.push({ type: constants.TYPE_BACKGROUND.POSTER });

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

            let limitDoc = parseInt(limit) || 10;
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
                        'programImagePosterNoTitle',
                        'programSubTitle',
                        'programImagePoster',
                        'programImageTitle',
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

    // [GET] /admin/background/poster/category
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

    // [GET]  /admin/background/poster/tag
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

module.exports = new BackgroundPosterController();
