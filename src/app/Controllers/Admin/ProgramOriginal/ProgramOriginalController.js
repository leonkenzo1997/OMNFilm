const mongoose = require('mongoose');

const programModel = require('../../../Models/Program/ProgramModel');
const system = require('../../../Constant/General/SystemConstant');
const businessQuery = require('../../../Business/QueryModel');
const logger = require('../../../Constant/Logger/loggerConstant');
const constants = require('../../../Constant/constants');
const programConstant = require('../../../Constant/Program/ProgramConstant');
const userModel = require('../../../Models/User/UserModel');
const moment = require('moment-timezone');
const historyEditProgramModel = require('../../../Models/Program/HistoryEditProgramModel');
const mediaConvertController = require('../../User/MediaConvert/MediaConvertController');
const emailService = require('../../../Service/Email/EmailService');
const notificationModel = require('../../../Models/Push/UserPushNotificationModel');
const imgResize = require('../../../Service/Images/ResizeOptimizeImages');
const MessageModel = require('../../../Models/Message/MessageModel');
const HistoryProgramModel = require('../../../Models/Program/HistoryProgramModel');
const convertImageJobs = require('../../../Jobs/ConvertImageJobs');

const common = require('../../../Service/common');
const ObjectId = require('mongoose').Types.ObjectId;

const programOriginalConstant = require('../../../Constant/ProgramOriginal/ProgramOriginalConstant');
const _ = require('lodash');

class ProgramOriginalController {
    // [GET] /admin/program-original
    async index(request, response) {
        const errors = [];
        request.query.programType = constants.PROGRAM_TYPE.PROGRAM_ORIGINAL;
        request.query.deleted = false;
        request.query.programCurrentStatus = constants.PROGRAM_STATUS.APPROVAL;

        const selectFields = programOriginalConstant.fieldsGetList;
        try {
            if (request.query.id) {
                const userEmail = new RegExp(request.query.id, 'i');
                const users = await userModel.find({ userEmail: userEmail, userType: 1 });
                request.query.userID = {
                    $in: users,
                };
            }

            delete request.query.id;
            Object.assign(request.query, programConstant.FIELD_QUERY_DEFAULT);

            let data = await businessQuery.handle(
                programModel,
                request,
                {
                    path: 'userID programSeasonData.episode',
                    select: [
                        'userName',
                        'userEmail',
                        'programChildrenSeasonData.episodeName',
                    ],
                },
                selectFields
            );

            data = JSON.parse(JSON.stringify(data));
            await Promise.all(
                data.docs.map((item) => {
                    item.episodeID = '';
                    // if (item.programTypeVideo === constants.TYPE_VIDEO.SS) {
                    //     item.episodeID = item?.programSeasonData[0]?.episode[0];
                    // }

                    // delete item.programTypeVideo;
                    // delete item.programSeasonData;

                    let arraySeason = [];
                    let arrayEpisode = [];
                    if (item.programTypeVideo == constants.TYPE_VIDEO.SS) {
                        item.episodeID = item?.programSeasonData[0]?.episode[0];
                        if (item.programSeasonData.length > 0) {
                            item.programSeasonData.map((seasonItem) => {
                                if (!seasonItem.seasonName) {
                                    item.season_episodes = 'No season, No episodes';
                                } else {
                                    let stringSeason =
                                        'Season ' + seasonItem?.seasonName;
                                    arrayEpisode = [];
                                    seasonItem.episode.map((episode) => {
                                        let stringEpisodes = '';
                                        if (
                                            episode?.programChildrenSeasonData.episodeName
                                        ) {
                                            stringEpisodes =
                                                episode?.programChildrenSeasonData
                                                    .episodeName;
                                        } else {
                                            stringEpisodes = '-';
                                        }
                                        arrayEpisode.push(stringEpisodes);
                                    });
                                    arrayEpisode.toString();

                                    let stringSeasonsEpisodes =
                                        stringSeason + ': ' + arrayEpisode;

                                    arraySeason.push(stringSeasonsEpisodes);
                                }
                            });
                            item.season_episodes = arraySeason.toString();
                        } else {
                            item.season_episodes = 'No season, No episodes';
                        }
                    } else {
                        item.season_episodes = '-';
                    }
                })
            );

            return logger.status200(response, system.success, '', data);
        } catch (error) {
            errors.push(error.message);
            return logger.status500(response, error, errors);
        }
    }

