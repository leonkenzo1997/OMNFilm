const mongoose = require("mongoose");

const userModel = require("../../../Models/User/UserModel");
const system = require("../../../Constant/General/SystemConstant");
const userConstant = require("../../../Constant/User/UserConstant");
const logger = require("../../../Constant/Logger/loggerConstant");

const constants = require("../../../Constant/constants");
const businessQuery = require('../../../Business/QueryModel');
const rsService = require('../../../Service/RsUser/RsFormula');

class UserAccountController {
    // [GET] /user-manager/
    async index(request, response, next) {
        const user = request.user;
        const errors = [];
        let userArray = {};
        try {
            let select = ['userEmail', 'userType', 'userName', 'employeeNumber', 'userDeparment', 'userTeam'];
            let relation = [
                {
                    path: 'userTeam',
                    select: 'teamName'
                },
                {
                    path: 'userDeparment',
                    select: 'departmentName departmentCode'
                },
            ];
            if (user.userType == constants.USER_TYPE.SUPPERADMIN) {
                // request.query.sort = 'userType,1';
                request.query.userType = { $in: [constants.USER_TYPE.ADMIN, constants.USER_TYPE.SUPPERADMIN] };
                userArray = await businessQuery.handle(userModel, request, relation, select);
            } else if (user.userType == constants.USER_TYPE.ADMIN) {
                request.query.userType = { $in: constants.USER_TYPE.ADMIN };
                request.query._id = user._id;
                userArray = await businessQuery.handle(userModel, request, relation, select);
            } else {
                //user denied access
                return response.status(400).json({
                    status: system.error,
                    msg: "User can't access"
                });
            }
            let data = [];
            //map data
            Object.entries(userArray.docs).forEach(([v, item]) => {
                item = item.toObject();
                item.access = constants.ACCESS_USER[item.userType];
                delete item.userType;
                data.push(item);
            });

            userArray.docs = data;
            return logger.status200(response, system.success, "", userArray);
        } catch (error) {
            errors.push(error.message);
            return logger.status500(response, error, errors);
        }
    }

    // [POST] /user-manager/create - create user admin
    async create(request, response, next) {
        const user = request.user;
        const formData = request.body;
        const createParam = Object.keys(formData);
        const errors = [];
        let session = await mongoose.startSession();
        session.startTransaction();
        let userCreate = {};

        try {

            const fieldAllowed = ['userName', 'userEmail', 'userPassword', 'employeeNumber', 'userDeparment', 'userTeam'];
            const isValidOperation = createParam.every((update) => {
                return fieldAllowed.includes(update);
            });

            if (!isValidOperation) {
                session.endSession();
                const fields = createParam.filter((item) => !fieldAllowed.includes(item)).join(', ');
                return logger.status400(response, system.invalidField + fields, errors);
            }

            if (user?.userType == constants.USER_TYPE.SUPPERADMIN
                || user?.userType == constants.USER_TYPE.ADMIN) {
                //check userEmail
                let checkExist = await userModel.find({ userEmail: formData.userEmail });
                if (!rsService.isEmpty(checkExist)) {
                    return response.status(400).json({
                        status: system.error,
                        msg: "User email have exist"
                    });
                } else {
                    formData.userType = 1;
                    userCreate = new userModel(formData);
                }
            }

            if (!rsService.isEmpty(userCreate)) {
                const createUser = await userCreate.save({ session: session });

                await session.commitTransaction();
                session.endSession();

                return response.status(201).json({
                    status: system.success,
                    msg: system.createUser,
                    data: createUser,
                });
            } else {
                return response.status(400).json({
                    status: system.error,
                    msg: "Create user error, Please contact supper admin"
                });
            }
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            errors.push(error.message);
            return logger.status400(response, error, errors);
        }
    }

    // [GET] /user-manager/:id
    async detail(request, response, next) {
        const user = request.user;
        const params = request.params;
        const errors = [];
        let userArray = {};
        let id = params.id;
        try {
            if (id) {
                let select = ['userEmail', 'userName', 'employeeNumber', 'userDeparment', 'userTeam', 'userType'];
                if (user.userType != constants.USER_TYPE.SUPPERADMIN) {
                    if (id != user._id) {
                        return response.status(400).json({
                            status: system.error,
                            msg: "User error"
                        });
                    }
                }
                userArray = await userModel.findOne({ _id: id }, select)
                    .populate(
                        [{
                            path: 'userTeam',
                            select: 'teamName',

                        },
                        {
                            path: 'userDeparment',
                            select: 'departmentName departmentCode'
                        }]
                    );
            } else {
                return response.status(400).json({
                    status: system.error,
                    msg: "User is not exits"
                });
            }

            return logger.status200(response, system.success, "", userArray);
        } catch (error) {
            errors.push(error.message);
            return logger.status500(response, error, errors);
        }
    }

