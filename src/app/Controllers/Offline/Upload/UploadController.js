const programModel = require('../../../Models/Program/ProgramModel');
const programEditModel = require('../../../Models/ProgramEdit/ProgramEditModel');
const historyProgramModel = require('../../../Models/Program/HistoryProgramModel');
const historyEditProgramModel = require('../../../Models/Program/HistoryEditProgramModel');

const system = require('../../../Constant/General/SystemConstant');
const uploadConstant = require('../../../Constant/Upload/UploadConstant');
const logger = require('../../../Constant/Logger/loggerConstant');
const businessQuery = require('../../../Business/QueryModel');
const mongoose = require('mongoose');
const constants = require('../../../Constant/constants');
const common = require('../../../Service/common');
const programConstant = require('../../../Constant/Program/ProgramConstant');
const historyEditProgramService = require('../../../Service/HistoryEditProgram/HistoryEditProgramService');
const convertImageJobs = require('../../../Jobs/ConvertImageJobs');
const moment = require('moment-timezone');
const messageModel = require('../../../Models/Message/MessageModel');
const s3Service = require('../../../Service/S3/S3Service');
const userPushNotificationModel = require('../../../Models/Push/UserPushNotificationModel');

const _ = require('lodash');

class UploadController {
    // [GET] /admin/upload/
    async index(request, response, next) {
        const userData = request.user;
        const errors = [];
        try {
            request.query.programType = constants.PROGRAM_TYPE.UPLOAD;
            request.query.userID = userData._id;
            request.query.deleted = false;

            Object.assign(request.query, programConstant.FIELD_QUERY_DEFAULT);
            let arrayUpload = await businessQuery.handle(programModel, request, {
                path: 'programSeasonData.episode',
                match: {
                    deleted: false,
                },
            });

            arrayUpload = JSON.parse(JSON.stringify(arrayUpload));
            arrayUpload.docs.forEach((item) => {
                if (item.programTypeVideo === constants.TYPE_VIDEO.SS) {
                    item?.programSeasonData?.forEach((ss) => {
                        ss.episode =
                            ss?.episode?.reduce((newArr, ep) => {
                                newArr.push(ep._id);
                                return newArr;
                            }, []) || [];
                    });
                }
            });

            return logger.status200(response, system.success, '', arrayUpload);
        } catch (error) {
            errors.push(error.message);
            return logger.status500(response, error, errors);
        }
    }

    // [GET] /admin/upload/my-program
    async myProgram(request, response, next) {
        const userData = request.user;
        const errors = [];
        try {
            request.query.programType = constants.PROGRAM_TYPE.UPLOAD;
            request.query.userID = userData._id;
            request.query.deleted = false;
            request.query.programCurrentStatus = { $ne: constants.PROGRAM_STATUS.DELETE };

            Object.assign(request.query, programConstant.FIELD_QUERY_DEFAULT);

            const relation = {
                path: 'programSeasonData.episode',
                match: {
                    // programCurrentStatus: { $ne: constants.PROGRAM_STATUS.DELETE },
                    deleted: false,
                },
            };
            let programs = await businessQuery.handle(programModel, request, relation);

            programs = JSON.parse(JSON.stringify(programs));

            programs.docs = programs.docs.filter((program) => {
                let check = false;
                if (program.programTypeVideo === constants.TYPE_VIDEO.SS) {
                    program.programSeasonData.forEach((item) => {
                        if (item.episode.length) {
                            check = true;
                        }
                    });
                } else {
                    check = true;
                }

                return check;
            });
            return logger.status200(response, system.success, '', programs);
        } catch (error) {
            errors.push(error.message);
            return logger.status500(response, error, errors);
        }
    }

