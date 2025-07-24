const programModel = require('../../../Models/Program/ProgramModel');
const system = require('../../../Constant/General/SystemConstant');
const businessQuery = require('../../../Business/QueryModel');
const uploadConstant = require('../../../Constant/Upload/UploadConstant');
const programEditModel = require('../../../Models/ProgramEdit/ProgramEditModel');
const PushNotificationController = require('../../User/Push/PushNotificationController');
const HistoryProgramModel = require('../../../Models/Program/HistoryProgramModel');
const historyEditProgramService = require('../../../Service/HistoryEditProgram/HistoryEditProgramService');

const userModel = require('../../../Models/User/UserModel');
const SurveyProgramModel = require('../../../Models/Survey/SurveyProgramModel');
const logger = require('../../../Constant/Logger/loggerConstant');
const mongoose = require('mongoose');
const constants = require('../../../Constant/constants');
const programConstant = require('../../../Constant/Program/ProgramConstant');
const programService = require('../../../Service/Program/ProgramService');
const adminService = require('../../../Service/Admin/AdminService');
const s3Service = require('../../../Service/S3/S3Service');
// const messageModel = require('../../../Models/Message/MessageModel');

// const emailConstant = require('../../../Constant/Email/EmailConstant');
// const sendEmail = require('../../../Service/Email/EmailService');
const _ = require('lodash');
const moment = require('moment-timezone');