    // [GET] /admin/program-original/crack-in
    async crackInLists(request, response) {
        const errors = [];

        request.query.programType = constants.PROGRAM_TYPE.PROGRAM_ORIGINAL;
        request.query.deleted = false;
        request.query.programCurrentStatus = constants.PROGRAM_STATUS.UPLOAD;

        const selectFields = programOriginalConstant.fieldsGetList;
        try {
            if (request.query.id) {
                const userEmail = new RegExp(request.query.id, 'i');
                const users = await userModel.find({ userEmail: userEmail, userType: 1 });
                request.query.userID = {
                    $in: users,
                };
            }

            delete request.query.id;
            Object.assign(request.query, programConstant.FIELD_QUERY_DEFAULT);

            let data = await businessQuery.handle(
                programModel,
                request,
                {
                    path: 'userID programSeasonData.episode',
                    select: [
                        'userName',
                        'userEmail',
                        'programChildrenSeasonData.episodeName',
                    ],
                },
                selectFields
            );

            data = JSON.parse(JSON.stringify(data));

            await Promise.all(
                data.docs.map((item) => {
                    item.episodeID = '';
                    // if (item.programTypeVideo === constants.TYPE_VIDEO.SS) {
                    //     item.episodeID = item?.programSeasonData[0]?.episode[0];
                    // }

                    // delete item.programTypeVideo;
                    // delete item.programSeasonData;

                    let arraySeason = [];
                    let arrayEpisode = [];
                    if (item.programTypeVideo == constants.TYPE_VIDEO.SS) {
                        item.episodeID = item?.programSeasonData[0]?.episode[0];
                        if (item.programSeasonData.length > 0) {
                            item.programSeasonData.map((seasonItem) => {
                                if (!seasonItem.seasonName) {
                                    item.season_episodes = 'No season, No episodes';
                                } else {
                                    let stringSeason = 'Season ' + seasonItem?.seasonName;
                                    arrayEpisode = [];
                                    seasonItem.episode.map((episode) => {
                                        let stringEpisodes = '';
                                        if (
                                            episode?.programChildrenSeasonData.episodeName
                                        ) {
                                            stringEpisodes =
                                                episode?.programChildrenSeasonData
                                                    .episodeName;
                                        } else {
                                            stringEpisodes = '-';
                                        }
                                        arrayEpisode.push(stringEpisodes);
                                    });
                                    arrayEpisode.toString();

                                    let stringSeasonsEpisodes =
                                        stringSeason + ': ' + arrayEpisode;

                                    arraySeason.push(stringSeasonsEpisodes);
                                }
                            });
                            item.season_episodes = arraySeason.toString();
                        } else {
                            item.season_episodes = 'No season, No episodes';
                        }
                    } else {
                        item.season_episodes = '-';
                    }
                })
            );
            return logger.status200(response, system.success, '', data);
        } catch (error) {
            errors.push(error.message);
            return logger.status500(response, error, errors);
        }
    }

    // [GET] /admin/program-original/cancel
    async cancelLists(request, response) {
        const errors = [];
        request.query.programType = constants.PROGRAM_TYPE.PROGRAM_ORIGINAL;
        request.query.deleted = false;
        request.query.programCurrentStatus = constants.PROGRAM_STATUS.DENIAL;

        const selectFields = programOriginalConstant.fieldsGetList;
        try {
            if (request.query.id) {
                const userEmail = new RegExp(request.query.id, 'i');
                const users = await userModel.find({ userEmail: userEmail, userType: 1 });
                request.query.userID = {
                    $in: users,
                };
            }

            delete request.query.id;
            Object.assign(request.query, programConstant.FIELD_QUERY_DEFAULT);

            delete request.query.programSeasonChild;
            let data = await businessQuery.handle(
                programModel,
                request,
                { path: 'userID', select: ['userName', 'userEmail'] },
                selectFields
            );

            data = JSON.parse(JSON.stringify(data));
            await Promise.all(
                data.docs.map((item) => {
                    item.episodeID = '';
                    if (item.programTypeVideo === constants.TYPE_VIDEO.SS) {
                        item.episodeID = item?.programSeasonData[0]?.episode[0];
                    }

                    delete item.programTypeVideo;
                    delete item.programSeasonData;
                })
            );
            return logger.status200(response, system.success, '', data);
        } catch (error) {
            errors.push(error.message);
            return logger.status500(response, error, errors);
        }
    }

