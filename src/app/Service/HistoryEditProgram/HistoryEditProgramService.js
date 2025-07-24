const mongoose = require('mongoose');
const historyEditProgramModel = require('../../Models/Program/HistoryEditProgramModel');
const programModel = require('../../Models/Program/ProgramModel');
const programEditModel = require('../../Models/ProgramEdit/ProgramEditModel');

const logger = require('../../Constant/Logger/loggerConstant');
const historyEditProgramConstant = require('../../Constant/HistoryEditProgram/HistoryEditProgramConstant');
const system = require('../../Constant/General/SystemConstant');
const constants = require('../../Constant/constants');

const historyEditProgramService = {
    createHistoryEdit: async function (response, session, formData) {
        const errors = [];
        try {
            const data = await programModel.findOne({
                _id: formData._id,
                userID: formData.userID,
            });

            if (!data) {
                await session.abortTransaction();
                session.endSession();
                return logger.status404(
                    response,
                    system.error,
                    historyEditProgramConstant.notFound(formData._id)
                );
            }
            const formatData = JSON.parse(JSON.stringify(data));
            formatData.programID = formatData._id;

            delete formatData._id;
            delete formatData.createdAt;
            delete formatData.updatedAt;

            const historyEdit = new historyEditProgramModel(formatData);
            const createSuccessHistory = await historyEdit.save(session);

            return createSuccessHistory;
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            errors.push(error.message);
            return logger.status400(response, error, errors);
        }
    },
    createApprovalProgramEditHistoryEdit: async function (response, session, formData) {
        const errors = [];
        try {
            const data = JSON.parse(JSON.stringify(formData));

            delete data._id;
            delete data.createdAt;
            delete data.updatedAt;
            delete data.programIDEdit;

            data.isProgramEdit = true;
            const historyEdit = new historyEditProgramModel(data);
            const createSuccessHistory = await historyEdit.save(session);

            return createSuccessHistory;
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            errors.push(error.message);
            return logger.status400(response, error, errors);
        }
    },
    createProgramEditHistoryEdit: async function (response, session, formData) {
        const errors = [];
        try {
            const data = await programEditModel.findOne({
                _id: formData._id,
                userID: formData.userID,
            });
            if (!data) {
                await session.abortTransaction();
                session.endSession();
                return logger.status404(
                    response,
                    system.error,
                    historyEditProgramConstant.notFound(formData._id)
                );
            }
            const formatData = JSON.parse(JSON.stringify(data));

            delete formatData._id;
            delete formatData.createdAt;
            delete formatData.updatedAt;
            delete formatData.programIDEdit;

            formatData.isProgramEdit = true;
            const historyEdit = new historyEditProgramModel(formatData);
            const createSuccessHistory = await historyEdit.save(session);

            return createSuccessHistory;
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            errors.push(error.message);
            return logger.status400(response, error, errors);
        }
    },
    findNewestAndUpdateStatusHistoryEdit: async function (
        response,
        session,
        data,
        status
    ) {
        try {
            const dataHistoryEditNewest = await historyEditProgramModel.findOne({
                _id: data.historyEditProgramID,
                programID: data._id,
                userID: data.userID,
            });

            if (dataHistoryEditNewest) {
                if (
                    status === constants.PROGRAM_STATUS.DELETE ||
                    status === constants.PROGRAM_STATUS.DENIAL
                ) {
                    dataHistoryEditNewest.programDisplay = false;
                }
                dataHistoryEditNewest.programCurrentStatus = status;
                await dataHistoryEditNewest.save(session);
            }
        } catch (error) {
            console.log(error);
        }
    },
    findHistoryEdit: async function (response, session, id) {
        const errors = [];

        try {
            const dataHistoryEditProgram = await historyEditProgramModel
                .findOne({
                    _id: id,
                })
                .lean();

            return dataHistoryEditProgram;
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            errors.push(error.message);
            return logger.status400(response, error, errors);
        }
    },
};

module.exports = historyEditProgramService;