    // [GET] /admin/upload/:id
    async detail(request, response, next) {
        const paramsData = request.params;
        const userData = request.user;
        const errors = [];
        const result = {
            isProgram: false,
            isBackupData: false,
            data: '',
        };

        const fieldsSelect = [
            'deleted',
            'programCurrentStatus',
            'videoThumbnail',
            'programChildrenSeasonData.seasonName',
            'programChildrenSeasonData.episodeName',
            'programChildrenSeasonData.episodeSummary',
            'programChildrenSeasonData.linkVideo',
            'programVideoSetting',
            'programThumbnail',
        ];
        try {
            let upload = await programModel
                .findOne({
                    _id: paramsData.id,
                    userID: userData._id,
                })
                .populate({
                    path: 'programSeasonData.episode',
                    select: fieldsSelect,
                    match: {
                        // programCurrentStatus: { $ne: constants.PROGRAM_STATUS.DELETE },
                        deleted: false,
                    },
                })
                .lean();

            if (!upload) {
                return logger.status404(
                    response,
                    system.error,
                    uploadConstant.notFound(paramsData.id)
                );
            }

            if (upload.isEdit) {
                let uploadProgram = await programEditModel
                    .findOne({
                        programID: paramsData.id,
                        userID: userData._id,
                        deleted: false,
                    })
                    .populate({
                        path: 'programSeasonData.episode',
                        select: fieldsSelect,
                        match: {
                            // programCurrentStatus: { $ne: constants.PROGRAM_STATUS.DELETE },
                            deleted: false,
                        },
                    })
                    .lean();

                const uploadParent = await programModel
                    .findOne({
                        _id: upload.programChildrenSeasonData.parentID,
                        userID: userData._id,
                        deleted: false,
                    })
                    .populate({
                        path: 'programSeasonData.episode',
                        select: fieldsSelect,
                        match: {
                            // programCurrentStatus: { $ne: constants.PROGRAM_STATUS.DELETE },
                            deleted: false,
                        },
                    })
                    .lean();
                if (!_.isEmpty(uploadProgram.historyEditProgramID)) {
                    result.isBackupData = true;
                }
                result.isProgram = true;

                const uploadProgramSeasonData = JSON.parse(
                    JSON.stringify(uploadParent.programSeasonData)
                );
                uploadProgramSeasonData.forEach((season) => {
                    season.episode = season.episode.map((episode) => {
                        return {
                            ...episode.programChildrenSeasonData,
                            _id: episode._id,
                            videoThumbnail: episode.videoThumbnail,
                        };
                    });
                });
                uploadProgram = JSON.parse(JSON.stringify(uploadProgram));
                uploadProgram.programSeasonData = uploadProgramSeasonData;
                uploadProgram._id = paramsData.id;
                result.data = uploadProgram;
            } else {
                if (!_.isEmpty(upload.historyEditProgramID)) {
                    result.isBackupData = true;
                }

                if (upload.programSeasonChild) {
                    const uploadParent = await programModel
                        .findOne({
                            _id: upload.programChildrenSeasonData.parentID,
                            userID: userData._id,
                            deleted: false,
                        })
                        .populate({
                            path: 'programSeasonData.episode',
                            select: fieldsSelect,
                            match: {
                                // programCurrentStatus: { $ne: constants.PROGRAM_STATUS.DELETE },
                                deleted: false,
                            },
                        })
                        .lean();

                    const uploadParentSeasonData = JSON.parse(
                        JSON.stringify(uploadParent.programSeasonData)
                    );
                    uploadParentSeasonData.forEach((season) => {
                        season.episode = season.episode.map((episode) => {
                            return {
                                ...episode.programChildrenSeasonData,
                                _id: episode._id,
                                videoThumbnail: episode.videoThumbnail,
                            };
                        });
                    });
                    result.data = JSON.parse(JSON.stringify(upload));
                    result.data.programSeasonData = uploadParentSeasonData;
                } else {
                    result.data = JSON.parse(JSON.stringify(upload));
                    result.data.programSeasonData.forEach((season) => {
                        season.episode = season.episode.map((episode) => {
                            return {
                                ...episode.programChildrenSeasonData,
                                _id: episode._id,
                                videoThumbnail: episode.videoThumbnail,
                            };
                        });
                    });
                }
            }

            const historyID = await historyProgramModel
                .findOne({
                    programID: result.data._id,
                    status: constants.HISTORY_STATUS.DENIAL,
                })
                .sort({ createdAt: -1 });

            result.data.historyID = historyID?._id;
            return logger.status200(response, system.success, '', result);
        } catch (error) {
            errors.push(error.message);
            return logger.status400(response, error, errors);
        }
    }

    // [GET] /admin/upload/detail-program-omner/:id
    async detailProgramOMNEr(request, response, next) {
        const paramsData = request.params;
        const userData = request.user;
        const errors = [];
        const result = {
            isProgram: false,
            isBackupData: false,
            data: '',
        };

        const fieldsSelect = [
            'deleted',
            'programCurrentStatus',
            'videoThumbnail',
            'programChildrenSeasonData.seasonName',
            'programChildrenSeasonData.episodeName',
            'programChildrenSeasonData.episodeSummary',
            'programChildrenSeasonData.linkVideo',
            'programVideoSetting',
            'programThumbnail',
        ];
        try {
            let upload = await programModel
                .findOne({
                    _id: paramsData.id,
                    userID: userData._id,
                })
                .populate({
                    path: 'programSeasonData.episode',
                    select: fieldsSelect,
                    match: {
                        deleted: false,
                    },
                })
                .lean();

            if (!upload) {
                return logger.status404(
                    response,
                    system.error,
                    uploadConstant.notFound(paramsData.id)
                );
            }

            if (upload.isEdit) {
                let uploadProgram = await programEditModel
                    .findOne({
                        programID: paramsData.id,
                        userID: userData._id,
                        deleted: false,
                    })
                    .populate({
                        path: 'programSeasonData.episode',
                        select: fieldsSelect,
                        match: {
                            deleted: false,
                        },
                    })
                    .lean();

                const uploadParent = await programModel
                    .findOne({
                        _id: upload.programChildrenSeasonData.parentID,
                        userID: userData._id,
                        deleted: false,
                    })
                    .populate({
                        path: 'programSeasonData.episode',
                        select: fieldsSelect,
                        match: {
                            deleted: false,
                        },
                    })
                    .lean();
                if (!_.isEmpty(uploadProgram.historyEditProgramID)) {
                    result.isBackupData = true;
                }
                result.isProgram = true;

                const uploadProgramSeasonData = JSON.parse(
                    JSON.stringify(uploadParent.programSeasonData)
                );
                uploadProgramSeasonData.forEach((season) => {
                    season.episode = season.episode.map((episode) => {
                        return {
                            ...episode.programChildrenSeasonData,
                            _id: episode._id,
                            videoThumbnail: episode.videoThumbnail,
                        };
                    });
                });
                uploadProgram = JSON.parse(JSON.stringify(uploadProgram));
                uploadProgram.programSeasonData = uploadProgramSeasonData;
                uploadProgram._id = paramsData.id;
                result.data = uploadProgram;
            } else {
                if (!_.isEmpty(upload.historyEditProgramID)) {
                    result.isBackupData = true;
                }

                if (upload.programSeasonChild) {
                    const uploadParent = await programModel
                        .findOne({
                            _id: upload.programChildrenSeasonData.parentID,
                            userID: userData._id,
                            deleted: false,
                        })
                        .populate({
                            path: 'programSeasonData.episode',
                            select: fieldsSelect,
                            match: {
                                deleted: false,
                            },
                        })
                        .lean();

                    const uploadParentSeasonData = JSON.parse(
                        JSON.stringify(uploadParent.programSeasonData)
                    );
                    uploadParentSeasonData.forEach((season) => {
                        season.episode = season.episode.map((episode) => {
                            return {
                                ...episode.programChildrenSeasonData,
                                _id: episode._id,
                                videoThumbnail: episode.videoThumbnail,
                            };
                        });
                    });
                    result.data = JSON.parse(JSON.stringify(upload));
                    result.data.programSeasonData = uploadParentSeasonData;
                } else {
                    result.data = JSON.parse(JSON.stringify(upload));
                    result.data.programSeasonData.forEach((season) => {
                        season.episode = season.episode.map((episode) => {
                            return {
                                ...episode.programChildrenSeasonData,
                                _id: episode._id,
                                videoThumbnail: episode.videoThumbnail,
                            };
                        });
                    });
                }
            }
            const historyID = await historyProgramModel
                .findOne({
                    programID: result.data._id,
                    status: constants.HISTORY_STATUS.DENIAL,
                })
                .sort({ createdAt: -1 });

            result.data.historyID = historyID?._id;
            return logger.status200(response, system.success, '', result);
        } catch (error) {
            errors.push(error.message);
            return logger.status400(response, error, errors);
        }
    }