    // [POST] /admin/program-original/create
    create = async (request, response, next) => {
        let formData = request.body;
        const userData = request.user;
        const errors = [];

        formData.programType = constants.PROGRAM_TYPE.PROGRAM_ORIGINAL;
        formData.programCurrentStatus = constants.PROGRAM_STATUS.UPLOAD;

        let session = await mongoose.startSession();
        session.startTransaction();

        formData.userID = userData._id;
        try {
            formData = this.checkStatusComplete(
                formData,
                'create',
                formData.programTypeVideo
            );

            formData.totalTime = request?.body?.totalTime || 0;

            // resize image of poster
            // if (formData.programImagePoster) {
            //     //453x752
            //     urlArray = await imgResize.resizeOptimizeUrl(
            //         formData.programImagePoster,
            //         453,
            //         752,
            //         80
            //     );

            //     formData.programImagex1 = urlArray.url1;
            //     formData.programImagex2 = urlArray.url2;

            //     urlArray = await imgResize.resizeOneUrl(
            //         formData.programImagePoster,
            //         1920,
            //         1080,
            //         80
            //     );

            //     formData.programImagePosterResize = urlArray.url1;
            // }

            // // resize image of program title
            // if (formData.programImageTitle) {
            //     urlArray = await imgResize.resizeOptimizeUrl(
            //         formData.programImageTitle,
            //         688,
            //         387,
            //         80
            //     );

            //     formData.programImageTitleResize1 = urlArray.url1;
            //     formData.programImageTitleResize2 = urlArray.url2;
            // }

            // Create slug for program
            let checkDaplicate = {};
            while (checkDaplicate) {
                formData['slugName'] = common.generateSlug(formData.programName);
                checkDaplicate = await programModel.findOne({
                    slugName: formData['slugName'],
                });
            }

            let parent;
            // Update programSeasonData (List season) for parent
            if (
                formData.programTypeVideo === constants.TYPE_VIDEO.SS &&
                formData.programChildrenSeasonData &&
                formData.programChildrenSeasonData.parentID
            ) {
                parent = await programModel.findById(
                    formData.programChildrenSeasonData.parentID
                );

                // Parent null or type = child || stand alone
                if (!parent || parent.programSeasonChild) {
                    await session.abortTransaction();
                    session.endSession();
                    return logger.status404(
                        response,
                        false,
                        programConstant.parentIDNotFound
                    );
                }

                if (!parent.programSeasonData || !parent.programSeasonData.length) {
                    parent.programSeasonData = [
                        {
                            seasonName: formData.programChildrenSeasonData.seasonName,
                            episode: [],
                        },
                    ];
                } else if (
                    parent.programSeasonData &&
                    !parent.programSeasonData.find(
                        (item) =>
                            item.seasonName ===
                            formData.programChildrenSeasonData.seasonName
                    )
                ) {
                    parent.programSeasonData.push({
                        seasonName: formData.programChildrenSeasonData.seasonName,
                        episode: [],
                    });
                }
            } else {
                let seasonData = [];
                if (formData.programTypeVideo === constants.TYPE_VIDEO.SS) {
                    seasonData = [
                        {
                            seasonName: formData.programChildrenSeasonData.seasonName,
                            episode: [],
                        },
                    ];
                }
                parent = new programModel({
                    ...formData,
                    programSeasonData: seasonData,
                    programSeasonChild: false,
                    programChildrenSeasonData: {},
                    userID: userData._id,
                });
            }

            if (parent.programType !== formData.programType) {
                await session.abortTransaction();
                session.endSession();
                return logger.status400(
                    response,
                    programConstant.typeParentInvalid,
                    errors
                );
            }

            // Create data for children
            let children;
            if (formData.programTypeVideo === constants.TYPE_VIDEO.SS) {
                formData.programSeasonChild = true;
                formData.programSeasonData = [];
                formData.programChildrenSeasonData.parentID = parent._id;

                // Add id children in to programSeasonData
                for (let item of parent.programSeasonData) {
                    if (
                        item.seasonName === formData.programChildrenSeasonData.seasonName
                    ) {
                        formData.programChildrenSeasonData.seasonID = item._id;
                        // IF formData._id exist
                        if (formData._id) {
                            const idChild = formData._id;
                            delete formData._id;
                            // Check formData._id exist in season
                            if (!item.episode.includes(idChild)) {
                                return logger.status404(
                                    response,
                                    system.error,
                                    programConstant.notFound(idChild)
                                );
                            }
                            const checkChildren = await programModel.findById(idChild);

                            // Check formData._id exist in db
                            if (!checkChildren) {
                                await session.abortTransaction();
                                session.endSession();
                                return logger.status404(
                                    response,
                                    system.error,
                                    programConstant.notFound(idChild)
                                );
                            }
                            // Update status to upload if child was delete

                            children = await programModel
                                .findByIdAndUpdate(idChild, {
                                    ...formData,
                                    programCurrentStatus: constants.PROGRAM_STATUS.UPLOAD,
                                })
                                .session(session);

                            // Remove item in array episode deleted
                            item.episodeDeleted = item.episodeDeleted.filter(
                                (itemDelete) =>
                                    itemDelete && itemDelete.toString() !== idChild
                            );
                        } else {
                            // Create new children
                            children = new programModel({
                                ...formData,
                                userID: userData._id,
                            });
                            await children.save({ session });

                            item.episode.push(children._id);
                        }
                    }
                }
            }

            await parent.save({ session });

            // Add history program edit
            let historyProgramEdit = JSON.parse(JSON.stringify(children || parent));
            historyProgramEdit.programID = historyProgramEdit._id;
            delete historyProgramEdit._id;

            historyProgramEdit = new historyEditProgramModel(historyProgramEdit);
            await historyProgramEdit.save({ session });

            // Add historyEditProgramID for program
            const newProgram = children || parent;
            newProgram.historyEditProgramID = historyProgramEdit._id;

            await newProgram.save({ session });

            await session.commitTransaction();
            session.endSession();

            convertImageJobs.jobsConvertOriginal(children?._id, parent?._id);
            // Media convert
            request.body = {
                id: newProgram._id,
                Key: formData.Key,
                notReturn: true,
            };
            mediaConvertController.index(request, response, next);

            if (formData.participantsRates && formData.participantsRates.length) {
                const arrayUserID = formData.participantsRates.map((item) => item.userID);

                if (arrayUserID && arrayUserID.length) {
                    const arrayEmail = await userModel.distinct('userEmail', {
                        _id: { $in: arrayUserID },
                    });
                    arrayEmail.length &&
                        emailService.sendEmailOriginalParticipant(arrayEmail);

                    // Create record in table notification
                    const arrayIDNew = [...new Set(arrayUserID)];
                    const title = `Congratulations! You've been selected as a participant for an OMN Originals program!`;
                    await Promise.all(
                        arrayIDNew.map(async (item) => {
                            const notification = new notificationModel({
                                senderID: userData._id,
                                receiverID: item,
                                programID: newProgram._id.toString(),
                                title: title,
                                body: {
                                    programID: newProgram._id.toString(),
                                    type: constants.NOTIFICATION_BODY_TYPE
                                        .PARTICIPANTS_RATE,
                                    category: constants.CATEGORY_NOTIFICATION.OTHER,
                                },
                                message: 'Please check the reason!',
                                display: constants.DISPLAY_NOTIFICATION.OFFLINE,
                            });
                            await notification.save();
                        })
                    );

                    if (sockets)
                        sockets.emit(constants.MESSAGES_NOTIFICATION.OTHER_MESSAGES, {
                            userIDs: arrayUserID,
                        });
                }
            }
            return logger.status201(response, newProgram);
        } catch (error) {
            errors.push(error.message);
            await session.abortTransaction();
            session.endSession();
            return logger.status400(response, error, errors);
        }
    };