    // [PUT] /user-manager/update/:id - update user admin
    async update(request, response, next) {
        //only user have email same -> update 
        // or supper admin(only change password and username)
        const paramsData = request.params;
        let formData = request.body;
        let updateParam = {};
        const userFromToken = request.user;
        const errors = [];
        let userUpdate = {};
        let fieldAllowed = [];

        let session = await mongoose.startSession();
        session.startTransaction();

        try {

            if (userFromToken.userType == constants.USER_TYPE.SUPPERADMIN) {
                if (userFromToken.id == paramsData.id) {
                    // supper admin change info
                    fieldAllowed = ['userName', 'password_old', 'password_new', 'employeeNumber', 'userDeparment', 'userTeam'];
                    updateParam = Object.keys(formData);
                } else {
                    //supper user reset password change info user
                    delete formData.password_old;
                    updateParam = Object.keys(formData);
                    fieldAllowed = ['userName', 'password_new', 'employeeNumber', 'userDeparment', 'userTeam'];
                }
            } else {
                delete formData.employeeNumber;
                delete formData.userDeparment;
                updateParam = Object.keys(formData);
                fieldAllowed = ['userName', 'password_old', 'password_new'];
            }

            const isValidOperation = updateParam.every((update) => {
                return fieldAllowed.includes(update);
            });

            if (!isValidOperation) {
                session.endSession();
                const fields = updateParam.filter((item) => !fieldAllowed.includes(item)).join(', ');
                return logger.status400(response, system.invalidField + fields, errors);
            }

            if (paramsData.id === userFromToken.id) {
                if (formData.password_old && formData.password_new) {
                    userUpdate = await userModel.findByIdPass(
                        paramsData.id,
                        formData.password_old,
                        { errors: errors }
                    );
                } else {
                    if (formData.password_old || formData.password_new) {
                        return response.status(400).json({
                            status: system.error,
                            msg: "Please input password old and new"
                        });
                    }
                }
            } else {
                //error update user admin
                if (userFromToken.userType !== constants.USER_TYPE.SUPPERADMIN) {
                    session.endSession();
                    return response.status(400).json({
                        status: system.error,
                        msg: "User can't update, Please contact supper admin"
                    });
                } else {

                }
            }

            if (userFromToken.userType == constants.USER_TYPE.ADMIN || userFromToken.userType == constants.USER_TYPE.SUPPERADMIN) {
                if (
                    (formData.password_new && userFromToken.userType == constants.USER_TYPE.SUPPERADMIN)
                    || (formData.password_new && !rsService.isEmpty(userUpdate))
                ) {
                    if (userUpdate.errors && userUpdate.errors.length >= 1) {
                        return response.status(400).json({
                            status: system.error,
                            msg: "Password old incorrect"
                        });
                    }

                    if (userUpdate.errors && userUpdate.errors.length == 0 && paramsData.id === userFromToken.id) {
                        formData.userPassword = await userModel.createPass(formData.password_new);
                    } else if (formData.password_new
                        && userFromToken.userType == constants.USER_TYPE.SUPPERADMIN
                        && paramsData.id !== userFromToken.id) {
                        formData.userPassword = await userModel.createPass(formData.password_new);
                    }
                }
                delete formData.password_new;
                delete formData.password_old;
                let user = await userModel.findOne({ _id: paramsData.id });
                Object.entries(formData).forEach((update) => {
                    return (user[update] = formData[update]);
                });

                formData.userToken = [];

                await user.updateOne(formData).session(session);

                await session.commitTransaction();
                session.endSession();

                return logger.status200(
                    response,
                    system.success,
                    userConstant.msgUpdateUser(user._id),
                    user
                );
            } else {
                session.endSession();
                return response.status(400).json({
                    status: system.error,
                    msg: "Password error, Please check again"
                });
            }

        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            errors.push(error.message);
            return logger.status400(response, error, errors);
        }
    }

    // [DELETE] /user-manager/delete/:id - update user admin
    async detroy(request, response, next) {
        // admin -> may be delete user normal
        // supper admin -> may be delete all user
        const params = request.params;
        const user = request.user;
        const errors = [];

        let session = await mongoose.startSession();
        session.startTransaction();

        try {
            if (params.id) {
                if (user.userType == constants.USER_TYPE.SUPPERADMIN) {
                    let userDel = await userModel.findOne({ _id: params.id });
                    if (userDel) {
                        await userDel.updateOne({ deleted: true });
                        return response.status(200).json({
                            status: system.success,
                            msg: "User id :" + params.id + " is deleted"
                        });
                    } else {
                        return response.status(400).json({
                            status: system.error,
                            msg: "User not exist!"
                        });
                    }
                } else {
                    return response.status(400).json({
                        status: system.error,
                        msg: "Couldn't deleted this user,Please contact system administrator"
                    });
                }
            }
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            errors.push(error.message);
            return logger.status400(response, error, errors);
        }
    }

    // [GET] /user-manager/permissionMenu
    async permissionMenu(request, response, next) {
        const user = request.user;
        const errors = [];
        let userArray = {};

        try {

            let select = ['userDeparment', 'userType'];
            userArray = await userModel.findOne({ _id: user.id }, select)
                .populate(
                    [{
                        path: 'userDeparment',
                        select: 'departmentName departmentCode'
                    }]
                );
            return logger.status200(response, system.success, "", userArray);
        } catch (error) {
            errors.push(error.message);
            return logger.status500(response, error, errors);
        }
    }
}

module.exports = new UserAccountController();