    // [POST] /offline/upload/create
    async create(request, response, next) {
        const formData = request.body;
        const userData = request.user;
        const errors = [];
        formData.programType = constants.PROGRAM_TYPE.UPLOAD;
        formData.programCurrentStatus = constants.PROGRAM_STATUS.UPLOAD;
        formData.isPending = common.checkPendingProgram();

        const time = moment().tz('Asia/Seoul').format('yyyy-MM-DD HH:mm:ss');
        let session = await mongoose.startSession();
        session.startTransaction();

        try {
            // let urlArray = '';
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

            // // resize image of poster
            // if (formData.programImagePoster) {
            //     //453x752
            //     urlArray = await imgResize.resizeOptimizeUrl(
            //         formData.programImagePoster,
            //         448,
            //         252,
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
            // Create slug for program
            let checkDaplicate = {};
            while (checkDaplicate) {
                formData.slugName = common.generateSlug(formData.programName);
                checkDaplicate = await programModel.findOne({
                    slugName: formData.slugName,
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

                // Parent null or type = child
                if (!parent || parent.programSeasonChild) {
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
                // create parent data
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
                        item.seasonName ===
                        formData?.programChildrenSeasonData?.seasonName
                    ) {
                        formData.programChildrenSeasonData.seasonID = item._id;
                        // IF formData._id exist
                        if (formData._id) {
                            const idChild = formData._id;
                            delete formData._id;
                            formData.drmConvertError = false;
                            formData.flagDRM = false;
                            formData.linkVideoDRM = null;
                            formData.linkVideoConvert = null;

                            // Check formData._id exist in season
                            if (!item.episode.includes(idChild)) {
                                return logger.status404(
                                    response,
                                    system.error,
                                    uploadConstant.notFound(idChild)
                                );
                            }
                            const checkChildren = await programModel.findById(idChild);

                            // Check formData._id exist in db
                            if (!checkChildren) {
                                return logger.status404(
                                    response,
                                    system.error,
                                    uploadConstant.notFound(idChild)
                                );
                            }
                            // Update status to upload if child was delete

                            let dataUpdate = {};
                            if (
                                checkChildren.programCurrentStatus ===
                                constants.PROGRAM_STATUS.DELETE
                            ) {
                                dataUpdate = {
                                    ...formData,
                                    programCurrentStatus: constants.PROGRAM_STATUS.UPLOAD,
                                };
                            } else {
                                dataUpdate = formData;
                            }
                            children = await programModel
                                .findByIdAndUpdate(idChild, dataUpdate)
                                .session(session);
                        } else {
                            // Create new children
                            children = new programModel({
                                ...formData,
                                userID: userData._id,
                            });
                            await children.save({ session });

                            const index =
                                parseInt(children.programChildrenSeasonData.episodeName) -
                                    1 || -1;
                            item.episode.splice(index, 0, children._id);
                            // item.episode.push(children._id);
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
            let data = children || parent;
            data.historyEditProgramID = historyProgramEdit._id;

            await data.save({ session });

            // create message for admin when upload program upload
            // create message data for admin

            const title = constants.MESSAGE_TITLE.UPLOAD_REQUEST;
            const body = `${userData.userName ? userData.userName : userData.userEmail} 님

                          프로그램 ${
                              data.programName
                          }, 시즌 ‘X’ 에피소드 ‘X’의 업로드 신청이 완료되었습니다.${time}  업로드 신청 결과를 확인하실 수 있습니다.

                          감사합니다.
                         `;

            // create message for user in offline
            const userMessage = new historyProgramModel({
                manager: constants.DATA_SUPER_ADMIN.ID,
                managerName: constants.DATA_SUPER_ADMIN.EMAIL,
                status: constants.HISTORY_STATUS.UPLOAD,
                programID: data._id,
                programParentID: data.programSeasonChild
                    ? data.programChildrenSeasonData.parentID
                    : undefined,
                typeProgram: constants.TYPE_PROGRAM_HISTORY.UPLOAD,
                title: title,
                content: body,
                receiverID: userData._id || undefined,
            });
            await userMessage.save({ session });

            // send message for offline and admin
            await sendMessage(
                response,
                session,
                title,
                body,
                userData,
                data,
                userMessage
            );

            await session.commitTransaction();
            session.endSession();

            convertImageJobs.jobsConvert(children?._id, parent?._id);

            return logger.status201(response, children || parent);
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            errors.push(error.message);
            return logger.status400(response, error, errors);
        }
    }

    // [PUT] /offline/upload/update
    async update(request, response, next) {
        const formData = request.body;
        const userData = request.user;
        const params = request.params;
        let errors = [];

        formData.isPending = common.checkPendingProgram();
        let session = await mongoose.startSession();
        session.startTransaction();

        try {
            formData.programCurrentStatus = constants.PROGRAM_STATUS.UPLOAD;

            const upload = await programModel.findById({
                _id: params.id,
                programType: constants.PROGRAM_TYPE.UPLOAD,
                programCurrentStatus: constants.PROGRAM_STATUS.EDIT,
                userID: userData._id,
                deleted: false,
            });
            const uploadProgram = await programEditModel.findOne({
                programID: params.id,
                programType: constants.PROGRAM_TYPE.UPLOAD,
                programCurrentStatus: constants.PROGRAM_STATUS.EDIT,
                userID: userData._id,
                deleted: false,
            });

            if (!uploadProgram) {
                if (!upload) {
                    session.endSession();
                    return logger.status404(
                        response,
                        system.error,
                        uploadConstant.notFound(paramsData.id)
                    );
                }

                await upload.updateOne(formData).session(session);
                await session.commitTransaction();
                session.endSession();
                return logger.status200Msg(
                    response,
                    system.success,
                    uploadConstant.msgUpdateUpload(params.id)
                );
            } else {
                await uploadProgram.updateOne(formData).session(session);
                await session.commitTransaction();
                session.endSession();
                return logger.status200Msg(
                    response,
                    system.success,
                    uploadConstant.msgUpdateUpload(params.id)
                );
            }
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            errors.push(error.message);
            return logger.status500(response, error, errors);
        }
    }

    // [PUT] /offline/upload/:id
    async updateNewFlow(request, response, next) {
        const formData = request.body;
        const userData = request.user;
        const params = request.params;
        let errors = [];

        formData.isPending = common.checkPendingProgram();
        let session = await mongoose.startSession();
        session.startTransaction();

        let data = {
            editData: '',
            history: '',
        };
        try {
            const upload = await programModel.findById({
                _id: params.id,
                programType: constants.PROGRAM_TYPE.UPLOAD,
                userID: userData._id,
                deleted: false,
            });

            if (!upload) {
                session.endSession();
                return logger.status404(
                    response,
                    system.error,
                    uploadConstant.notFound(params.id)
                );
            }

            let uploadProgram = await programEditModel.findOne({
                programID: params.id,
                programType: constants.PROGRAM_TYPE.UPLOAD,
                programCurrentStatus: {
                    $in: [
                        constants.PROGRAM_STATUS.UPLOAD,
                        constants.PROGRAM_STATUS.EDIT,
                        constants.PROGRAM_STATUS.REVIEW,
                    ],
                },

                userID: userData._id,
                deleted: false,
            });

            const checkEdit = upload.isEdit;
            const programStatus = upload.programCurrentStatus;

            // default status is edit
            formData.programCurrentStatus = constants.PROGRAM_STATUS.EDIT;
            // increase times to edit
            formData.programEditor = upload.programEditor + 1;

            formData.isResultLetter = true;
            const time = moment().tz('Asia/Seoul').format('yyyy-MM-DD HH:mm:ss');
            const title = constants.MESSAGE_TITLE.EDIT_REQUEST_CONFIRM;
            const body = `${userData.userName ? userData.userName : userData.userEmail} 님

                          프로그램 ${upload.programName}, 요청하신 수정이 신청되었습니다. 
                        
                          ${time}  수정 신청 결과를 플랫폼 ‘옴넷’에서 확인하실 수 있습니다.

                          감사합니다.
                         `;
            // check program have exist in program edit table. if yes, program edited less than one time
            if (!uploadProgram && !checkEdit) {
                // case 1:  the first time to edit
                switch (programStatus) {
                    case constants.PROGRAM_STATUS.UPLOAD:
                    case constants.PROGRAM_STATUS.REVIEW:
                    case constants.PROGRAM_STATUS.DENIAL:
                    case constants.PROGRAM_STATUS.EDIT: {
                        const dataBackUp =
                            await historyEditProgramService.createHistoryEdit(
                                response,
                                session,
                                upload
                            );

                        // edit directly in program table
                        const successDataProgram = await saveProgram(
                            response,
                            session,
                            upload,
                            formData,
                            dataBackUp
                        );

                        // if type season, update status and isResultLetter of parent program
                        if (upload.programTypeVideo === constants.TYPE_VIDEO.SS) {
                            await updateParentProgram(response, session, upload);
                        }

                        // write action edit of program in history table
                        const successAddHistory = await addHistory(
                            response,
                            userData,
                            session,
                            successDataProgram,
                            ''
                        );

                        // send message for offline and admin
                        await sendMessage(
                            response,
                            session,
                            title,
                            body,
                            userData,
                            upload,
                            successAddHistory
                        );

                        await session.commitTransaction();
                        session.endSession();

                        data.editData = successDataProgram;
                        data.history = successAddHistory;

                        return logger.status200(
                            response,
                            system.success,
                            uploadConstant.msgUpdateUpload(params.id),
                            data
                        );
                        break;
                    }
                    case constants.PROGRAM_STATUS.OMN:
                    case constants.PROGRAM_STATUS.INSTANT:
                    case constants.PROGRAM_STATUS.APPROVAL: {
                        // must change flag isEdit from false to true to confirm which program is editing
                        upload.isEdit = true;
                        await upload.save({ session });

                        const uploadData = upload.toObject();

                        delete uploadData.isEdit;

                        // program have status upload when moving data in program edit table
                        formData.programCurrentStatus = constants.PROGRAM_STATUS.UPLOAD;

                        const keyData = Object.keys(formData);
                        // loop each key in array of formData and assign
                        keyData.forEach(
                            (update) => (uploadData[update] = formData[update])
                        );

                        uploadData.programID = uploadData._id;

                        // create data back up for program
                        const dataBackUp =
                            await historyEditProgramService.createApprovalProgramEditHistoryEdit(
                                response,
                                session,
                                uploadData
                            );

                        delete uploadData._id;
                        // assign id data back up in program
                        uploadData.historyEditProgramID = dataBackUp._id;

                        // case when program have status omn, instant, approval, we must move it through program edit table
                        const uploadProgramEdit = new programEditModel(uploadData);
                        uploadProgramEdit.createdAt = Date.now();
                        uploadProgramEdit.updatedAt = Date.now();
                        const successDataProgramEdit = await uploadProgramEdit.save(
                            session
                        );

                        // write action edit of program in history table
                        const successAddHistory = await addHistory(
                            response,
                            userData,
                            session,
                            '',
                            successDataProgramEdit
                        );

                        // send message for offline and admin
                        await sendMessage(
                            response,
                            session,
                            title,
                            body,
                            userData,
                            upload,
                            successAddHistory
                        );

                        await session.commitTransaction();
                        session.endSession();

                        data.history = successAddHistory;
                        data.editData = successDataProgramEdit;

                        return logger.status200(
                            response,
                            system.success,
                            uploadConstant.msgUpdateUpload(params.id),
                            data
                        );
                    }

                    default: {
                        return logger.status400(response, 'program was deleted', errors);
                    }
                }
            } else {
                if (!uploadProgram) {
                    return logger.status404(
                        response,
                        system.error,
                        uploadConstant.notFound(params.id)
                    );
                }

                // case2: from 2 edit times program, just change data in program edit table
                const programEditStatus = uploadProgram.programCurrentStatus;

                switch (programEditStatus) {
                    case constants.PROGRAM_STATUS.REVIEW:
                    case constants.PROGRAM_STATUS.UPLOAD:
                    case constants.PROGRAM_STATUS.EDIT: {
                        const dataBackUp =
                            await historyEditProgramService.createProgramEditHistoryEdit(
                                response,
                                session,
                                uploadProgram
                            );

                        // await this.saveProgramEdit(response, uploadProgram, formData);
                        const successProgramEdit = await saveProgramEdit(
                            response,
                            session,
                            uploadProgram,
                            formData,
                            dataBackUp
                        );

                        // write action edit of program in history table
                        const successAddHistory = await addHistory(
                            response,
                            userData,
                            session,
                            '',
                            successProgramEdit
                        );

                        // send message for offline and admin
                        await sendMessage(
                            response,
                            session,
                            title,
                            body,
                            userData,
                            upload,
                            successAddHistory
                        );

                        await session.commitTransaction();
                        session.endSession();

                        data.history = successAddHistory;
                        data.editData = successProgramEdit;
                        return logger.status200(
                            response,
                            system.success,
                            uploadConstant.msgUpdateUpload(upload._id),
                            data
                        );
                    }

                    default: {
                        return logger.status400(response, 'error', errors);
                        break;
                    }
                }
            }
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            errors.push(error.message);
            return logger.status500(response, error, errors);
        }
    }

    async returnOldData(request, response, next) {
        const userData = request.user;
        const params = request.params;
        let errors = [];

        let session = await mongoose.startSession();
        session.startTransaction();

        try {
            const oldVersion = await historyEditProgramService.findHistoryEdit(
                response,
                session,
                params.id
            );

            if (!oldVersion) {
                session.endSession();
                return logger.status404(
                    response,
                    system.error,
                    uploadConstant.notFoundOldVersion(params.id, oldVersion.programID)
                );
            }
            delete oldVersion.historyEditProgramID;
            delete oldVersion.programEditor;
            delete oldVersion.createdAt;
            delete oldVersion.updatedAt;
            oldVersion.isPending = common.checkPendingProgram();

            if (oldVersion.isProgramEdit) {
                const uploadProgram = await programEditModel.findOne({
                    programID: oldVersion.programID,
                    userID: userData._id,
                    deleted: false,
                });

                if (!uploadProgram) {
                    session.endSession();
                    return logger.status404(
                        response,
                        system.error,
                        uploadConstant.notFound(oldVersion.programID)
                    );
                }

                delete oldVersion._id;

                // get key in array formData
                // const keyData = Object.keys(oldVersion);

                // // loop each key in array of formData and assign
                // keyData.forEach((update) => {
                // 	return (uploadProgram[update] = oldVersion[update]);
                // });
                uploadProgram.programEditor = uploadProgram.programEditor + 1;

                const updateProgramEdit = await programEditModel
                    .updateOne(
                        { _id: uploadProgram._id },
                        {
                            ...oldVersion,
                            programEditor: uploadProgram.programEditor,
                        }
                    )
                    .session(session);

                // write action edit of program in history table
                await addHistoryEditRevert(
                    response,
                    userData,
                    session,
                    '',
                    updateProgramEdit
                );

                await session.commitTransaction();
                session.endSession();

                return logger.status200Msg(
                    response,
                    system.success,
                    uploadConstant.msgUpdateSuccess(params.id)
                );
            } else {
                const upload = await programModel.findOne({
                    _id: oldVersion.programID,
                    userID: userData._id,
                    deleted: false,
                });

                if (!upload) {
                    session.endSession();
                    return logger.status404(
                        response,
                        system.error,
                        uploadConstant.notFound(oldVersion.programID)
                    );
                }

                delete oldVersion._id;
                delete oldVersion.programID;
                // get key in array formData
                // const keyData = Object.keys(oldVersion);

                // // loop each key in array of formData and assign
                // keyData.forEach((update) => {
                // 	return (upload[update] = oldVersion[update]);
                // });
                upload.programEditor = upload.programEditor + 1;

                const updateProgram = await programModel
                    .updateOne(
                        { _id: upload._id },
                        {
                            ...oldVersion,
                            programEditor: upload.programEditor,
                        }
                    )
                    .session(session);

                // write action edit of program in history table
                await addHistoryEditRevert(
                    response,
                    userData,
                    session,
                    updateProgram,
                    ''
                );

                await session.commitTransaction();
                session.endSession();
                return logger.status200Msg(
                    response,
                    system.success,
                    uploadConstant.msgUpdateSuccess(params.id)
                );
            }
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            errors.push(error.message);
            return logger.status500(response, error, errors);
        }
    }

    // [DELETE] /offline/upload/:id
    async delete(request, response, next) {
        const errors = [];
        let session = await mongoose.startSession();
        session.startTransaction();
        try {
            const program = await programModel.findOne({
                _id: request.params.id,
                userID: request.user._id,
                programType: constants.PROGRAM_TYPE.UPLOAD,
                programCurrentStatus: {
                    $nin: [
                        constants.PROGRAM_STATUS.DELETE,
                        constants.PROGRAM_STATUS.DENIAL,
                    ],
                },
            });

            if (!program) {
                return logger.status404(
                    response,
                    system.error,
                    uploadConstant.notFound(request.params.id)
                );
            }

            program.programCurrentStatus = constants.PROGRAM_STATUS.DELETE;
            program.programDisplay = false;

            await program.save({ session });

            if (program.programTypeVideo === constants.TYPE_VIDEO.SS) {
                if (program.programSeasonChild) {
                    const parent = await programModel.findById(
                        program.programChildrenSeasonData.parentID
                    );

                    if (parent) {
                        parent.programCurrentStatus = constants.PROGRAM_STATUS.REVIEW;
                        parent.programDisplay = false;

                        parent.programSeasonData.forEach((item) => {
                            if (
                                item.seasonName ===
                                program?.programChildrenSeasonData?.seasonName
                            ) {
                                item.episodeDeleted && item.episodeDeleted.length
                                    ? item.episodeDeleted.push(program._id)
                                    : (item.episodeDeleted = [program._id]);
                                item.episodeDeleted = _.uniqWith(
                                    item.episodeDeleted,
                                    _.isEqual
                                );
                            }
                        });

                        await parent.save({ session });
                    }
                } else {
                    const programsChild = await programModel.distinct(
                        'programSeasonData.episode',
                        {
                            'program.programChildrenSeasonData.parentID': program._id,
                            deleted: false,
                        }
                    );

                    await programModel
                        .updateMany(
                            {
                                _id: {
                                    $in: programsChild,
                                },
                                programCurrentStatus: {
                                    $ne: constants.PROGRAM_STATUS.DENIAL,
                                },
                            },
                            {
                                $set: {
                                    programCurrentStatus: constants.PROGRAM_STATUS.DELETE,
                                    programDisplay: false,
                                },
                            }
                        )
                        .session(session);
                }
            }

            await session.commitTransaction();
            session.endSession();
            return logger.status200Msg(
                response,
                system.success,
                uploadConstant.msgDeleteUpload(request.params.id)
            );
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            errors.push(error.message);
            return logger.status500(response, error, errors);
        }
    }

    // [PUT] /admin/upload/clear-program-denial/:id
    async clearProgramDenial(request, response, next) {
        const userData = request.user;
        const errors = [];
        const linkImageLogoOMN = constants.DEFAULT_THUMNAIL;
        try {
            const program = await programModel.findOne({
                _id: request.params.id,
                programCurrentStatus: constants.PROGRAM_STATUS.DENIAL,
                deleted: false,
                programSeasonChild: false,
                userID: userData._id,
            });

            if (!program) {
                return logger.status404(
                    response,
                    null,
                    programConstant.notFound(request.params.id)
                );
            }

            if (program.programTypeVideo === constants.TYPE_VIDEO.SS) {
                const parent = await programModel.findById(
                    program.programChildrenSeasonData.parentID
                );

                if (!parent) {
                    return logger.status404(
                        response,
                        null,
                        programConstant.parentIDNotFound
                    );
                }

                parent.programSeasonData.map((season) => {
                    season.episode = season.episode.filter(
                        (ep) => ep.toString() !== request.params.id
                    );
                });

                await parent.save();

                // delete image
                const arrayDelete = [program.videoThumbnail];
                if (program?.programThumbnail?.thumbnailImage) {
                    arrayDelete.push(program.programThumbnail.thumbnailImage);
                    program.programThumbnail.thumbnailImage = linkImageLogoOMN;
                }

                await s3Service.deleteFileImageS3(arrayDelete);

                // add link logo of omn
                program.videoThumbnail = linkImageLogoOMN;
            } else if (program.programTypeVideo === constants.TYPE_VIDEO.SA) {
                const arrayDelete = [
                    program.videoThumbnail,
                    program.programImagex1,
                    program.programImagex2,
                    program.programImageTitleResize1,
                    program.programImageTitleResize2,
                ];

                if (program?.programThumbnail?.thumbnailImage) {
                    arrayDelete.push(program.programThumbnail.thumbnailImage);
                    program.programThumbnail.thumbnailImage = linkImageLogoOMN;
                }
                if (program?.programImagePosterResize) {
                    arrayDelete.push(program.programImagePosterResize);
                    program.programImagePosterResize = linkImageLogoOMN;
                }

                await s3Service.deleteFileImageS3(arrayDelete);

                program.videoThumbnail = linkImageLogoOMN;
                program.programImagex1 = linkImageLogoOMN;
                program.programImagex2 = linkImageLogoOMN;
                program.programImageTitleResize1 = linkImageLogoOMN;
                program.programImageTitleResize2 = linkImageLogoOMN;
            }

            program.verifyDenial = true;
            await program.save();
            return logger.status200(
                response,
                system.success,
                programConstant.clearProgramSuccess
            );
        } catch (error) {
            errors.push(error.message);
            return logger.status500(response, error, errors);
        }
    }
}

async function saveProgram(response, session, uploadData, formData, dataBackup) {
    const errors = [];
    try {
        // // get key in array formData
        // const keyData = Object.keys(formData);
        // const upload = await programModel.findOne({ _id: uploadData._id });

        // // loop each key in array of formData and assign
        // keyData.forEach((update) => (upload[update] = formData[update]));
        // if (!upload.isResultLetter) {
        // 	upload.isResultLetter = true;
        // }

        // upload.historyEditProgramID = dataBackup._id;

        // const dataUpload = await upload.save(session);
        // return dataUpload;
        let upload = await programModel.findOne({ _id: uploadData._id });
        if (!upload.isResultLetter) {
            upload.isResultLetter = true;
        }

        const newForm = {
            ...formData,
            isResultLetter: upload.isResultLetter,
            historyEditProgramID: dataBackup._id,
        };
        await programModel.updateOne(
            { _id: uploadData._id },
            {
                $set: newForm,
            }
        );

        return await programModel.findOne({ _id: uploadData._id });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        errors.push(error.message);
        return logger.status400(response, error, errors);
    }
}

async function saveProgramEdit(response, session, uploadEditData, formData, dataBackup) {
    const errors = [];
    try {
        // // get key in array formData
        // const keyData = Object.keys(formData);
        // const uploadProgram = await programEditModel.findOne({ _id: uploadEditData._id });

        // // loop each key in array of formData and assign
        // keyData.forEach((update) => {
        // 	return (uploadProgram[update] = formData[update]);
        // });
        // uploadProgram.historyEditProgramID = dataBackup._id;
        // const dataUploadProgram = await uploadProgram.save(session);
        // return dataUploadProgram;
        await programEditModel.updateOne(
            {
                _id: uploadEditData._id,
            },
            {
                historyEditProgramID: dataBackup._id,
                ...formData,
            }
        );

        return await programEditModel.findOne({ _id: uploadEditData._id });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        errors.push(error.message);
        return logger.status400(response, error, errors);
    }
}

// [POST] /admin/upload/history/:id
async function addHistory(response, user, session, upload, uploadProgram) {
    const errors = [];
    const time = moment().tz('Asia/Seoul').format('yyyy-MM-DD HH:mm:ss');
    let formData = {
        manager: user._id,
        managerName: user.userName ? user.userName : user.userEmail,
        status: constants.HISTORY_STATUS.EDIT,
        programID: '',
        typeProgram: '',
        title: '',
        content: `${user.userName ? user.userName : user.userEmail} 님

                  프로그램 ${upload.programName}, 요청하신 수정이 신청되었습니다. 
            
                  ${time}  수정 신청 결과를 플랫폼 ‘옴넷’에서 확인하실 수 있습니다.

                  감사합니다.
                 `,
    };
    try {
        if (!_.isEmpty(upload) && _.isEmpty(uploadProgram)) {
            // case 1: create history for program (for the first time to edit)

            formData.programID = upload._id;
            formData.typeProgram = constants.TYPE_PROGRAM_HISTORY.UPLOAD;
            formData.title = `${constants.MESSAGE_TITLE.EDIT_REQUEST_CONFIRM}: ${upload.programEditor} times `;
            // formData.content = 'Change status program to status edit';
            if (upload.programTypeVideo === constants.TYPE_VIDEO.SS) {
                formData.programParentID =
                    upload?.programChildrenSeasonData?.parentID || undefined;
            }
        } else {
            // case 2: create history for program edit (for the many time to edit)

            formData.programID = uploadProgram.programID;
            formData.typeProgram = constants.TYPE_PROGRAM_HISTORY.UPLOAD_PROGRAM;
            formData.title = `${constants.MESSAGE_TITLE.EDIT_REQUEST_CONFIRM}: ${uploadProgram.programEditor} times `;
            // formData.content = 'Change status program edit to status edit';
            if (uploadProgram.programTypeVideo === constants.TYPE_VIDEO.SS) {
                formData.programParentID =
                    uploadProgram?.programChildrenSeasonData?.parentID || undefined;
            }
        }

        formData.receiverID = upload.userID || undefined;
        const history = new historyProgramModel(formData);
        history.createdAt = Date.now();
        history.updatedAt = Date.now();
        success = await history.save(session);

        return success;
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        errors.push(error.message);
        return logger.status400(response, error, errors);
    }
}

// [POST] /admin/upload/history/:id
async function addHistoryEditRevert(response, user, session, upload, uploadProgram) {
    const errors = [];

    let formData = {
        manager: user._id,
        managerName: user.userName ? user.userName : user.userEmail,
        status: constants.HISTORY_STATUS.EDIT_REVERT_DATA,
        programID: '',
        typeProgram: '',
        title: '',
        content: '',
    };
    try {
        if (!_.isEmpty(upload) && _.isEmpty(uploadProgram)) {
            // case 1: create history for program (for the first time to edit)

            formData.programID = upload._id;
            formData.typeProgram = constants.TYPE_PROGRAM_HISTORY.UPLOAD;
            formData.title = ` Edit ${upload.programName} is: ${upload.programEditor} times `;
            formData.content = 'revert data of program';
            if (upload.programTypeVideo === constants.TYPE_VIDEO.SS) {
                formData.programParentID =
                    upload?.programChildrenSeasonData?.parentID || undefined;
            }
        } else {
            // case 2: create history for program edit (for the many time to edit)

            formData.programID = uploadProgram.programID;
            formData.typeProgram = constants.TYPE_PROGRAM_HISTORY.UPLOAD_PROGRAM;
            formData.title = ` Edit ${uploadProgram.programName} is: ${uploadProgram.programEditor} times `;
            formData.content = 'revert data of program edit';
            if (uploadProgram.programTypeVideo === constants.TYPE_VIDEO.SS) {
                formData.programParentID =
                    uploadProgram?.programChildrenSeasonData?.parentID || undefined;
            }
        }

        formData.receiverID = upload.userID || undefined;
        const history = new historyProgramModel(formData);
        history.createdAt = Date.now();
        history.updatedAt = Date.now();
        success = await history.save(session);

        return success;
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        errors.push(error.message);
        return logger.status400(response, error, errors);
    }
}

async function updateParentProgram(response, session, upload) {
    const errors = [];
    try {
        const checkStatusParent = await programModel.findOne({
            'programChildrenSeasonData.parentID':
                upload.programChildrenSeasonData.parentID,
            programSeasonChild: true,
            programCurrentStatus: {
                $ne: constants.PROGRAM_STATUS.APPROVAL,
            },
        });

        if (checkStatusParent) {
            await programModel
                .updateOne(
                    {
                        _id: upload.programChildrenSeasonData.parentID,
                    },
                    {
                        $set: {
                            programCurrentStatus: constants.PROGRAM_STATUS.EDIT,
                            programDisplay: false,
                            isResultLetter: true,
                        },
                    }
                )
                .session(session);
        }
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        errors.push(error.message);
        return logger.status400(response, error, errors);
    }
}

async function sendMessage(
    response,
    session,
    title,
    body,
    userData,
    upload,
    history = {}
) {
    const errors = [];
    try {
        // create send message in admin
        const messageProgram = new messageModel({
            sender: userData._id,
            receiver: constants.DATA_SUPER_ADMIN.ID,
            receiverEmail: constants.DATA_SUPER_ADMIN.EMAIL,
            type: constants.MESSAGE_TYPE.AUTO,
            category: constants.MESSAGE_CATEGORY.PROGRAM,
            display: constants.DISPLAY_NOTIFICATION.OFFLINE,
            title: title,
            content: body,
        });

        await messageProgram.save({ session });

        // create notification in offline
        const userPushNotification = new userPushNotificationModel({
            senderID: constants.DATA_SUPER_ADMIN.ID,
            receiverID: userData._id.toString(),
            programID: upload._id.toString(),
            historyID: history._id || undefined,
            title: title,
            isRead: true,
            body: {
                type: constants.NOTIFICATION_BODY_TYPE.PROGRAM_UPLOAD,
                title: title,
                message: body,
                category: constants.CATEGORY_NOTIFICATION.PROGRAM,
            },
            display: constants.DISPLAY_NOTIFICATION.OFFLINE,
        });

        await userPushNotification.save({ session });

        // Push for tab program in omner offline
        if (sockets) {
            sockets.emit(constants.MESSAGES_NOTIFICATION.OFFLINE, {
                userIDs: [userData._id],
            });
        }
        // End
    } catch (error) {
        errors.push(error.message);
        return logger.status400(response, error, errors);
    }
}

module.exports = new UploadController();