    // [GET] /admin/program-original/getById
    async getById(request, response) {
        const errors = [];
        try {
            if (ObjectId.isValid(request.query.id)) {
                const program = await programModel
                    .findById(request.query.id)
                    .populate([
                        {
                            path: 'programCategory.categoryArrayTag',
                            select: 'tagName',
                        },
                        {
                            path: 'programCategory.categoryManageId',
                            select: 'categoryMangeName',
                        },
                        {
                            path: 'participantsRates.userID',
                            select: [
                                'userEmail',
                                'userName',
                                'userType',
                                'userGender',
                                'userDOB',
                            ],
                        },
                        {
                            path: 'programSeasonData.episode',
                            select: 'programName',
                            match: { deleted: false },
                        },
                    ])
                    .lean();

                if (
                    program.programTypeVideo === constants.TYPE_VIDEO.SS &&
                    program.programSeasonChild &&
                    program?.programChildrenSeasonData?.parentID
                ) {
                    const parent = await programModel
                        .findById(program.programChildrenSeasonData.parentID)
                        .populate([
                            {
                                path: 'programSeasonData.episode',
                                select: 'programChildrenSeasonData.episodeName',
                                match: { deleted: false },
                            },
                        ])
                        .lean();

                    program.programSeasonData = parent.programSeasonData.map((season) => {
                        season.episode = season.episode.map((ep) => {
                            ep.programName = ep?.programChildrenSeasonData?.episodeName;
                            delete ep?.programChildrenSeasonData;
                            return ep;
                        });
                        return season;
                    });
                }
                return logger.status200(response, system.success, '', program);
            } else {
                return logger.status200(
                    response,
                    system.error,
                    programOriginalConstant.idInvalid
                );
            }
        } catch (error) {
            errors.push(error.message);
            return logger.status400(response, error, errors);
        }
    }

    // [GET] /admin/program-original/participants-rates
    async getParticipantRates(request, response) {
        const errors = [];

        const params = request.params;
        try {
            if (ObjectId.isValid(params.id)) {
                let program = await programModel
                    .findById(params.id)
                    .populate({
                        path: 'participantsRates.userID',
                        select: [
                            'userEmail',
                            'userName',
                            'userType',
                            'userGender',
                            'userDOB',
                        ],
                    })
                    .lean();

                if (!program) {
                    return logger.status404(
                        response,
                        system.success,
                        programOriginalConstant.notFound(params.id)
                    );
                }

                const limit = Number(request.query.limit) || 10;
                const page = Number(request.query.page) || 1;
                const offset = limit * (page - 1);
                const totalDocs =
                    (program.participantsRates && program.participantsRates.length) || 0;
                const totalPages = Math.ceil(totalDocs / limit);
                let docs = program.participantsRates.slice(offset, limit * page);

                docs = docs.map((item) => {
                    if (item.userID) {
                        const newItem = item.userID;
                        item.userID = newItem._id;
                        delete newItem._id;
                        item = {
                            ...item,
                            ...newItem,
                        };
                    }
                    return item;
                });

                return logger.status200(response, system.success, '', {
                    docs,
                    totalDocs,
                    offset,
                    limit,
                    totalPages,
                    page,
                });
            } else {
                return logger.status200(
                    response,
                    system.error,
                    programOriginalConstant.idInvalid
                );
            }
        } catch (error) {
            errors.push(error.message);
            return logger.status400(response, error, errors);
        }
    }

    // [GET] /admin/program-original/search
    async search(request, response) {
        const errors = [];
        request.query.programType = constants.PROGRAM_TYPE.PROGRAM_ORIGINAL;
        request.query.deleted = false;

        const selectFields = ['programImagePoster'];
        try {
            if (request.query.id) {
                const userEmail = new RegExp(request.query.id, 'i');
                const users = await userModel.find({ userEmail: userEmail, userType: 1 });
                request.query.userID = {
                    $in: users,
                };
            }

            delete request.query.id;
            Object.assign(request.query, programConstant.FIELD_QUERY_DEFAULT);

            const data = await businessQuery.handle(
                programModel,
                request,
                { path: 'userID', select: ['userName', 'userEmail'] },
                selectFields
            );
            return logger.status200(response, system.success, '', data);
        } catch (error) {
            errors.push(error.message);
            return logger.status500(response, error, errors);
        }
    }

    // [GET] /admin/program-original/users
    async findUsers(request, response) {
        const errors = [];

        try {
            if (request.query.keyword) {
                const keyword = new RegExp(request.query.keyword, 'i');
                request.query['$or'] = [
                    {
                        userEmail: keyword,
                    },
                    {
                        userName: keyword,
                    },
                ];
            }
            delete request.query.keyword;

            request.query.userType = {
                $in: [constants.USER_TYPE.USER, constants.USER_TYPE.RS],
            };

            const users = await businessQuery.handle(userModel, request, null, [
                'userEmail',
                'userName',
                'userType',
                'userGender',
                'userDOB',
            ]);
            return logger.status200(response, system.success, '', users);
        } catch (error) {
            errors.push(error.message);
            return logger.status500(response, error, errors);
        }
    }

    checkStatusComplete = (formData, type, programTypeVideo) => {
        formData.isComplete = true;
        delete formData._id;

        const fieldsValidate =
            type === 'create'
                ? programOriginalConstant.fieldsCreateOriginal
                : programOriginalConstant.fieldsOriginalUpdate;

        if (programTypeVideo === constants.TYPE_VIDEO.SS)
            fieldsValidate.push('programEpisodeSummary');
        const keyData = Object.keys(formData);

        // Filter remove other field not allow
        const newFormData = Object.fromEntries(
            Object.entries(formData).filter((item) => fieldsValidate.includes(item[0]))
        );
        const valueData = Object.values(newFormData);

        let isValidKeys = true;
        if (type === 'create') {
            isValidKeys = fieldsValidate.every((item) => keyData.includes(item));
        }

        const inValidValues = valueData.some((item) => {
            if (item === null || item === undefined) return true;
            switch (typeof item) {
                case 'object':
                    if (_.isEmpty(item)) return true;
                    let isEmpty = false;
                    return this.checkObjectEmpty(item, isEmpty);
                    break;
                case 'number':
                    return false;
                    break;
                default:
                    return _.isEmpty(item);
                    break;
            }
        });

        if (!isValidKeys || inValidValues) {
            formData.isComplete = false;
        }

        return formData;
    };

