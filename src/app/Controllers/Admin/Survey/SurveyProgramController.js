const SurveyProgramModel = require('../../../Models/Survey/SurveyProgramModel');
const system = require('../../../Constant/General/SystemConstant');
const mongoose = require('mongoose');
const logger = require('../../../Constant/Logger/loggerConstant');
const businessQuery = require('../../../Business/QueryModel');
const programConstant = require('../../../Constant/Program/ProgramConstant');
const ProgramModel = require('../../../Models/Program/ProgramModel');
const constants = require('../../../Constant/constants');
const axios = require('axios');
const messageModel = require('../../../Models/Message/MessageModel');

class AdminController {
    // [GET] /admin/survey-program
    async index(request, response, next) {
        const errors = [];
        try {
            const surveys = await businessQuery.handle(SurveyProgramModel, request);
            return logger.status200(response, system.success, '', surveys);
        } catch (error) {
            errors.push(error.message);
            return logger.status500(response, error, errors, system.error);
        }
    }

    // [GET] /admin/survey-program/:id
    async detail(request, response, next) {
        const errors = [];
        try {
            const survey = await SurveyProgramModel.findById(request.params.id);

            if (!survey) {
                return logger.status404(response, system.error, system.notFoundSurvey);
            }
            return logger.status200(response, system.success, '', survey);
        } catch (error) {
            errors.push(error.message);
            return logger.status500(response, error, errors, system.error);
        }
    }

    // [GET] /admin/survey-program/programID/:id
    async getSurveyByProgramID(request, response, next) {
        const errors = [];
        try {
            const survey = await SurveyProgramModel.findOne({
                programID: request.params.id,
            }).sort({
                createdAt: -1,
            });

            if (!survey) {
                return logger.status404(
                    response,
                    system.error,
                    programConstant.notFound(request.params.id)
                );
            }
            return logger.status200(response, system.success, '', survey);
        } catch (error) {
            errors.push(error.message);
            return logger.status500(response, error, errors, system.error);
        }
    }

    // [POST] /admin/survey-program
    async create(request, response, next) {
        const errors = [];
        const user = request.user;
        const body = request.body;

        let session = await mongoose.startSession();
        session.startTransaction();
        try {
            const program = await ProgramModel.findById(body.programID).populate({
                path: 'userID',
                select: ['userEmail'],
            });

            if (!program) {
                return logger.status404(
                    response,
                    system.error,
                    programConstant.notFound(body.programID)
                );
            }

            // Program parent can't create survey
            if (
                program.programTypeVideo === constants.TYPE_VIDEO.SS &&
                !program.programSeasonChild
            ) {
                return logger.status400(
                    response,
                    system.error,
                    system.notPermissionCreateSurvey
                );
            }

            body.userID = user._id;
            const surveyProgram = new SurveyProgramModel(body);

            request.body = {
                programCurrentStatus: body.status,
            };

            const options = {
                headers: {
                    'content-type': 'application/json',
                    Authorization: 'Bearer ' + request.token,
                },
            };

            axios({
                method: 'PUT',
                ...options,
                data: { programCurrentStatus: body.status },
                url: 'https://api.omnadmin.xyz/admin/upload/status/' + body.programID,
            })
                .then(async function (res) {
                    axios({
                        method: 'POST',
                        ...options,
                        data: {
                            status: body.status,
                            title: body.nameTemplate || body.status,
                            content: body.reason,
                        },
                        url:
                            'https://api.omnadmin.xyz/admin/upload/history/' +
                            body.programID,
                    })
                        .then(async function (res) {
                            await surveyProgram.save({ session });

                            // create send message in admin
                            const messageProgram = new messageModel({
                                receiver: program.userID._id.toString(),
                                sender: constants.DATA_SUPER_ADMIN.ID,
                                receiverEmail: program.userID.userEmail,
                                type: constants.MESSAGE_TYPE.AUTO,
                                category: constants.MESSAGE_CATEGORY.PROGRAM,
                                display: constants.DISPLAY_NOTIFICATION.OFFLINE,
                                title: body.nameTemplate || body.status,
                                content: body.reason,
                            });

                            await messageProgram.save({ session });
                            await session.commitTransaction();
                            session.endSession();
                            return logger.status200(
                                response,
                                system.success,
                                '',
                                surveyProgram
                            );
                        })
                        .catch(async function (error) {
                            await session.abortTransaction();
                            session.endSession();
                            console.log(error);
                            errors.push(error.message);
                            return logger.status400(response, error, errors);
                        });
                })
                .catch(async function (error) {
                    await session.abortTransaction();
                    session.endSession();
                    console.log(error);
                    errors.push(error.message);
                    return logger.status400(response, error, errors);
                });
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            errors.push(error.message);
            return logger.status500(response, error, errors, system.error);
        }
    }
}

module.exports = new AdminController();