class UploadController {
    // [GET] /admin/upload/
    async index(request, response, next) {
        const errors = [];
        request.query.programType = constants.PROGRAM_TYPE.UPLOAD;
        request.query.deleted = false;
        request.query.isPending = request.query.isPending === 'true' ? true : false;

        if (request.query.isPending) {
            if (request.query.createdAt) {
                request.query.createdAt = moment(request.query.createdAt)
                    .startOf('isoDate')
                    .subtract(1, 'day')
                    .format('YYYY-MM-DD');
            }
            if (request.query.updatedAt) {
                request.query.updatedAt = moment(request.query.updatedAt)
                    .startOf('isoDate')
                    .subtract(1, 'day')
                    .format('YYYY-MM-DD');
            }
        }

        if (request.query.programCurrentStatus) {
            request.query.programCurrentStatus = {
                $ne: constants.PROGRAM_STATUS.DELETE,
                $eq: request.query.programCurrentStatus,
            };
        } else {
            request.query.programCurrentStatus = {
                $ne: constants.PROGRAM_STATUS.DELETE,
            };
        }
        const selectFields = [
            'programName',
            'programCurrentStatus',
            'createdAt',
            'updatedAt',
            'isResultLetter',
            'programTypeVideo',
            'programSeasonData',
        ];
        try {
            if (request.query.id) {
                const userEmail = new RegExp(request.query.id, 'i');
                const users = await userModel.distinct('_id', { userEmail });
                request.query.userID = {
                    $in: users,
                };
            }
            delete request.query.id;
            Object.assign(request.query, programConstant.FIELD_QUERY_DEFAULT);

            delete request.query.verifyDenial;
            delete request.query['programChildrenSeasonData.parentID'];
            const arrayUpdate = await businessQuery.handle(
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

            let docs = [];
            Object.entries(arrayUpdate.docs).forEach(([v, item]) => {
                let temp = item.toObject();
                let arraySeason = [];
                let arrayEpisode = [];
                if (temp.programTypeVideo == constants.TYPE_VIDEO.SS) {
                    if (temp.programSeasonData.length > 0) {
                        temp.programSeasonData.map((seasonItem) => {
                            if (!seasonItem.seasonName) {
                                temp.season_episodes = 'No season, No episodes';
                            } else {
                                let stringSeason = 'Season ' + seasonItem?.seasonName;
                                arrayEpisode = [];
                                seasonItem.episode.map((episode) => {
                                    let stringEpisodes = '';
                                    if (episode?.programChildrenSeasonData.episodeName) {
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
                                    stringSeason +  ': ' + arrayEpisode;

                                arraySeason.push(stringSeasonsEpisodes);
                            }
                        });
                        temp.season_episodes = arraySeason.toString();
                    } else {
                        temp.season_episodes = 'No season, No episodes';
                    }
                } else {
                    temp.season_episodes = '-';
                }

                docs.push(temp);
            });

            // Object.entries(arrayUpdate.docs).forEach(([v, item]) => {
            //     let temp = item.toObject();
            //     if (temp.programTypeVideo == constants.TYPE_VIDEO.SS) {
            //         if (temp.programChildrenSeasonData.seasonName == '') {
            //             temp.season_episodes = 'No season';
            //         } else {
            //             temp.season_episodes = 'Season ' + temp?.programChildrenSeasonData.seasonName
            //             + ',Episode ' + temp?.programChildrenSeasonData.episodeName;
            //         }
            //     } else {
            //         temp.season_episodes = '-';
            //     }

            //     docs.push(temp);
            // });

            arrayUpdate.docs = docs;
            return logger.status200(response, system.success, '', arrayUpdate);
        } catch (error) {
            errors.push(error.message);
            return logger.status500(response, error, errors);
        }
    }

    // [GET] /admin/upload/:id
    async detail(request, response, next) {
        const params = request.params;
        const errors = [];
        try {
            // Find for check pending
            const program = await programModel.findById({
                _id: params.id,
            });
            if (!program) {
                return logger.status404(
                    response,
                    system.error,
                    uploadConstant.notFound(params.id)
                );
            }

            const programData = await programModel
                .findById({
                    _id: params.id,
                })
                .populate([
                    {
                        path: 'programCategory.categoryManageId',
                        select: 'categoryMangeName',
                    },
                    {
                        path: 'programCategory.categoryArrayTag',
                        select: 'tagName',
                    },
                    {
                        path: 'userID',
                        select: 'userEmail userName',
                    },
                    {
                        path: 'programSeasonData.episode',
                        select: 'programChildrenSeasonData',
                        match: {
                            isPending: !!program.isPending,
                            deleted: false,
                            verifyDenial: null,
                        },
                    },
                ])
                .lean();

            if (
                programData.programTypeVideo === constants.TYPE_VIDEO.SS &&
                programData.programSeasonChild
            ) {
                // programData.programSeasonData = (
                //     (programData?.programChildrenSeasonData &&
                //         programData.programChildrenSeasonData.parentID &&
                //         (await programModel
                //             .findById(programData.programChildrenSeasonData.parentID)
                //             .populate([
                //                 {
                //                     path: 'programSeasonData.episode',
                //                     select: 'programChildrenSeasonData',
                //                     match: { isPending: false, deleted: false },
                //                 },
                //             ]))) ||
                //     {}
                // ).programSeasonData;
                if (programData?.programChildrenSeasonData?.parentID) {
                    const parent = await programModel
                        .findById(programData.programChildrenSeasonData.parentID)
                        .populate([
                            {
                                path: 'programSeasonData.episode',
                                select: 'programChildrenSeasonData',
                                match: {
                                    isPending: !!program.isPending,
                                    deleted: false,
                                    verifyDenial: null,
                                },
                            },
                        ]);
                    programData.programSeasonData = JSON.parse(
                        JSON.stringify(parent.programSeasonData)
                    );
                }

                programData.programChildrenSeasonData.seasonID = (
                    (programData.programSeasonData &&
                        programData.programSeasonData.find((item) => {
                            return (
                                item.seasonName ===
                                programData.programChildrenSeasonData.seasonName
                            );
                        })) ||
                    {}
                )._id;
            }

            if (programData.programSeasonData) {
                await Promise.all(
                    programData.programSeasonData.map(async (item) => {
                        await Promise.all(
                            item.episode.map(async (episodes) => {
                                let programEpisode = await programModel.findById(
                                    episodes._id
                                );

                                if (
                                    programEpisode.programCurrentStatus ===
                                        constants.PROGRAM_STATUS.UPLOAD ||
                                    programEpisode.programCurrentStatus ===
                                        constants.PROGRAM_STATUS.REVIEW
                                ) {
                                    // episode have status upload and review
                                    episodes.programChildrenSeasonData.isReview = true;
                                } else {
                                    episodes.programChildrenSeasonData.isReview = false;
                                }
                            })
                        );
                    })
                );
            }

            const survey = await SurveyProgramModel.findOne({
                programID: params.id,
            });
            return logger.status200(response, system.success, '', {
                ...programData,
                completedSurvey: !!survey,
            });
        } catch (error) {
            errors.push(error.message);
            return logger.status400(response, error, errors);
        }
    }

    // [POST] /admin/upload/create
    async create(request, response, next) {
        const formData = request.body;
        let session = await mongoose.startSession();
        session.startTransaction();
        if (request.admin) {
            formData.userID = request.admin._id.toString();
        }

        formData.programType = constants.PROGRAM_TYPE.UPLOAD;

        const errors = [];
        try {
            const upload = await programModel.create(formData).session(session);
            await session.commitTransaction();
            session.endSession();
            return logger.status201(response, upload);
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            errors.push(error.message);
            return logger.status400(response, error, errors);
        }
    }

    // [PUT] /admin/upload/status/:id
    // async updateStatus(request, response, next) {
    //     const paramsData = request.params;
    //     const formData = request.body;
    //     const updates = Object.keys(formData);
    //     let errors = [];
    //     let allowedStatus = [];
    //     let user = request.user;

    //     let session = await mongoose.startSession();
    //     session.startTransaction();
    //     try {
    //         //only allow change status
    //         const allowedUpdates = ['programCurrentStatus'];
    //         const isValidOperation = updates.every((update) => {
    //             return allowedUpdates.includes(update);
    //         });

    //         if (!isValidOperation) {
    //             session.endSession();
    //             const fields = updates
    //                 .filter((item) => !allowedUpdates.includes(item))
    //                 .join(', ');
    //             return logger.status400(response, system.invalidField + fields, errors);
    //         }

    //         //check permision user
    //         if (user && user.userType) {
    //             //admin
    //             allowedStatus = [
    //                 constants.PROGRAM_STATUS.REVIEW,
    //                 constants.PROGRAM_STATUS.OMN,
    //                 constants.PROGRAM_STATUS.DENIAL,
    //                 constants.PROGRAM_STATUS.APPROVAL,
    //                 constants.PROGRAM_STATUS.DELETE,
    //                 constants.PROGRAM_STATUS.INSTANT,
    //                 constants.PROGRAM_STATUS.EDIT,
    //             ];
    //         } else {
    //             session.endSession();
    //             return logger.status400(response, uploadConstant.permissionError, errors);
    //         }

    //         if (!allowedStatus.includes(formData.programCurrentStatus)) {
    //             session.endSession();
    //             return logger.status400(response, uploadConstant.permissionError, errors);
    //         }

    //         let dataOld = await programModel.findById({
    //             _id: paramsData.id,
    //             programType: constants.PROGRAM_TYPE.UPLOAD,
    //             deleted: false,
    //         });

    //         if (!dataOld) {
    //             session.endSession();
    //             return logger.status404(
    //                 response,
    //                 system.error,
    //                 uploadConstant.notFound(paramsData.id)
    //             );
    //         }

    //         // Not update parent
    //         if (
    //             dataOld.programTypeVideo === constants.TYPE_VIDEO.SS &&
    //             !dataOld.programSeasonChild
    //         ) {
    //             session.endSession();
    //             return logger.status400(response, programConstant.updateParentAdmin, []);
    //         }

    //         const status = formData.programCurrentStatus;
    //         const dataOldJson = dataOld.toObject();

    //         switch (status) {
    //             case constants.PROGRAM_STATUS.REVIEW:
    //                 if (
    //                     dataOldJson.programCurrentStatus ===
    //                         constants.PROGRAM_STATUS.UPLOAD ||
    //                     dataOldJson.programCurrentStatus ===
    //                         constants.PROGRAM_STATUS.DENIAL
    //                 ) {
    //                     await dataOld.updateOne(formData).session(session);
    //                     await session.commitTransaction();
    //                     session.endSession();
    //                     return logger.status200Msg(
    //                         response,
    //                         system.success,
    //                         uploadConstant.msgUpdateUpload(paramsData.id)
    //                     );
    //                 } else {
    //                     session.endSession();
    //                     return logger.status400(
    //                         response,
    //                         uploadConstant.errorUpdate,
    //                         errors
    //                     );
    //                 }
    //                 break;
    //             case constants.PROGRAM_STATUS.DENIAL:
    //                 if (
    //                     dataOldJson.programCurrentStatus ===
    //                     constants.PROGRAM_STATUS.INSTANT
    //                 ) {
    //                     session.endSession();
    //                     return logger.status400(
    //                         response,
    //                         uploadConstant.errorUpdate,
    //                         errors
    //                     );
    //                 }
    //                 await dataOld
    //                     .updateOne({
    //                         ...formData,
    //                         programDisplay: false,
    //                     })
    //                     .session(session);
    //                 await session.commitTransaction();
    //                 session.endSession();

    //                 // Check type is Season
    //                 if (dataOldJson.programTypeVideo === constants.TYPE_VIDEO.SS) {
    //                     const check = await programModel.findOne({
    //                         'programChildrenSeasonData.parentID':
    //                             dataOldJson.programChildrenSeasonData.parentID,
    //                         programSeasonChild: true,
    //                         programCurrentStatus: {
    //                             $in: [
    //                                 constants.PROGRAM_STATUS.INSTANT,
    //                                 constants.PROGRAM_STATUS.OMN,
    //                                 constants.PROGRAM_STATUS.APPROVAL,
    //                             ],
    //                         },
    //                     });

    //                     // Update parent if no one approval
    //                     if (!check) {
    //                         await programModel.updateOne(
    //                             {
    //                                 _id: dataOldJson.programChildrenSeasonData.parentID,
    //                             },
    //                             {
    //                                 $set: {
    //                                     programCurrentStatus:
    //                                         constants.PROGRAM_STATUS.REVIEW,
    //                                     programDisplay: false,
    //                                 },
    //                             }
    //                         );
    //                     }

    //                     // Socket for episode
    //                     adminService.notiStatusEpisodeOffline(dataOld, status);
    //                 }
    //                 return logger.status200Msg(
    //                     response,
    //                     system.success,
    //                     uploadConstant.msgUpdateUpload(paramsData.id)
    //                 );
    //                 break;
    //             case constants.PROGRAM_STATUS.DELETE:
    //                 await dataOld
    //                     .updateOne({
    //                         ...formData,
    //                         programDisplay: false,
    //                     })
    //                     .session(session);
    //                 await session.commitTransaction();
    //                 session.endSession();

    //                 // Check type is Season
    //                 if (dataOldJson.programTypeVideo === constants.TYPE_VIDEO.SS) {
    //                     const parent = await programModel.findById(
    //                         dataOld.programChildrenSeasonData.parentID
    //                     );

    //                     if (parent) {
    //                         parent.programCurrentStatus = constants.PROGRAM_STATUS.REVIEW;
    //                         parent.programDisplay = false;

    //                         parent.programSeasonData.forEach((item) => {
    //                             if (
    //                                 item.seasonName ===
    //                                 dataOld.programChildrenSeasonData.seasonName
    //                             ) {
    //                                 item.episodeDeleted && item.episodeDeleted.length
    //                                     ? item.episodeDeleted.push(dataOld._id)
    //                                     : (item.episodeDeleted = [dataOld._id]);

    //                                 item.episodeDeleted = _.uniqWith(
    //                                     item.episodeDeleted,
    //                                     _.isEqual
    //                                 );
    //                             }
    //                         });

    //                         await parent.save({ session });
    //                     }

    //                     // Socket for episode
    //                     adminService.notiStatusEpisodeOffline(dataOld, status);
    //                 }
    //                 return logger.status200Msg(
    //                     response,
    //                     system.success,
    //                     uploadConstant.msgUpdateUpload(paramsData.id)
    //                 );
    //                 break;
    //             case constants.PROGRAM_STATUS.INSTANT:
    //                 if (
    //                     dataOldJson.programCurrentStatus ===
    //                     constants.PROGRAM_STATUS.DENIAL
    //                 ) {
    //                     session.endSession();
    //                     return logger.status400(
    //                         response,
    //                         uploadConstant.errorUpdate,
    //                         errors
    //                     );
    //                 }
    //                 formData.programDisplay = true;
    //                 await dataOld.updateOne(formData).session(session);

    //                 // Check type is Season
    //                 if (dataOldJson.programTypeVideo === constants.TYPE_VIDEO.SS) {
    //                     // Update parent to approval
    //                     const parent = await programModel.findById(
    //                         dataOld.programChildrenSeasonData.parentID
    //                     );

    //                     if (parent) {
    //                         let episodeDeleted = [];

    //                         // If all episode deleted has approval => parent display in online
    //                         parent.programSeasonData.forEach((item) => {
    //                             if (
    //                                 item.seasonName ===
    //                                 dataOld.programChildrenSeasonData.seasonName
    //                             ) {
    //                                 episodeDeleted = item.episodeDeleted
    //                                     ? _.differenceWith(
    //                                           item.episodeDeleted,
    //                                           [dataOld._id],
    //                                           _.isEqual
    //                                       )
    //                                     : [];

    //                                 item.episodeDeleted = episodeDeleted;
    //                             }
    //                         });

    //                         if (!episodeDeleted.length) {
    //                             parent.programCurrentStatus =
    //                                 constants.PROGRAM_STATUS.APPROVAL;
    //                             parent.programDisplay = true;
    //                         }
    //                         await parent.save({ session });
    //                     }

    //                     // Socket for episode
    //                     adminService.notiStatusEpisodeOffline(dataOld, status);
    //                 }

    //                 PushNotificationController.pushNotificationNewProgram(dataOld, user);

    //                 await session.commitTransaction();
    //                 session.endSession();
    //                 return logger.status200Msg(
    //                     response,
    //                     system.success,
    //                     uploadConstant.msgUpdateUpload(paramsData.id)
    //                 );
    //                 break;
    //             case constants.PROGRAM_STATUS.APPROVAL:
    //                 if (
    //                     [
    //                         constants.PROGRAM_STATUS.UPLOAD,
    //                         constants.PROGRAM_STATUS.REVIEW,
    //                         constants.PROGRAM_STATUS.EDIT,
    //                         constants.PROGRAM_STATUS.DENIAL,
    //                     ].includes(dataOldJson.programCurrentStatus)
    //                 ) {
    //                     if (
    //                         dataOldJson.programCurrentStatus ===
    //                         constants.PROGRAM_STATUS.EDIT
    //                     ) {
    //                         const findProgramEdit = await programEditModel.findOne({
    //                             programID: dataOldJson._id,
    //                             userID: dataOldJson.userID,
    //                             programCurrentStatus: {
    //                                 $in: [
    //                                     constants.PROGRAM_STATUS.EDIT,
    //                                     constants.PROGRAM_STATUS.UPLOAD,
    //                                 ],
    //                             },
    //                         });

    //                         if (findProgramEdit) {
    //                             session.endSession();
    //                             return logger.status200Msg(
    //                                 response,
    //                                 system.success,
    //                                 uploadConstant.msgProgram
    //                             );
    //                         }
    //                     }
    //                     await dataOld.updateOne(formData).session(session);

    //                     // Check type is Season
    //                     if (dataOldJson.programTypeVideo === constants.TYPE_VIDEO.SS) {
    //                         // Update parent to approval
    //                         const parent = await programModel.findById(
    //                             dataOld.programChildrenSeasonData.parentID
    //                         );

    //                         if (parent) {
    //                             let episodeDeleted = [];

    //                             // If all episode deleted has approval => parent display in online
    //                             parent.programSeasonData.forEach((item) => {
    //                                 if (
    //                                     item.seasonName ===
    //                                     dataOld.programChildrenSeasonData.seasonName
    //                                 ) {
    //                                     episodeDeleted = item.episodeDeleted
    //                                         ? _.differenceWith(
    //                                               item.episodeDeleted,
    //                                               [dataOld._id],
    //                                               _.isEqual
    //                                           )
    //                                         : [];

    //                                     item.episodeDeleted = episodeDeleted;
    //                                 }
    //                             });

    //                             if (!episodeDeleted.length) {
    //                                 parent.programCurrentStatus =
    //                                     constants.PROGRAM_STATUS.APPROVAL;
    //                             }
    //                             await parent.save({ session });

    //                             // Socket for episode
    //                             adminService.notiStatusEpisodeOffline(dataOld, status);
    //                         }
    //                     }

    //                     await session.commitTransaction();
    //                     session.endSession();
    //                     return logger.status200Msg(
    //                         response,
    //                         system.success,
    //                         uploadConstant.msgUpdateUpload(paramsData.id)
    //                     );
    //                 } else {
    //                     session.endSession();
    //                     return logger.status400(
    //                         response,
    //                         uploadConstant.errorUpdate,
    //                         errors
    //                     );
    //                 }
    //                 break;
    //             case constants.PROGRAM_STATUS.OMN:
    //                 if (
    //                     [
    //                         constants.PROGRAM_STATUS.UPLOAD,
    //                         constants.PROGRAM_STATUS.REVIEW,
    //                         constants.PROGRAM_STATUS.APPROVAL,
    //                     ].includes(dataOldJson.programCurrentStatus)
    //                 ) {
    //                     await dataOld.updateOne(formData).session(session);

    //                     // Check type is Season
    //                     if (dataOldJson.programTypeVideo === constants.TYPE_VIDEO.SS) {
    //                         // Update parent to approval
    //                         const parent = await programModel.findById(
    //                             dataOld.programChildrenSeasonData.parentID
    //                         );

    //                         if (parent) {
    //                             let episodeDeleted = [];

    //                             // If all episode deleted has approval => parent display in online
    //                             parent.programSeasonData.forEach((item) => {
    //                                 if (
    //                                     item.seasonName ===
    //                                     dataOld.programChildrenSeasonData.seasonName
    //                                 ) {
    //                                     episodeDeleted = item.episodeDeleted
    //                                         ? _.differenceWith(
    //                                               item.episodeDeleted,
    //                                               [dataOld._id],
    //                                               _.isEqual
    //                                           )
    //                                         : [];

    //                                     item.episodeDeleted = episodeDeleted;
    //                                 }
    //                             });

    //                             if (!episodeDeleted.length) {
    //                                 parent.programCurrentStatus =
    //                                     constants.PROGRAM_STATUS.APPROVAL;
    //                             }
    //                             await parent.save({ session });
    //                         }

    //                         // Socket for episode
    //                         adminService.notiStatusEpisodeOffline(dataOld, status);
    //                     }

    //                     await session.commitTransaction();
    //                     session.endSession();
    //                     return logger.status200Msg(
    //                         response,
    //                         system.success,
    //                         uploadConstant.msgUpdateUpload(paramsData.id)
    //                     );
    //                 } else {
    //                     session.endSession();
    //                     return logger.status400(
    //                         response,
    //                         uploadConstant.errorUpdate,
    //                         errors
    //                     );
    //                 }
    //                 break;
    //             case constants.PROGRAM_STATUS.EDIT:
    //                 if (
    //                     dataOldJson.programCurrentStatus ===
    //                         constants.PROGRAM_STATUS.UPLOAD ||
    //                     dataOldJson.programCurrentStatus ===
    //                         constants.PROGRAM_STATUS.REVIEW ||
    //                     dataOldJson.programCurrentStatus ===
    //                         constants.PROGRAM_STATUS.DENIAL ||
    //                     dataOldJson.programCurrentStatus === constants.PROGRAM_STATUS.OMN
    //                 ) {
    //                     await dataOld.updateOne(formData).session(session);
    //                     await session.commitTransaction();
    //                     session.endSession();

    //                     // Add history
    //                     request.body = {
    //                         status: 'edit',
    //                         title: 'Change status program to edit',
    //                         content: 'Change status program to edit',
    //                     };
    //                     request.params.id = dataOld._id;
    //                     await UploadController.prototype.addHistory(
    //                         request,
    //                         response,
    //                         next
    //                     );
    //                     // return logger.status200Msg(
    //                     // 	response,
    //                     // 	system.success,
    //                     // 	uploadConstant.msgUpdateUpload(paramsData.id)
    //                     // );
    //                 } else if (
    //                     dataOldJson.programCurrentStatus ===
    //                     constants.PROGRAM_STATUS.APPROVAL
    //                 ) {
    //                     dataOldJson.programID = dataOldJson._id;
    //                     let findProgramEdit = await programEditModel.findOne({
    //                         programID: dataOldJson._id,
    //                         userID: dataOldJson.userID,
    //                         programCurrentStatus: {
    //                             $in: [
    //                                 constants.PROGRAM_STATUS.EDIT,
    //                                 constants.PROGRAM_STATUS.UPLOAD,
    //                             ],
    //                         },
    //                     });
    //                     if (!findProgramEdit) {
    //                         dataOldJson.programID = dataOldJson._id;
    //                         delete dataOldJson._id;
    //                         dataOldJson.programCurrentStatus =
    //                             constants.PROGRAM_STATUS.EDIT;
    //                         findProgramEdit = new programEditModel(dataOldJson);
    //                         findProgramEdit.createdAt = Date.now();
    //                         findProgramEdit.updatedAt = Date.now();
    //                         await findProgramEdit.save({ session: session });

    //                         await dataOld
    //                             .updateOne({
    //                                 programCurrentStatus: constants.PROGRAM_STATUS.EDIT,
    //                                 deleted: true,
    //                             })
    //                             .session(session);
    //                         await session.commitTransaction();
    //                         session.endSession();

    //                         // Check type is Season
    //                         if (
    //                             dataOldJson.programTypeVideo === constants.TYPE_VIDEO.SS
    //                         ) {
    //                             const check = await programModel.findOne({
    //                                 'programChildrenSeasonData.parentID':
    //                                     dataOldJson.programChildrenSeasonData.parentID,
    //                                 programSeasonChild: true,
    //                                 programCurrentStatus: {
    //                                     $in: [
    //                                         constants.PROGRAM_STATUS.INSTANT,
    //                                         constants.PROGRAM_STATUS.OMN,
    //                                         constants.PROGRAM_STATUS.APPROVAL,
    //                                     ],
    //                                 },
    //                             });

    //                             // Update parent if no one approval
    //                             if (!check) {
    //                                 await programModel.updateOne(
    //                                     {
    //                                         _id: dataOldJson.programChildrenSeasonData
    //                                             .parentID,
    //                                     },
    //                                     {
    //                                         $set: {
    //                                             programCurrentStatus:
    //                                                 constants.PROGRAM_STATUS.REVIEW,
    //                                         },
    //                                     }
    //                                 );
    //                             }
    //                         }

    //                         // Add history
    //                         request.body = {
    //                             status: 'edit',
    //                             title: 'Change status program to edit',
    //                             content: 'Change status program to edit',
    //                         };
    //                         request.params.id = dataOld._id;
    //                         await UploadController.prototype.addHistory(
    //                             request,
    //                             response,
    //                             next
    //                         );
    //                         // return logger.status200Msg(
    //                         // 	response,
    //                         // 	system.success,
    //                         // 	uploadConstant.msgUpdateUpload(paramsData.id)
    //                         // );
    //                     } else {
    //                         session.endSession();
    //                         return logger.status400(
    //                             response,
    //                             uploadConstant.errorUpdate,
    //                             errors
    //                         );
    //                     }
    //                 } else {
    //                     session.endSession();
    //                     return logger.status400(
    //                         response,
    //                         uploadConstant.errorUpdate,
    //                         errors
    //                     );
    //                 }
    //                 break;
    //             default:
    //                 session.endSession();
    //                 return logger.status400(response, uploadConstant.errorUpdate, errors);
    //                 break;
    //         }
    //     } catch (error) {
    //         await session.abortTransaction();
    //         session.endSession();
    //         errors.push(error.message);
    //         return logger.status400(response, error, errors, system.error);
    //     }
    // }

    // [PUT] /admin/upload/status/:id
    async updateStatusNewFlow(request, response, next) {
        const paramsData = request.params;
        const formData = request.body;
        const updates = Object.keys(formData);
        let errors = [];
        let allowedStatus = [];
        let user = request.user;

        const linkImageLogoOMN = constants.DEFAULT_THUMNAIL;

        let session = await mongoose.startSession();
        session.startTransaction();

        try {
            //only allow change status
            const allowedUpdates = ['programCurrentStatus'];
            const isValidOperation = updates.every((update) => {
                return allowedUpdates.includes(update);
            });

            if (!isValidOperation) {
                session.endSession();
                const fields = updates
                    .filter((item) => !allowedUpdates.includes(item))
                    .join(', ');
                return logger.status400(
                    response,
                    system.invalidField + fields,
                    errors,
                    system.error
                );
            }

            //check permision user
            if (user && user.userType) {
                //admin
                allowedStatus = [
                    constants.PROGRAM_STATUS.REVIEW,
                    constants.PROGRAM_STATUS.OMN,
                    constants.PROGRAM_STATUS.DENIAL,
                    constants.PROGRAM_STATUS.APPROVAL,
                    constants.PROGRAM_STATUS.DELETE,
                    constants.PROGRAM_STATUS.INSTANT,
                ];
            } else {
                session.endSession();
                return logger.status400(response, uploadConstant.permissionError, errors);
            }

            if (!allowedStatus.includes(formData.programCurrentStatus)) {
                session.endSession();
                return logger.status400(response, uploadConstant.permissionError, errors);
            }

            let dataOld = await programModel.findById({
                _id: paramsData.id,
                programType: constants.PROGRAM_TYPE.UPLOAD,
                deleted: false,
            });

            if (!dataOld) {
                session.endSession();
                return logger.status404(
                    response,
                    system.error,
                    uploadConstant.notFound(paramsData.id)
                );
            }

            // Not update parent
            if (
                dataOld.programTypeVideo === constants.TYPE_VIDEO.SS &&
                !dataOld.programSeasonChild
            ) {
                session.endSession();
                return logger.status400(response, programConstant.updateParentAdmin, []);
            }

            const status = formData.programCurrentStatus;
            const dataOldJson = dataOld.toObject();

            switch (status) {
                case constants.PROGRAM_STATUS.REVIEW:
                    if (
                        dataOldJson.programCurrentStatus ===
                            constants.PROGRAM_STATUS.UPLOAD ||
                        // dataOldJson.programCurrentStatus ===
                        //     constants.PROGRAM_STATUS.DENIAL ||
                        dataOldJson.programCurrentStatus === constants.PROGRAM_STATUS.EDIT
                    ) {
                        await dataOld.updateOne(formData).session(session);

                        if (dataOld.programTypeVideo === constants.TYPE_VIDEO.SS) {
                            const checkStatusParent = await programModel.findOne({
                                'programChildrenSeasonData.parentID':
                                    dataOldJson.programChildrenSeasonData.parentID,
                                programSeasonChild: true,
                                programCurrentStatus: {
                                    $in: [
                                        constants.PROGRAM_STATUS.INSTANT,
                                        constants.PROGRAM_STATUS.OMN,
                                        constants.PROGRAM_STATUS.APPROVAL,
                                    ],
                                },
                                _id: { $ne: dataOld._id },
                            });

                            if (!checkStatusParent) {
                                await programModel
                                    .updateOne(
                                        {
                                            _id: dataOldJson.programChildrenSeasonData
                                                .parentID,
                                        },
                                        {
                                            $set: {
                                                programCurrentStatus:
                                                    constants.PROGRAM_STATUS.REVIEW,
                                                programDisplay: false,
                                            },
                                        }
                                    )
                                    .session(session);
                            }
                        }

                        await historyEditProgramService.findNewestAndUpdateStatusHistoryEdit(
                            response,
                            session,
                            dataOldJson,
                            constants.PROGRAM_STATUS.REVIEW
                        );

                        await session.commitTransaction();
                        session.endSession();
                        return logger.status200Msg(
                            response,
                            system.success,
                            uploadConstant.msgUpdateUpload(paramsData.id)
                        );
                    } else {
                        session.endSession();
                        return logger.status400(
                            response,
                            uploadConstant.errorUpdate,
                            errors
                        );
                    }
                    break;

                case constants.PROGRAM_STATUS.DENIAL:
                    if (
                        dataOldJson.programCurrentStatus ===
                        constants.PROGRAM_STATUS.INSTANT
                    ) {
                        session.endSession();
                        return logger.status400(
                            response,
                            uploadConstant.errorUpdate,
                            errors
                        );
                    }

                    // Check type is Season
                    if (dataOldJson.programTypeVideo === constants.TYPE_VIDEO.SS) {
                        formData.programSeasonChild = false;

                        const parent = await programModel.findById(
                            dataOld.programChildrenSeasonData.parentID
                        );

                        if (parent) {
                            parent.programCurrentStatus = constants.PROGRAM_STATUS.REVIEW;
                            parent.programDisplay = false;

                            await parent.save({ session });
                        }

                        // delete video
                        await s3Service.deleteFileVideoS3(
                            dataOldJson.programChildrenSeasonData.linkVideo
                        );

                        await s3Service.deleteFileVideoS3(dataOldJson.linkVideo);

                        formData.programChildrenSeasonData =
                            dataOldJson.programChildrenSeasonData;
                        formData.programChildrenSeasonData.linkVideo = linkImageLogoOMN;
                        formData.linkVideo = linkImageLogoOMN;
                        // Socket for episode
                        adminService.notiStatusEpisodeOffline(dataOld, status);
                    }

                    if (dataOldJson.programTypeVideo === constants.TYPE_VIDEO.SA) {
                        //delete file video and url video
                        await s3Service.deleteFileVideoS3(dataOldJson.linkVideo);

                        // add link logo of omn
                        formData.linkVideo = linkImageLogoOMN;
                    }

                    formData.verifyDenial = false;
                    await dataOld
                        .updateOne({
                            ...formData,
                            programDisplay: false,
                        })
                        .session(session);

                    await historyEditProgramService.findNewestAndUpdateStatusHistoryEdit(
                        response,
                        session,
                        dataOldJson,
                        constants.PROGRAM_STATUS.DENIAL
                    );

                    await session.commitTransaction();
                    session.endSession();
                    return logger.status200Msg(
                        response,
                        system.success,
                        uploadConstant.msgUpdateUpload(paramsData.id)
                    );
                    break;
                case constants.PROGRAM_STATUS.DELETE:
                    // Check type is Season
                    if (dataOldJson.programTypeVideo === constants.TYPE_VIDEO.SS) {
                        const parent = await programModel.findById(
                            dataOld.programChildrenSeasonData.parentID
                        );

                        if (parent) {
                            parent.programCurrentStatus = constants.PROGRAM_STATUS.REVIEW;
                            parent.programDisplay = false;

                            parent.programSeasonData.forEach((item) => {
                                if (
                                    item.seasonName ===
                                    dataOld.programChildrenSeasonData.seasonName
                                ) {
                                    item.episodeDeleted && item.episodeDeleted.length
                                        ? item.episodeDeleted.push(dataOld._id)
                                        : (item.episodeDeleted = [dataOld._id]);

                                    item.episodeDeleted = _.uniqWith(
                                        item.episodeDeleted,
                                        _.isEqual
                                    );
                                }
                            });

                            await parent.save({ session });
                        }

                        //delete file s3 folder input
                        // dataLink = dataOldJson.programChildrenSeasonData.linkVideo.split(
                        //     process.env.LINK_INPUT + '/'
                        // );

                        // let Key = dataLink[1];
                        // let media = new mediaConvert();
                        // await media.deleteFileS3(Key);

                        await s3Service.deleteFileVideoS3(
                            dataOldJson.programChildrenSeasonData.linkVideo
                        );

                        await s3Service.deleteFileVideoS3(dataOldJson.linkVideo);

                        // add link logo of omn
                        formData.programChildrenSeasonData =
                            dataOldJson.programChildrenSeasonData;
                        formData.programChildrenSeasonData.linkVideo = linkImageLogoOMN;

                        formData.linkVideo = linkImageLogoOMN;

                        // Socket for episode
                        adminService.notiStatusEpisodeOffline(dataOld, status);
                    }

                    if (dataOldJson.programTypeVideo === constants.TYPE_VIDEO.SA) {
                        //delete file video and url video
                        await s3Service.deleteFileVideoS3(dataOldJson.linkVideo);
                        // add link logo of omn
                        formData.linkVideo = linkImageLogoOMN;

                        const arrayDelete = [
                            dataOldJson.programImagePoster,
                            dataOldJson.programImagePosterNoTitle,
                            dataOldJson.programImageTitle,
                            dataOldJson.videoThumbnail,
                            dataOldJson.programImagex1,
                            dataOldJson.programImagex2,
                            dataOldJson.programImageTitleResize1,
                            dataOldJson.programImageTitleResize2,
                        ];

                        if (dataOldJson?.programThumbnail?.thumbnailImage) {
                            formData.programThumbnail = dataOldJson.programThumbnail;
                            arrayDelete.push(dataOldJson.programThumbnail.thumbnailImage);
                            formData.programThumbnail.thumbnailImage = linkImageLogoOMN;
                        }
                        if (dataOldJson?.programImagePosterResize) {
                            arrayDelete.push(dataOldJson.programImagePosterResize);
                            formData.programImagePosterResize = linkImageLogoOMN;
                        }

                        await s3Service.deleteFileImageS3(arrayDelete);

                        formData.programImagePoster = linkImageLogoOMN;
                        formData.programImagePosterNoTitle = linkImageLogoOMN;
                        formData.programImageTitle = linkImageLogoOMN;
                        formData.videoThumbnail = linkImageLogoOMN;
                        formData.programImagex1 = linkImageLogoOMN;
                        formData.programImagex2 = linkImageLogoOMN;
                        formData.programImageTitleResize1 = linkImageLogoOMN;
                        formData.programImageTitleResize2 = linkImageLogoOMN;
                    }

                    await dataOld
                        .updateOne({
                            ...formData,
                            programDisplay: false,
                        })
                        .session(session);

                    await historyEditProgramService.findNewestAndUpdateStatusHistoryEdit(
                        response,
                        session,
                        dataOldJson,
                        constants.PROGRAM_STATUS.DELETE
                    );

                    await session.commitTransaction();
                    session.endSession();
                    return logger.status200Msg(
                        response,
                        system.success,
                        uploadConstant.msgUpdateUpload(paramsData.id)
                    );
                    break;
                case constants.PROGRAM_STATUS.INSTANT:
                    //program must achieve approve status then program must have instant status
                    if (
                        dataOldJson.programCurrentStatus ===
                        constants.PROGRAM_STATUS.DENIAL
                    ) {
                        session.endSession();
                        return logger.status400(
                            response,
                            uploadConstant.errorUpdate,
                            errors
                        );
                    }

                    formData.programDisplay = true;
                    await dataOld.updateOne(formData).session(session);

                    // Check type is Season
                    if (dataOldJson.programTypeVideo === constants.TYPE_VIDEO.SS) {
                        // Update parent to approval
                        const parent = await programModel.findById(
                            dataOld.programChildrenSeasonData.parentID
                        );

                        if (parent) {
                            let episodeDeleted = [];

                            // If all episode deleted has approval => parent display in online
                            parent.programSeasonData.forEach((item) => {
                                if (
                                    item.seasonName ===
                                    dataOld.programChildrenSeasonData.seasonName
                                ) {
                                    episodeDeleted = item.episodeDeleted
                                        ? _.differenceWith(
                                              item.episodeDeleted,
                                              [dataOld._id],
                                              _.isEqual
                                          )
                                        : [];

                                    item.episodeDeleted = episodeDeleted;
                                }
                            });

                            if (!episodeDeleted.length) {
                                parent.programCurrentStatus =
                                    constants.PROGRAM_STATUS.APPROVAL;
                                parent.programDisplay = true;
                            }
                            await parent.save({ session });

                            await programService.editOtherProgram(
                                parent,
                                dataOldJson,
                                session
                            );
                        }

                        // Socket for episode
                        adminService.notiStatusEpisodeOffline(dataOld, status);
                    }

                    await historyEditProgramService.findNewestAndUpdateStatusHistoryEdit(
                        response,
                        session,
                        dataOldJson,
                        constants.PROGRAM_STATUS.INSTANT
                    );
                    await session.commitTransaction();
                    session.endSession();
                    PushNotificationController.pushNotificationNewProgram(dataOld, user);

                    return logger.status200Msg(
                        response,
                        system.success,
                        uploadConstant.msgUpdateUpload(paramsData.id)
                    );
                    break;
                case constants.PROGRAM_STATUS.APPROVAL:
                    if (
                        [
                            constants.PROGRAM_STATUS.UPLOAD,
                            constants.PROGRAM_STATUS.REVIEW,
                            constants.PROGRAM_STATUS.EDIT,
                            // constants.PROGRAM_STATUS.DENIAL,
                        ].includes(dataOldJson.programCurrentStatus)
                    ) {
                        await dataOld.updateOne(formData).session(session);

                        // Check type is Season
                        if (dataOldJson.programTypeVideo === constants.TYPE_VIDEO.SS) {
                            // Update parent to approval
                            const parent = await programModel.findById(
                                dataOld.programChildrenSeasonData.parentID
                            );

                            if (parent) {
                                let episodeDeleted = [];

                                // If all episode deleted has approval => parent display in online
                                parent.programSeasonData.forEach((item) => {
                                    if (
                                        item.seasonName ===
                                        dataOld.programChildrenSeasonData.seasonName
                                    ) {
                                        episodeDeleted = item.episodeDeleted
                                            ? _.differenceWith(
                                                  item.episodeDeleted,
                                                  [dataOld._id],
                                                  _.isEqual
                                              )
                                            : [];

                                        item.episodeDeleted = episodeDeleted;
                                    }
                                });

                                if (!episodeDeleted.length) {
                                    parent.programCurrentStatus =
                                        constants.PROGRAM_STATUS.APPROVAL;
                                }
                                await parent.save({ session });

                                await programService.editOtherProgram(
                                    parent,
                                    dataOldJson,
                                    session
                                );
                            }

                            // Socket for episode
                            adminService.notiStatusEpisodeOffline(dataOld, status);
                        }

                        await historyEditProgramService.findNewestAndUpdateStatusHistoryEdit(
                            response,
                            session,
                            dataOldJson,
                            constants.PROGRAM_STATUS.APPROVAL
                        );
                        await session.commitTransaction();
                        session.endSession();

                        return logger.status200Msg(
                            response,
                            system.success,
                            uploadConstant.msgUpdateUpload(paramsData.id)
                        );
                    } else {
                        session.endSession();
                        return logger.status400(
                            response,
                            uploadConstant.errorUpdate,
                            errors
                        );
                    }
                    break;
                case constants.PROGRAM_STATUS.OMN:
                    if (
                        [
                            constants.PROGRAM_STATUS.UPLOAD,
                            constants.PROGRAM_STATUS.REVIEW,
                            constants.PROGRAM_STATUS.APPROVAL,
                            constants.PROGRAM_STATUS.EDIT,
                        ].includes(dataOldJson.programCurrentStatus)
                    ) {
                        await dataOld.updateOne(formData).session(session);

                        // Check type is Season
                        if (dataOldJson.programTypeVideo === constants.TYPE_VIDEO.SS) {
                            // Update parent to approval
                            const parent = await programModel.findById(
                                dataOld.programChildrenSeasonData.parentID
                            );

                            if (parent) {
                                let episodeDeleted = [];

                                // If all episode deleted has approval => parent display in online
                                parent.programSeasonData.forEach((item) => {
                                    if (
                                        item.seasonName ===
                                        dataOld.programChildrenSeasonData.seasonName
                                    ) {
                                        episodeDeleted = item.episodeDeleted
                                            ? _.differenceWith(
                                                  item.episodeDeleted,
                                                  [dataOld._id],
                                                  _.isEqual
                                              )
                                            : [];

                                        item.episodeDeleted = episodeDeleted;
                                    }
                                });

                                if (!episodeDeleted.length) {
                                    parent.programCurrentStatus =
                                        constants.PROGRAM_STATUS.APPROVAL;
                                }
                                await parent.save({ session });

                                await programService.editOtherProgram(
                                    parent,
                                    dataOldJson,
                                    session
                                );
                            }

                            // Socket for episode
                            adminService.notiStatusEpisodeOffline(dataOld, status);
                        }

                        await historyEditProgramService.findNewestAndUpdateStatusHistoryEdit(
                            response,
                            session,
                            dataOldJson,
                            constants.PROGRAM_STATUS.OMN
                        );

                        await session.commitTransaction();
                        session.endSession();
                        return logger.status200Msg(
                            response,
                            system.success,
                            uploadConstant.msgUpdateUpload(paramsData.id)
                        );
                    } else {
                        session.endSession();
                        return logger.status400(
                            response,
                            uploadConstant.errorUpdate,
                            errors
                        );
                    }
                    break;
                default:
                    session.endSession();
                    return logger.status400(response, uploadConstant.errorUpdate, errors);
                    break;
            }
        } catch (error) {
            console.log('400 - error', error);
            await session.abortTransaction();
            session.endSession();
            errors.push(error.message);
            return logger.status400(response, error, errors, system.error);
        }
    }

    async view(request, response, next) {
        const params = request.params;
        const errors = [];
        let session = await mongoose.startSession();
        session.startTransaction();

        try {
            let programUpload = await programModel.findOne({
                _id: params.id,
            });

            if (!programUpload) {
                session.endSession();
                return logger.status404(
                    response,
                    system.error,
                    uploadConstant.notFound(params.id)
                );
            } else {
                let date = new Date();
                let month = date.getMonth() + 1;
                let year = date.getFullYear();
                if (programUpload.programView) {
                    if (
                        programUpload.programView[year] &&
                        programUpload.programView[year][0][month]
                    ) {
                        programUpload.programView[year][0][month]['view'] += 1;
                    } else {
                        if (programUpload.programView[year]) {
                            programUpload.programView[year][0][month] = {
                                view: 1,
                                basic: 0,
                                standard: 0,
                                premium: 0,
                            };
                        } else {
                            programUpload.programView[year] = [
                                {
                                    [month]: {
                                        view: 1,
                                        basic: 0,
                                        standard: 0,
                                        premium: 0,
                                    },
                                },
                            ];
                        }
                    }
                } else {
                    programUpload.programView = {
                        [year]: [
                            {
                                [month]: {
                                    view: 1,
                                    basic: 0,
                                    standard: 0,
                                    premium: 0,
                                },
                            },
                        ],
                    };
                }

                if (programUpload.programView) {
                    let total = 0;
                    Object.entries(programUpload.programView).forEach(([v, va]) => {
                        Object.entries(va).forEach(([i, vals]) => {
                            Object.entries(vals).forEach(([o, number]) => {
                                if (number.view) {
                                    total += number.view;
                                }
                            });
                        });
                    });
                    programUpload.programTotalView = total;
                } else {
                    programUpload.programTotalView = 0;
                }

                const newUpdate = new programModel(programUpload);
                await newUpdate.save({ session: session });
                await session.commitTransaction();
                session.endSession();
                return logger.status200(response, system.success, '', programUpload);
            }
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            errors.push(error.message);
            return logger.status400(response, error, errors);
        }
    }

    // [GET] /admin/upload/status
    async statusAll(request, response, next) {
        const errors = [];
        try {
            const query = {};
            if (request.query.date) {
                query['updatedAt'] = {
                    $gte: new Date(request.query.date + ' 00:00:00').toUTCString(),
                    $lte: new Date(request.query.date + ' 23:59:59').toUTCString(),
                };
            }
            const arrStatus = Object.values(constants.PROGRAM_STATUS);
            const result = await Promise.all(
                [...arrStatus, 'total'].map(async (status) => {
                    const currentStatus = status;
                    if (status === 'total') status = /.*/;
                    return {
                        [currentStatus]: await programModel.countDocuments({
                            programType: constants.PROGRAM_TYPE.UPLOAD,
                            deleted: false,
                            programCurrentStatus: status,
                            ...query,
                            programSeasonChild: true,
                            isPending: false,
                        }),
                    };
                })
            );

            const data = Object.assign(...result);
            return logger.status200(response, system.success, '', data);
        } catch (error) {
            errors.push(error.message);
            return logger.status500(response, error, errors);
        }
    }

    async update(request, response, next) {
        const formData = request.body;
        const params = request.params;
        let session = await mongoose.startSession();
        session.startTransaction();

        const errors = [];
        try {
            if (formData.programElement || programElement.videoRank) {
                formData.isEditRating = true;
            }
            const upload = await programModel
                .updateOne(
                    {
                        _id: params.id,
                    },
                    {
                        ...formData,
                    }
                )
                .session(session);

            await session.commitTransaction();
            session.endSession();

            const dataUpload = await programModel.findOne({ _id: params.id });

            return logger.status200(
                response,
                system.success,
                uploadConstant.msgUpdateUpload(params.id),
                dataUpload
            );
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            errors.push(error.message);
            return logger.status400(response, error, errors);
        }
    }

    // [GET] /admin/upload/list-delete
    async listDelete(request, response, next) {
        const errors = [];
        const selectFields = [
            'programName',
            'programCurrentStatus',
            'createdAt',
            'updatedAt',
            'isResultLetter',
        ];
        try {
            request.query.programType = constants.PROGRAM_TYPE.UPLOAD;
            request.query.deleted = false;
            request.query.programCurrentStatus = constants.PROGRAM_STATUS.DELETE;

            if (request.query.id) {
                const users = await userModel.distinct('_id', {
                    userEmail: new RegExp(request.query.id, 'i'),
                });
                request.query.userID = { $in: users };
            }
            delete request.query.id;
            const uploadDel = await businessQuery.handle(
                programModel,
                request,
                { path: 'userID', select: ['userName', 'userEmail'] },
                selectFields
            );

            return logger.status200(response, system.success, '', uploadDel);
        } catch (error) {
            errors.push(error.message);
            return logger.status500(response, error, errors);
        }
    }

    // [GET] /admin/upload/list-soft-delete
    async listSoftDelete(request, response, next) {
        const errors = [];
        const selectFields = [
            'programName',
            'programCurrentStatus',
            'createdAt',
            'updatedAt',
            'isResultLetter',
        ];
        try {
            request.query.programType = constants.PROGRAM_TYPE.UPLOAD;
            request.query.deleted = true;
            request.query.programCurrentStatus = constants.PROGRAM_STATUS.DELETE;
            const uploadDel = await businessQuery.handle(
                programModel,
                request,
                { path: 'userID', select: ['userName', 'userEmail'] },
                selectFields
            );

            return logger.status200(response, system.success, '', uploadDel);
        } catch (error) {
            errors.push(error.message);
            return logger.status500(response, error, errors);
        }
    }

    // [POST] /admin/upload/history/:id
    async addHistory(request, response, next) {
        const formData = request.body;
        const params = request.params;
        const user = request.user;
        let session = await mongoose.startSession();
        session.startTransaction();
        const errors = [];
        try {
            if (
                !formData.status ||
                !Object.values(constants.HISTORY_STATUS).includes(formData.status)
            ) {
                session.endSession();
                return logger.status400(response, system.statusInvalid, errors);
            }
            const checkProgram = await programModel.findById(params.id);

            if (!checkProgram) {
                return logger.status404(
                    response,
                    false,
                    system.notFoundProgram(params.id)
                );
            }

            if (checkProgram.programTypeVideo === constants.TYPE_VIDEO.SS) {
                formData.programParentID =
                    checkProgram?.programChildrenSeasonData?.parentID || undefined;

                if(checkProgram?.programChildrenSeasonData?.parentID){

                    let checkParentProgram = await programModel.findById(
                        checkProgram.programChildrenSeasonData.parentID
                    );
    
                    if (checkParentProgram.isResultLetter === false) {
                        checkParentProgram.isResultLetter = true;
                        await checkParentProgram.save({ session: session });
                    }
                }
            }

            const history = new HistoryProgramModel({
                manager: user._id,
                managerName: user.userName,
                programID: params.id,
                receiverID: checkProgram.userID || undefined,
                typeProgram: constants.TYPE_PROGRAM_HISTORY.UPLOAD,
                ...formData,
            });
            await history.save({ session: session });

            if (checkProgram.isResultLetter === false) {
                checkProgram.isResultLetter = true;
                await checkProgram.save({ session: session });
            }

            const dataProgram = await programModel.findOne({ _id: params.id }).populate({
                path: 'userID',
            });

            // let dataSendEmail = {
            //     programTitle: dataProgram.programName,
            //     programCurrentStatus: dataProgram.programCurrentStatus,
            //     message: formData.content,
            //     subject: emailConstant.GET_SUBJECT_EMAIL(
            //         dataProgram.programCurrentStatus,
            //         dataProgram.programName,
            //         dataProgram.programType
            //     ),
            // };

            await PushNotificationController.pushNotificationChangeStatus(
                dataProgram,
                user,
                formData.title,
                formData.content,
                history,
                session
            );
            // if (dataProgram.userID && dataProgram.userID.userEmail) {
            //     sendEmail.sendEmailChangeStatusProgram(
            //         '',
            //         dataProgram.userID.userEmail,
            //         dataSendEmail
            //     );
            // }
            await session.commitTransaction();
            session.endSession();
            return logger.status200(
                response,
                system.success,
                system.addSuccessHistory,
                history
            );
        } catch (error) {
            console.log('400 - error', error);
            await session.abortTransaction();
            session.endSession();
            errors.push(error.message);
            return logger.status400(response, error, errors);
        }
    }

    // [GET] /admin/upload/history/:id
    async getHistory(request, response, next) {
        const params = request.params;
        const errors = [];
        try {
            const checkProgram = await programModel.findById(params.id);

            if (!checkProgram) {
                return logger.status404(
                    response,
                    false,
                    system.notFoundProgram(params.id)
                );
            }

            if (
                checkProgram.programTypeVideo === constants.TYPE_VIDEO.SS &&
                !checkProgram.programSeasonChild &&
                checkProgram.verifyDenial === null
            ) {
                request.query.programParentID = params.id;
            } else {
                request.query.programID = params.id;
            }

            if (request.query.status === constants.HISTORY_TYPE.DELETE) {
                request.query.status = constants.HISTORY_TYPE.DELETE;
            } else if (request.query.status === constants.HISTORY_TYPE.NOT_DELETE) {
                request.query.status = {
                    $ne: constants.HISTORY_TYPE.DELETE,
                };
            }

            const histories = await businessQuery.handle(HistoryProgramModel, request);
            return logger.status200(response, system.success, '', histories);
        } catch (error) {
            errors.push(error.message);
            return logger.status400(response, error, errors);
        }
    }

    // [GET] /admin/upload/history-newest/:id
    async getHistoryNewest(request, response, next) {
        const params = request.params;
        const errors = [];
        try {
            const checkProgram = await programModel.findById(params.id);
            if (!checkProgram) {
                return logger.status404(
                    response,
                    false,
                    system.notFoundProgram(params.id)
                );
            }

            if (
                checkProgram.programTypeVideo === constants.TYPE_VIDEO.SS &&
                !checkProgram.programSeasonChild &&
                checkProgram.verifyDenial === null
            ) {
                request.query.programParentID = params.id;
            } else {
                request.query.programID = params.id;
            }

            if (request.query.status === constants.HISTORY_TYPE.DELETE) {
                request.query.status = constants.HISTORY_TYPE.DELETE;
            } else if (request.query.status === constants.HISTORY_TYPE.NOT_DELETE) {
                request.query.status = {
                    $ne: constants.HISTORY_TYPE.DELETE,
                };
            }

            const history = await HistoryProgramModel.findOne({
                ...request.query,
            }).sort({
                createdAt: -1,
            });

            return logger.status200(response, system.success, '', history);
        } catch (error) {
            errors.push(error.message);
            return logger.status400(response, error, errors);
        }
    }

    // [GET] /admin/upload/program-add-list
    async programAddList(request, response, next) {
        const errors = [];
        request.query.programType = constants.PROGRAM_TYPE.UPLOAD;
        request.query.programDisplay = true;
        request.query.deleted = false;

        const selectFields = [
            'programName',
            'programCategory.categoryManageId',
            'programTotalView',
        ];
        try {
            if (request.query.category) {
                request.query['programCategory.categoryManageId'] =
                    request.query.category;
            }
            if (request.query.tag) {
                request.query['programCategory.categoryArrayTag'] = request.query.tag;
            }
            delete request.query.category;
            delete request.query.tag;
            Object.assign(request.query, programConstant.FIELD_QUERY_DEFAULT);

            const result = await businessQuery.handle(
                programModel,
                request,
                {
                    path: 'programCategory.categoryManageId',
                    select: 'categoryMangeName',
                },
                selectFields
            );

            const data = JSON.parse(JSON.stringify(result));
            await Promise.all(
                data.docs.map((item) => {
                    item.playedMinutes = 0;
                })
            );
            return logger.status200(response, system.success, '', data);
        } catch (error) {
            errors.push(error.message);
            return logger.status500(response, error, errors, system.error);
        }
    }

    // [GET] /admin/challenger/episodes
    async getEpisodes(request, response, next) {
        const params = request.query;
        const errors = [];
        try {
            if (!params.programID || !params.seasonID) {
                return logger.status404(response, false, system.missingField);
            }
            const program = await programModel.findOne({
                _id: params.programID,
                programType: constants.PROGRAM_TYPE.UPLOAD,
            });
            if (!program) {
                return logger.status404(
                    response,
                    false,
                    system.notFoundProgram(params.programID)
                );
            }
            const result = program.programSeasonData.find(
                (item) => item._id && item._id.toString() === params.seasonID
            );
            if (!result) {
                return logger.status404(response, false, system.notFoundSeasonID);
            }
            return logger.status200(response, system.success, '', result.seasonEpisode);
        } catch (error) {
            errors.push(error.message);
            return logger.status400(response, error, errors);
        }
    }

    // [GET] /admin/upload/children/:id
    async getListChildren(request, response, next) {
        const params = request.params;
        const errors = [];
        try {
            request.query.programType = constants.PROGRAM_TYPE.UPLOAD;
            request.query.deleted = false;
            request.query.programChildrenSeasonData.parentID = params.id;
            request.query.programSeasonChild = true;
            const selectFields = [
                'programName',
                'programCurrentStatus',
                'createdAt',
                'updatedAt',
                'isResultLetter',
                'programChildrenSeasonData',
            ];
            const arrayChallenger = await businessQuery.handle(
                programModel,
                request,
                [{ path: 'userID', select: ['userName', 'userEmail'] }],
                selectFields
            );
            return logger.status200(response, system.success, '', arrayChallenger);
        } catch (error) {
            errors.push(error.message);
            return logger.status400(response, error, errors);
        }
    }
}

module.exports = new UploadController();