    checkObjectEmpty = (item, isEmpty) => {
        for (let a of Object.entries(item)) {
            // Check value null, undefined
            if (!a[1] && typeof a[1] !== 'number') return true;

            switch (typeof a[1]) {
                case 'number':
                    break;
                case 'object':
                    if (_.isEmpty(item)) {
                        isEmpty = true;
                    } else {
                        // loop
                        isEmpty = this.checkObjectEmpty(a[1], isEmpty);
                    }
                    break;
                default:
                    if (_.isEmpty(a[1])) isEmpty = true;
                    break;
            }
            if (isEmpty) {
                return isEmpty;
            }
        }
        return isEmpty;
    };

    // [PUT] /admin/program-original/update
    async changeStatus(request, response) {
        const errors = [];

        const formData = request.body;
        const params = request.params;

        try {
            const program = await programModel.findOne({
                _id: params.id,
                programType: constants.PROGRAM_TYPE.PROGRAM_ORIGINAL,
                deleted: false,
            });

            if (!program) {
                return logger.status404(
                    response,
                    '',
                    programOriginalConstant.notFound(params.id)
                );
            }

            if (
                program.programTypeVideo === constants.TYPE_VIDEO.SS &&
                !program.programSeasonChild
            ) {
                return logger.status400(
                    response,
                    programOriginalConstant.parentNotUpdate
                );
            }

            if (program.programCurrentStatus === constants.PROGRAM_STATUS.DENIAL) {
                return logger.status400(
                    response,
                    programOriginalConstant.programNotUpdate
                );
            }

            let session = await mongoose.startSession();
            session.startTransaction();
            switch (formData.programCurrentStatus) {
                case constants.PROGRAM_STATUS.DENIAL:
                    formData.programDisplay = false;
                    // Check type is Season
                    if (program.programTypeVideo === constants.TYPE_VIDEO.SS) {
                        const check = await programModel.findOne({
                            'programChildrenSeasonData.parentID':
                                program.programChildrenSeasonData.parentID,
                            programSeasonChild: true,
                            programCurrentStatus: {
                                $ne: constants.PROGRAM_STATUS.DENIAL,
                            },
                            _id: { $ne: params.id },
                        });

                        // Update parent if no one approval
                        if (!check) {
                            await programModel
                                .updateOne(
                                    {
                                        _id: program.programChildrenSeasonData.parentID,
                                    },
                                    {
                                        $set: {
                                            programCurrentStatus:
                                                constants.PROGRAM_STATUS.DENIAL,
                                            programDisplay: false,
                                        },
                                    }
                                )
                                .session(session);
                        }
                    }
                    break;
                case constants.PROGRAM_STATUS.UPLOAD:
                    // Check type is Season
                    if (program.programTypeVideo === constants.TYPE_VIDEO.SS) {
                        const check = await programModel.findOne({
                            'programChildrenSeasonData.parentID':
                                program.programChildrenSeasonData.parentID,
                            programSeasonChild: true,
                            programCurrentStatus: constants.PROGRAM_STATUS.APPROVAL,
                            _id: { $ne: params.id },
                        });

                        // Update parent if no one approval
                        if (!check) {
                            await programModel
                                .updateOne(
                                    {
                                        _id: program.programChildrenSeasonData.parentID,
                                    },
                                    {
                                        $set: {
                                            programCurrentStatus:
                                                constants.PROGRAM_STATUS.UPLOAD,
                                            programDisplay: false,
                                        },
                                    }
                                )
                                .session(session);
                        }
                    }
                    formData.programDisplay = false;
                    break;
                case constants.PROGRAM_STATUS.APPROVAL:
                    if (!program.isComplete) {
                        return logger.status400(
                            response,
                            programOriginalConstant.completeAfterApproval,
                            errors
                        );
                    }

                    // Check type is Season
                    if (program.programTypeVideo === constants.TYPE_VIDEO.SS) {
                        await programModel
                            .updateOne(
                                {
                                    _id: program.programChildrenSeasonData.parentID,
                                },
                                {
                                    $set: {
                                        programCurrentStatus:
                                            constants.PROGRAM_STATUS.APPROVAL,
                                        programDisplay: true,
                                        originalDate: Date.now(),
                                    },
                                }
                            )
                            .session(session);
                    }

                    let userReceiver = program.participantsRates.map(
                        (item) => item.userID
                    );
                    if (userReceiver && userReceiver.length) {
                        userReceiver = await userModel.find({
                            _id: { $in: userReceiver },
                        });
                        const promise = userReceiver?.map(async (user) => {
                            const newDate = moment()
                                .tz('Asia/Seoul')
                                .format('YYYY-MM-DD HH:mm:ss');
                            const title = `Original Upload Completed`;
                            const content = `
                                ${user.userName}  님

                                프로그램 ${program.programName}, 시즌 ‘X’ 에피소드 ‘X’의
                                업로드가 완료되었습니다. ${newDate} 이후로
                                플랫폼 ‘옴너’에서 프로그램을 시청하실 수 있습니다. 감사합니다.`;

                            // Create message
                            const message = new MessageModel({
                                title,
                                content,
                                sender: request.user._id,
                                receiver: user._id,
                                receiverEmail: user.userEmail,
                                type: constants.MESSAGE_TYPE.AUTO,
                                category: constants.MESSAGE_CATEGORY.ORIGINAL,
                                display: constants.DISPLAY_NOTIFICATION.OFFLINE,
                            });
                            await message.save({ session });

                            // Add history
                            const history = new HistoryProgramModel({
                                manager: request.user._id,
                                managerName: request.user.userName,
                                programID: program._id,
                                typeProgram: constants.TYPE_PROGRAM_HISTORY.ORIGINAL,
                                status: constants.PROGRAM_STATUS.APPROVAL,
                                title,
                                content,
                                receiverID: user._id,
                            });
                            await history.save({ session });

                            // Create record in table notification
                            const notification = new notificationModel({
                                senderID: request.user._id,
                                receiverID: user._id,
                                programID: program._id,
                                historyID: history._id,
                                title,
                                message: content,
                                body: {
                                    programID: program._id,
                                    type: constants.NOTIFICATION_BODY_TYPE
                                        .ORIGINAL_APPROVE,
                                },
                                display: constants.DISPLAY_NOTIFICATION.OFFLINE,
                            });
                            await notification.save({ session });
                        });
                        await Promise.all(promise);

                        // Push for tab program in omner ofline
                        if (sockets)
                            sockets.emit(constants.MESSAGES_NOTIFICATION.OFFLINE, {
                                userIDs: userReceiver,
                            });
                        // End
                    }

                    formData.programDisplay = true;
                    break;
                default:
                    break;
            }

            await programModel
                .findByIdAndUpdate(params.id, {
                    $set: formData,
                })
                .session(session);

            await session.commitTransaction();
            session.endSession();
            return logger.status200Msg(
                response,
                system.success,
                programOriginalConstant.msgUpdate(params.id)
            );
        } catch (error) {
            errors.push(error.message);
            return logger.status400(response, error, errors);
        }
    }

