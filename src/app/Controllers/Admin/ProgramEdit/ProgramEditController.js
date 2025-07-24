const mongoose = require('mongoose');

const programEditModel = require('../../../Models/ProgramEdit/ProgramEditModel');
const programModel = require('../../../Models/Program/ProgramModel');
const system = require('../../../Constant/General/SystemConstant');
const businessQuery = require('../../../Business/QueryModel');
const logger = require('../../../Constant/Logger/loggerConstant');
const constants = require('../../../Constant/constants');

class ProgramEditController {
    // [GET] /admin/proramEdit/
    async index(request, response, next) {
        const errors = [];

        try {
            const user = request.user;
            request.userID = user._id;
            const data = await businessQuery.handle(programEditModel, request);
            return logger.status200(response, system.success, '', data);
        } catch (error) {
            errors.push(error.message);
            return logger.status500(response, error, errors);
        }
    }

    // [GET] /admin/proramEdit/:id
    async detail(request, response, next) {
        const params = request.params;
        const errors = [];
        try {
            const programData = await programEditModel.findById({
                _id: params.id,
            });
            if (!programData) {
                return logger.status404(
                    response,
                    system.error,
                    uploadConstant.notFound(paramsData.id),
                );
            } else {
                return logger.status200(response, system.success, '', programData);
            }
        } catch (error) {
            errors.push(error.message);
            return logger.status400(response, error, errors);
        }
    }

    // [POST] /admin/proramEdit/approval
    async status(request, response, next) {
        let user = request.user;
        let req = request.params;
        const errors = [];
        try {
            if (user && user.userType) {
                //deleted program edit and update program
                let editData = await programEditModel.findById({
                    _id: req.id,
                });

                if (editData) {
                    let dataOld = await programModel.findById({
                        _id: editData.programID,
                    });
                    let dataOLD = editData.toJSON();
                    if (req.status === constants.PROGRAM_STATUS.APPROVAL) {
                        delete dataOLD.programID;
                        delete dataOLD.programIDEdit;
                        delete dataOLD.userID;
                        delete dataOLD._id;
                        await dataOld.updateOne(dataOLD);
                        await editData.updateOne({ deleted: true });
                        return logger.status200(
                            response,
                            true,
                            system.approval,
                        );
                    } else if (req.status === constants.PROGRAM_STATUS.DENIAL) {
                        let dataEdit = {
                            deleted: true,
                            programCurrentStatus: constants.PROGRAM_STATUS.DENIAL,
                        };
                        await editData.updateOne(dataEdit);
                        return logger.status200(response, true, system.denied);
                    } else if (req.status === constants.PROGRAM_STATUS.DELETE) {
                        let dataEdit = {
                            deleted: true,
                            programCurrentStatus: constants.PROGRAM_STATUS.DELETE,
                        };
                        await editData.updateOne(dataEdit);
                        return logger.status200(response, true, system.denied);
                    }
                }
                return logger.status500(response, system.error);
            }
            return logger.status200(response, system.permission);
        } catch (error) {
            errors.push(error.message);
            return logger.status400(response, error, errors);
        }
    }

    // [PUT] /admin/proramEdit/:id
    async update(request, response, next) {
        const paramsData = request.params;
        const formData = request.body;
        const errors = [];
        try {
            const upload = await programEditModel.findByIdAndUpdate(
                { _id: paramsData.id },
                formData,
                { new: true, runValidators: true },
            );

            return logger.status200(response, system.success, '', upload);
        } catch (error) {
            errors.push(error.message);
            return logger.status400(response, error, errors);
        }
    }
}

module.exports = new ProgramEditController();