    // [PUT] /admin/program-original/:id
    update = async (request, response) => {
        const errors = [];
        const user = request.user;
        const params = request.params;
        let formData = request.body;
        let urlArray;

        let session = await mongoose.startSession();
        session.startTransaction();
        try {
            const program = await programModel.findOne({
                _id: params.id,
                programType: constants.PROGRAM_TYPE.PROGRAM_ORIGINAL,
                deleted: false,
            });

            if (!program) {
                await session.abortTransaction();
                session.endSession();
                return logger.status404(
                    response,
                    '',
                    programOriginalConstant.notFound(params.id)
                );
            }

            if (
                program.programTypeVideo === constants.TYPE_VIDEO.SS &&
                !program.programSeasonChild
            ) {
                await session.abortTransaction();
                session.endSession();
                return logger.status400(
                    response,
                    programOriginalConstant.parentNotUpdate
                );
            }

            // resize image of poster
            if (formData.programImagePoster) {
                //453x752
                urlArray = await imgResize.resizeOptimizeUrl(
                    formData.programImagePoster,
                    453,
                    752,
                    80
                );

                formData.programImagex1 = urlArray.url1;
                formData.programImagex2 = urlArray.url2;

                urlArray = await imgResize.resizeOneUrl(
                    formData.programImagePoster,
                    1920,
                    1080,
                    80
                );

                formData.programImagePosterResize = urlArray.url1;
            }

            // resize image of program title
            if (formData.programImageTitle) {
                urlArray = await imgResize.resizeOptimizeUrl(
                    formData.programImageTitle,
                    688,
                    387,
                    80
                );

                formData.programImageTitleResize1 = urlArray.url1;
                formData.programImageTitleResize2 = urlArray.url2;
            }

            const fieldsUpdate = programOriginalConstant.fieldsAllowUpdate;
            if (program.programTypeVideo === constants.TYPE_VIDEO.SS) {
                fieldsUpdate.push('programEpisodeSummary');
            }

            // Filter remove other field not allow
            const newFormData = Object.fromEntries(
                Object.entries(formData).filter((item) => fieldsUpdate.includes(item[0]))
            );
            formData = this.checkStatusComplete(
                newFormData,
                null,
                formData.programTypeVideo
            );

            formData.totalTime = request?.body?.totalTime || program.totalTime;

            // Send email for new participant rate
            if (formData.participantsRates && formData.participantsRates.length) {
                const arrayUserID = formData.participantsRates.map((item) => item.userID);

                if (arrayUserID && arrayUserID.length) {
                    const arrayIDOld =
                        program.participantsRates && program.participantsRates.length
                            ? program.participantsRates.map((item) => item.userID)
                            : [];

                    const arrayEmailOld = arrayIDOld.length
                        ? await userModel.distinct('userEmail', {
                              _id: { $in: arrayIDOld },
                          })
                        : [];

                    const arrayEmail = await userModel.distinct('userEmail', {
                        _id: { $in: arrayUserID },
                    });

                    const arraySendEmail = _.difference(arrayEmail, arrayEmailOld);
                    arraySendEmail.length &&
                        emailService.sendEmailOriginalParticipant(arraySendEmail);

                    // Create record in table notification
                    const arrayIDNew = [
                        ...new Set(
                            _.differenceWith(
                                arrayUserID,
                                JSON.parse(JSON.stringify(arrayIDOld))
                            )
                        ),
                    ];
                    if (arrayIDNew.length) {
                        const title = `Congratulations! You've been selected as a participant for an OMN Originals program!`;
                        await Promise.all(
                            arrayIDNew.map(async (item) => {
                                const notification = new notificationModel({
                                    senderID: user._id,
                                    receiverID: item,
                                    programID: program._id.toString(),
                                    title: title,
                                    body: {
                                        programID: program._id.toString(),
                                        type: constants.NOTIFICATION_BODY_TYPE
                                            .PARTICIPANTS_RATE,
                                        category: constants.CATEGORY_NOTIFICATION.OTHER,
                                    },
                                    message: 'Please check the reason!',
                                    display: constants.DISPLAY_NOTIFICATION.OFFLINE,
                                });
                                await notification.save({ session });
                            })
                        );

                        if (sockets)
                            sockets.emit(constants.MESSAGES_NOTIFICATION.OTHER_MESSAGES, {
                                userIDs: arrayIDNew,
                            });
                    }
                }
            }

            if (request.body?.programChildrenSeasonData) {
                formData['programChildrenSeasonData.episodeSummary'] =
                    request.body.programChildrenSeasonData?.episodeSummary || undefined;
                delete formData.programChildrenSeasonData;
            }

            const allowUpdate = [
                'programMusicInfo',
                'programImageBracter',
                'previewUpload',
                'programParticipants',
            ];
            allowUpdate.forEach((item) => {
                if (request.body[item]) formData[item] = request.body[item];
            });
            await programModel
                .findByIdAndUpdate(params.id, {
                    $set: formData,
                })
                .session(session);

            // Update other program season
            if (program.programTypeVideo === constants.TYPE_VIDEO.SS) {
                let dataUpdateOther = {
                    programCategory: formData.programCategory || undefined,
                    participantsRates: formData.participantsRates || undefined,
                    programImageBracter: formData.programImageBracter || undefined,
                    programImagePoster: formData.programImagePoster || undefined,
                    programImagePosterNoTitle:
                        formData.programImagePosterNoTitle || undefined,
                    programImageTitle: formData.programImageTitle || undefined,
                    programOriginalPoster: formData.programOriginalPoster || undefined,
                    programName: formData.programName || undefined,
                    programParticipants: formData.programParticipants || undefined,
                    programSubTitle: formData.programSubTitle || undefined,
                    programSummary: formData.programSummary || undefined,
                    programTitle: formData.programTitle || undefined,
                    remark: formData.remark || undefined,
                };

                dataUpdateOther = Object.fromEntries(
                    Object.entries(dataUpdateOther).filter((item) => item[1])
                );

                const arrayID = await programModel.distinct('programSeasonData.episode', {
                    _id: program.programChildrenSeasonData.parentID,
                });
                await programModel
                    .updateMany(
                        {
                            _id: {
                                $in: [
                                    ...arrayID,
                                    program.programChildrenSeasonData.parentID,
                                ],
                            },
                        },
                        {
                            $set: dataUpdateOther,
                        }
                    )
                    .session(session);
            }

            await session.commitTransaction();
            session.endSession();
            return logger.status200Msg(
                response,
                system.success,
                programOriginalConstant.msgUpdate(params.id)
            );
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            errors.push(error.message);
            return logger.status400(response, error, errors);
        }
    };

    // [PUT] /admin/program-original/update-participants/:id
    updateParticipants = async (request, response) => {
        const errors = [];
        const user = request.user;
        const params = request.params;
        let formData = request.body;

        let session = await mongoose.startSession();
        session.startTransaction();
        try {
            const program = await programModel.findOne({
                _id: params.id,
                programType: constants.PROGRAM_TYPE.PROGRAM_ORIGINAL,
                deleted: false,
            });

            if (!program) {
                await session.abortTransaction();
                session.endSession();
                return logger.status404(
                    response,
                    '',
                    programOriginalConstant.notFound(params.id)
                );
            }

            if (
                program.programTypeVideo === constants.TYPE_VIDEO.SS &&
                !program.programSeasonChild
            ) {
                await session.abortTransaction();
                session.endSession();
                return logger.status400(
                    response,
                    programOriginalConstant.parentNotUpdate
                );
            }

            // Send email and push notification
            if (formData.participantsRates && formData.participantsRates.length) {
                const arrayUserID = formData.participantsRates.map((item) => item.userID);

                if (arrayUserID && arrayUserID.length) {
                    const arrayIDOld =
                        program.participantsRates && program.participantsRates.length
                            ? program.participantsRates.map((item) => item.userID)
                            : [];

                    const arrayEmailOld = arrayIDOld.length
                        ? await userModel.distinct('userEmail', {
                              _id: { $in: arrayIDOld },
                          })
                        : [];

                    const arrayEmail = await userModel.distinct('userEmail', {
                        _id: { $in: arrayUserID },
                    });

                    const arraySendEmail = _.difference(arrayEmail, arrayEmailOld);
                    arraySendEmail.length &&
                        emailService.sendEmailOriginalParticipant(arraySendEmail);

                    // Create record in table notification
                    const arrayIDNew = [
                        ...new Set(
                            _.differenceWith(
                                arrayUserID,
                                JSON.parse(JSON.stringify(arrayIDOld))
                            )
                        ),
                    ];
                    if (arrayIDNew.length) {
                        const title = `Congratulations! You've been selected as a participant for an OMN Originals program!`;
                        await Promise.all(
                            arrayIDNew.map(async (item) => {
                                const notification = new notificationModel({
                                    senderID: user._id,
                                    receiverID: item,
                                    programID: program._id.toString(),
                                    title: title,
                                    body: {
                                        programID: program._id.toString(),
                                        type: constants.NOTIFICATION_BODY_TYPE
                                            .PARTICIPANTS_RATE,
                                        category: constants.CATEGORY_NOTIFICATION.OTHER,
                                    },
                                    message: 'Please check the reason!',
                                    display: constants.DISPLAY_NOTIFICATION.OFFLINE,
                                });
                                await notification.save({ session });
                            })
                        );

                        if (sockets)
                            sockets.emit(constants.MESSAGES_NOTIFICATION.OTHER_MESSAGES, {
                                userIDs: arrayIDNew,
                            });
                    }
                }
            }

            // Check complete
            const fieldsUpdate = programOriginalConstant.fieldsAllowUpdate;
            if (program.programTypeVideo === constants.TYPE_VIDEO.SS) {
                fieldsUpdate.push('programEpisodeSummary');
            }

            // Filter remove other field not allow
            const newFormData = Object.fromEntries(
                Object.entries(JSON.parse(JSON.stringify(program))).filter((item) =>
                    fieldsUpdate.includes(item[0])
                )
            );

            newFormData.participantsRates = formData.participantsRates;
            formData = this.checkStatusComplete(
                newFormData,
                null,
                program.programTypeVideo
            );

            await programModel
                .findByIdAndUpdate(params.id, {
                    $set: {
                        participantsRates: formData.participantsRates,
                        isComplete: formData.isComplete,
                    },
                })
                .session(session);

            // Update other program season
            if (program.programTypeVideo === constants.TYPE_VIDEO.SS) {
                const arrayID = await programModel.distinct('programSeasonData.episode', {
                    _id: program.programChildrenSeasonData.parentID,
                });
                await programModel
                    .updateMany(
                        {
                            _id: {
                                $in: [
                                    ...arrayID,
                                    program.programChildrenSeasonData.parentID,
                                ],
                            },
                        },
                        {
                            $set: {
                                participantsRates: formData.participantsRates,
                            },
                        }
                    )
                    .session(session);
            }

            await session.commitTransaction();
            session.endSession();
            return logger.status200Msg(
                response,
                system.success,
                programOriginalConstant.updateParticipantSuccess
            );
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            errors.push(error.message);
            return logger.status400(response, error, errors);
        }
    };

    // // [GET] /admin/program-original/newest-list
    // async newestList(request, response) {
    // 	const errors = [];
    // 	request.query.programType = constants.PROGRAM_TYPE.PROGRAM_ORIGINAL;
    // 	request.query.deleted = false;
    // 	request.query.programCurrentStatus = constants.PROGRAM_STATUS.APPROVAL;
    // 	request.query.originalDate = { $in: [null, undefined, 0] };

    // 	const selectFields = ['programName', 'createdAt', 'originalDate'];
    // 	try {
    // 		if (request.query.id) {
    // 			const userEmail = new RegExp(request.query.id, "i");
    // 			const users = await userModel.find({ userEmail: userEmail, userType: 1 });
    // 			request.query.userID = {
    // 				$in: users,
    // 			};
    // 		}

    // 		delete request.query.id;
    // 		Object.assign(request.query, programConstant.FIELD_QUERY_DEFAULT);

    // 		const data = await businessQuery.handle(
    // 			programModel,
    // 			request,
    // 			{ path: "userID", select: ["userName", "userEmail"] },
    // 			selectFields
    // 		);
    // 		return logger.status200(response, system.success, "", data);
    // 	} catch (error) {
    // 		errors.push(error.message);
    // 		return logger.status500(response, error, errors);
    // 	}
    // }

    // // [GET] /admin/program-original/reveal-date
    // async revealDate(request, response) {
    // 	const errors = [];
    // 	request.query.programType = constants.PROGRAM_TYPE.PROGRAM_ORIGINAL;
    // 	request.query.deleted = false;
    // 	request.query.programCurrentStatus = constants.PROGRAM_STATUS.APPROVAL;

    // 	const start = moment().startOf('isoWeek').toDate();
    // 	const end = moment().endOf('isoWeek').add(1, 'week').toDate();

    // 	request.query.originalDate = {
    // 		$gte: start,
    // 		$lte: end,
    // 	};

    // 	const selectFields = ['programName', 'createdAt', 'originalDate'];
    // 	try {
    // 		if (request.query.id) {
    // 			const userEmail = new RegExp(request.query.id, "i");
    // 			const users = await userModel.find({ userEmail: userEmail, userType: 1 });
    // 			request.query.userID = {
    // 				$in: users,
    // 			};
    // 		}

    // 		delete request.query.id;
    // 		Object.assign(request.query, programConstant.FIELD_QUERY_DEFAULT);

    // 		const data = await businessQuery.handle(
    // 			programModel,
    // 			request,
    // 			{ path: "userID", select: ["userName", "userEmail"] },
    // 			selectFields
    // 		);
    // 		return logger.status200(response, system.success, "", data);
    // 	} catch (error) {
    // 		errors.push(error.message);
    // 		return logger.status500(response, error, errors);
    // 	}
    // }

    // [GET] /admin/program-original/thisweek
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
            if (request.query.id) {
                const userEmail = new RegExp(request.query.id, 'i');
                const users = await userModel.find({ userEmail: userEmail, userType: 1 });
                request.query.userID = {
                    $in: users,
                };
            }

            delete request.query.id;
            Object.assign(request.query, programConstant.FIELD_QUERY_DEFAULT);

            const data = await businessQuery.handle(programModel, request);
            return logger.status200(response, system.success, '', data);
        } catch (error) {
            errors.push(error.message);
            return logger.status500(response, error, errors);
        }
    }

    // [GET] /admin/program-original/nextweek
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
            if (request.query.id) {
                const userEmail = new RegExp(request.query.id, 'i');
                const users = await userModel.find({ userEmail: userEmail, userType: 1 });
                request.query.userID = {
                    $in: users,
                };
            }

            delete request.query.id;
            Object.assign(request.query, programConstant.FIELD_QUERY_DEFAULT);

            const data = await businessQuery.handle(programModel, request);
            return logger.status200(response, system.success, '', data);
        } catch (error) {
            errors.push(error.message);
            return logger.status500(response, error, errors);
        }
    }
}

module.exports = new ProgramOriginalController();
