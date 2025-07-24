const mongoose = require('mongoose');
const cache = require('memory-cache');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');

const userModel = require('../../Models/User/UserModel');
const programModel = require('../../Models/Program/ProgramModel');
const likeAndUnlikeModel = require('../../Models/Action/LikeAndUnlikeModel');

const system = require('../../Constant/General/SystemConstant');
const userConstant = require('../../Constant/User/UserConstant');

const userService = require('../../Service/User/UserService');
const logger = require('../../Constant/Logger/loggerConstant');

const paymentModel = require('../../Models/Payment/PaymentModel');
const userPayment = require('../../Models/Payment/UserPaymentModel');
const noticeTransaction = require('../../Models/Notice/NoticeTransactionModel');

const constants = require('../../Constant/constants');

const _ = require('lodash');
const membershipModel = require('../../Models/Manage/Membership/MembershipModel');
const userFeedbackModel = require('../../Models/User/UserFeedbackModel');

class UserController {
    // [GET] /user/
    async index(request, response, next) {
        const errors = [];
        try {
            const userArray = await userModel.find({}).sortable(request);
            const userTotal = await userModel.countDocuments();
            const data = {
                userTotal,
                userArray,
            };
            return logger.status200(response, system.success, '', data);
        } catch (error) {
            errors.push(error.message);
            return logger.status500(response, error, errors);
        }
    }

    // [GET] /user/me
    profile = async (request, response, next) => {
        const errors = [];
        let user = request.user;
        const id = user._id;

        try {
            const referenceDataUser = await userModel
                .findById(id)
                .populate('userMembership parentProtection bankingInfor.koreanBank');
            const token = request.token;
            let temporary = referenceDataUser.toJSON();
            //get payment check expired day
            let infoPayment = await paymentModel.findOne({
                idUser: temporary._id,
            });
            if (infoPayment) {
                let now = new Date().getTime();
                let expired = new Date(infoPayment.expired_day).getTime();
                let expired_day = false;
                if (now > expired) {
                    expired_day = true;
                }

                temporary.expired = expired_day;
                if (infoPayment?.cancelTime && infoPayment?.cancelDate) {
                    temporary.hold = true;
                } else {
                    temporary.hold = false;
                }
            }

            let trial = await userPayment.findOne({ idUser: temporary._id });

            temporary.trial = false;
            if (trial && !trial.trial) {
                temporary.trial = true;
            }
            temporary = await this.getResolution(temporary);

            const dataUser = await Object.assign(temporary, { token });
            return logger.status200(response, system.success, '', dataUser);
        } catch (error) {
            errors.push(error.message);
            return logger.status400(response, error, errors);
        }
    };

    getResolution = async (data) => {
        if (!data.userMembership) {
            return data;
        }

        const membership = await membershipModel.findById(data.userMembership);

        data.resolution = [constants.RESOLUTION.HD];
        data.defaultResolution = constants.RESOLUTION.HD;

        if (membership.packageName === constants.MEMBER_SHIP.PREMIUM) {
            data.resolution = Object.values(constants.RESOLUTION);
            if (data.userSettingVideo === constants.USER_VIDEO_SETTING.FULL_HD) {
                data.defaultResolution = constants.RESOLUTION.FHD;
            }
            return data;
        }
        return data;
    };

    // [POST] /user/register
    register = async (request, response, next) => {
        const formData = request.body;
        const errors = [];
        let session = await mongoose.startSession();
        session.startTransaction();

        const user = new userModel(formData);

        try {
            const createUser = await user.save({ session: session });
            const token = await user.generateAuthenticationToken(session, formData);

            await session.commitTransaction();
            session.endSession();

            let temporary = createUser.toJSON();

            //   temporary = await this.getResolution(temporary);

            const data = Object.assign(temporary, { token });

            return response.status(201).json({
                status: system.success,
                msg: system.registerUser,
                data: data,
            });
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            errors.push(error.message);
            return logger.status400(response, error, errors);
        }
    };

    // [POST] /user/login
    login = async (request, response, next) => {
        const formData = request.body;
        const errors = [];
        let session = await mongoose.startSession();
        session.startTransaction();

        try {
            // call function findByCredentials in user model to check email and password
            const user = await userModel.findByCredentials(
                { userEmail: formData.userEmail },
                { userPassword: formData.userPassword },
                { errors: errors }
            );

            if (!user.data) {
                return logger.status200(response, system.error, user.errors);
            }
            if (!user.password) {
                return logger.status200(response, system.error, user.errors);
            }

            const dataUser = await userModel.findById({ _id: user.data._id }).populate({
                path: 'userMembership parentProtection bankingInfor.koreanBank',
            });
            const token = await user.data.generateAuthenticationToken(session, formData);
            let temporary = dataUser.toJSON();

            //get payment check expired day
            let infoPayment = await paymentModel.findOne({
                idUser: temporary._id,
                deleted: false,
            });
            if (infoPayment) {
                let now = new Date().getTime();
                let expired = new Date(infoPayment.expired_day).getTime();
                let expired_day = false;
                if (now > expired) {
                    expired_day = true;
                }
                temporary.expired = expired_day;

                if (infoPayment?.cancelTime && infoPayment?.cancelDate) {
                    temporary.hold = true;
                } else {
                    temporary.hold = false;
                }
            } else {
                temporary.expired = true;
            }

            let trial = await userPayment.findOne({ idUser: temporary._id });

            temporary.trial = false;
            if (trial && !trial.firstPayment) {
                temporary.trial = true;
            }

            temporary = await this.getResolution(temporary);

            const data = Object.assign(temporary, { token });
            await session.commitTransaction();
            session.endSession();
            return response.status(200).json({
                status: system.success,
                msg: system.login,
                data: data,
            });
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            errors.push(error.message);
            return logger.status400(response, error, errors);
        }
    };

    // [GET] /user/login-by-token
    loginByToken = async (request, response, next) => {
        const errors = [];
        const user = request.user;
        let session = await mongoose.startSession();
        session.startTransaction();

        try {
            const dataUser = await userModel.findById({ _id: user._id }).populate({
                path: 'userMembership parentProtection bankingInfor.koreanBank',
            });
            const token = await dataUser.generateAuthenticationToken(session, {});
            let temporary = dataUser.toJSON();

            //get payment check expired day
            let expired_day = false;
            let infoPayment = await paymentModel.findOne({
                idUser: temporary._id,
                deleted: false,
            });
            if (infoPayment) {
                let now = new Date().getTime();
                let expired = new Date(infoPayment.expired_day).getTime();
                if (now > expired) {
                    expired_day = true;
                }
                temporary.expired = expired_day;
            } else {
                temporary.expired = true;
            }

            let trial = await userPayment.findOne({ idUser: temporary._id });

            temporary.trial = false;
            if (trial && !trial.firstPayment) {
                temporary.trial = true;
            }

            temporary = await this.getResolution(temporary);

            const data = Object.assign(temporary, { token });
            await session.commitTransaction();
            session.endSession();
            return response.status(200).json({
                status: system.success,
                msg: system.login,
                data: data,
            });
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            errors.push(error.message);
            return logger.status400(response, error, errors);
        }
    };

    // [POST] /user/logout
    async logout(request, response, next) {
        const user = request.user;
        const tokenLogout = request.token;
        const errors = [];
        let session = await mongoose.startSession();
        session.startTransaction();
        try {
            // purpose: create new userToken array to contain tokens still login
            user.userToken = user.userToken.filter((token) => {
                // check token want logout if return true, the value will be added in new userTokens array
                // otherwise it will be removed.
                return token.token !== tokenLogout;
            });
            await user.save({ session: session });
            await session.commitTransaction();
            session.endSession();
            return logger.status200(response, system.success, system.logout);
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            errors.push(error.message);
            return logger.status500(response, error, errors);
        }
    }

    // [POST] /user/logout
    async logoutAll(request, response, next) {
        const user = request.user;
        const errors = [];
        let session = await mongoose.startSession();
        session.startTransaction();
        try {
            user.userToken = [];
            await user.save({ session: session });
            await session.commitTransaction();
            session.endSession();
            return logger.status200(response, system.success, system.logoutAll);
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            errors.push(error.message);
            return logger.status500(response, error, errors);
        }
    }

    // [PUT] /user/me
    async update(request, response, next) {
        const paramsData = request.params;
        const formData = request.body;
        const user = request.user;
        const errors = [];
        const userCategoriesSet = formData.userCategoriesSet;

        let session = await mongoose.startSession();
        session.startTransaction();

        // get key in array formData
        const updates = request.keyData;

        try {
            if (userCategoriesSet) {
                if (userCategoriesSet.length < 3) {
                    return logger.status200Msg(
                        response,
                        system.error,
                        userConstant.errorUserCategoriesSet
                    );
                }
            }

            if (formData.userPinCode) {
                updates.push('isPinCode');
                formData.isPinCode = true;
            }

            if (formData.usingPinCode && !user.isPinCode) {
                return logger.status400(
                    response,
                    'Missing pin code! Please setup pin code',
                    errors
                );
            }

            // loop each key in array of formData and assign
            updates.forEach((update) => {
                // user[update]: is old data
                // formData[update]: new data
                // change old data by assigning new data
                return (user[update] = formData[update]);
            });

            await user.save({ session: session });

            await session.commitTransaction();
            session.endSession();

            const dataUser = await userModel.findOne({ _id: user._id }).populate({
                path: 'userMembership parentProtection bankingInfor.koreanBank',
            });

            return logger.status200(
                response,
                system.success,
                userConstant.msgUpdateUser(user._id),
                dataUser
            );
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            errors.push(error.message);
            return logger.status400(response, error, errors);
        }
    }

    // [PUT] /user/me
    async updateUser(request, response, next) {
        const paramsData = request.params;
        const formData = request.body;
        const user = request.user;
        const errors = [];

        try {
            let data = await userModel.findById({
                _id: paramsData.id,
            });
            data.userPassword = formData.userPassword;
            data.save();

            const dataUser = await userModel.findOne({ _id: paramsData.id }).populate({
                path: 'userMembership parentProtection bankingInfor.koreanBank',
            });

            return logger.status200(
                response,
                system.success,
                userConstant.msgUpdateUser(paramsData.id),
                dataUser
            );
        } catch (error) {
            errors.push(error.message);
            return logger.status400(response, error, errors);
        }
    }

    // [DELETE] /user/:id
    async destroy(request, response, next) {
        const paramsData = request.params;
        const user = request.user;
        const errors = [];
        let session = await mongoose.startSession();
        try {
            session.startTransaction();
            const userDelete = await userModel.delete({ _id: user._id }).session(session);

            if (!userDelete.nModified) {
                await session.abortTransaction();
                session.endSession();
                return logger.status404(
                    response,
                    system.error,
                    system.notFound(paramsData.id)
                );
            }
            await session.commitTransaction();
            session.endSession();
            return logger.status200(
                response,
                system.success,
                userConstant.msgDeleteUser(user._id)
            );
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            errors.push(error.message);
            return logger.status400(response, error, errors);
        }
    }

    // [POST] /user/check-email
    async checkEmail(request, response, next) {
        const errors = [];
        const formData = request.body;
        const email = formData.userEmail;
        try {
            const checkEmail = await userService.findByEmail(email);

            if (checkEmail) {
                return logger.status200ExistEmail(
                    response,
                    system.success,
                    email,
                    userConstant.existEmail,
                    true
                );
            }

            return logger.status200ExistEmail(
                response,
                system.success,
                userConstant.checkEmail,
                email,
                false
            );
        } catch (error) {
            return logger.status400(response, error, errors);
        }
    }

    // [POST] /user/check-email
    async changePassword(request, response, next) {
        const formData = request.body;
        const errors = [];
        const oldPassword = formData.oldPassword;
        const newPassword = formData.newPassword;
        const confirmPassword = formData.confirmPassword;
        const isLogoutAll = formData.isLogoutAll;
        const user = request.user;
        try {
            let checkPassword = await userService.checkPassword(
                oldPassword,
                user.userPassword
            );

            if (!checkPassword) {
                return logger.status200(response, system.error, system.isMatchPassword);
            }

            if (newPassword !== confirmPassword) {
                return logger.status200(response, system.error, system.checkNewPassword);
            }

            user.userPassword = newPassword;

            if (isLogoutAll) {
                user.userToken = [];
                await user.save();
                return logger.status200(response, system.success, system.changePassword);
            } else {
                await user.save();
                return logger.status200(response, system.success, system.changePassword);
            }
        } catch (error) {
            errors.push(error.message);
            return logger.status400(response, error, errors);
        }
    }

    //[PUT] /user/change-phone-number
    async changePhoneNumber(request, response, next) {
        const formData = request.body;
        const currentPassword = formData.currentPassword;
        const user = request.user;
        const errors = [];
        try {
            const checkPassword = await userService.checkPassword(
                currentPassword,
                user.userPassword
            );

            if (!checkPassword) {
                return logger.status200(response, system.error, system.isMatchPassword);
            }
            const userPhoneNumber = {
                areaCode: formData.areaCode,
                phoneNumber: formData.phoneNumber,
            };
            user.userPhoneNumber = userPhoneNumber;
            await user.save();
            return logger.status200(response, system.success, system.changePhoneNumber);
        } catch (error) {
            errors.push(error.message);
            return logger.status400(response, error, errors);
        }
    }

    // [GET] /user/delete-phone-number
    async deletePhoneNumber(request, response, next) {
        const errors = [];
        const user = request.user;
        try {
            user.userPhoneNumber = {};
            await user.save();
            return logger.status200(response, system.success, system.deletePhoneNumber);
        } catch (error) {
            errors.push(error.message);
            return logger.status400(response, error, errors);
        }
    }

    //[PUT] /user/reset-password
    async resetPinCode(request, response, next) {
        const errors = [];
        const formData = request.body;
        const userEmail = formData.userEmail;
        const newPinCode = formData.newPinCode;
        const confirmPinCode = formData.confirmPinCode;
        const userUUID = formData.UUID;
        const UUID = cache.get(userEmail);
        try {
            if (newPinCode !== confirmPinCode) {
                return logger.status200(response, system.error, system.checkNewPinCode);
            }

            const userData = await userModel.findOne({ userEmail });

            if (!userData) {
                return logger.status200ExistEmail(
                    response,
                    system.error,
                    userConstant.emailNotExistInSystem,
                    userEmail,
                    false
                );
            } else {
                if (UUID !== userUUID) {
                    return logger.status200Msg(response, system.error, system.errorUUID);
                }

                userData.userPinCode = newPinCode;
                const reset = await userData.save();
                if (!reset) {
                    return logger.status200(
                        response,
                        system.error,
                        system.resetPinCodeFail
                    );
                } else {
                    cache.del(userEmail);
                    return logger.status200(
                        response,
                        system.success,
                        system.resetPinCodeSuccess
                    );
                }
            }
        } catch (error) {
            errors.push(error.message);
            return logger.status400(response, error, errors);
        }
    }

    //[PUT] /user/reset-password
    async resetPasswordByEmail(request, response, next) {
        const errors = [];
        const formData = request.body;
        const userEmail = formData.userEmail;
        const newPassword = formData.newPassword;
        const confirmPassword = formData.confirmPassword;
        const userUUID = formData.UUID;
        const UUID = cache.get(userEmail);
        try {
            if (newPassword !== confirmPassword) {
                return logger.status200(response, system.error, system.checkNewPassword);
            }

            const userData = await userModel.findOne({ userEmail });

            if (!userData) {
                return logger.status200ExistEmail(
                    response,
                    system.error,
                    userConstant.emailNotExistInSystem,
                    userEmail,
                    false
                );
            } else {
                if (UUID !== userUUID) {
                    return logger.status200Msg(response, system.error, system.errorUUID);
                }

                userData.userPassword = newPassword;
                const reset = await userData.save();
                if (!reset) {
                    return logger.status200(
                        response,
                        system.error,
                        system.resetPasswordFail
                    );
                } else {
                    cache.del(userEmail);
                    return logger.status200(
                        response,
                        system.success,
                        system.resetPasswordSuccess
                    );
                }
            }
        } catch (error) {
            errors.push(error.message);
            return logger.status400(response, error, errors);
        }
    }

    //[POST] /user/check-otp-email
    async checkOTPOfEmail(request, response, next) {
        const errors = [];
        const formData = request.body;
        const userEmail = formData.userEmail;
        let OTP = cache.get(userEmail);
        let clientOTP = formData.codeOTP;

        try {
            const checkEmail = await userService.findByEmail(userEmail);

            if (!checkEmail) {
                return logger.status200ExistEmail(
                    response,
                    system.error,
                    userConstant.emailNotExistInSystem,
                    userEmail,
                    false
                );
            } else {
                if (clientOTP.length !== 4) {
                    return logger.status200CodeOTP(
                        response,
                        system.error,
                        system.otpInvalid,
                        false
                    );
                }

                if (OTP !== clientOTP) {
                    return logger.status200CodeOTP(
                        response,
                        system.error,
                        system.otpInvalid,
                        false
                    );
                }
                cache.del(userEmail);
                const timeUUIDExist = 300000;
                const UUID = uuidv4();
                cache.put(userEmail, UUID, timeUUIDExist);
                return logger.status200CodeOTP(
                    response,
                    system.success,
                    system.otpValid,
                    true,
                    UUID
                );
            }
        } catch (error) {
            errors.push(error.message);
            return logger.status400(response, error, errors);
        }
    }

    //[POST] /user/check-phone-number
    async checkPhoneNumber(request, response, next) {
        const errors = [];
        const formData = request.body;
        const phoneNumber = formData.phoneNumber;
        const areaCode = formData.areaCode;
        const userPhoneNumber = {
            areaCode: areaCode,
            phoneNumber: phoneNumber,
        };
        try {
            const checkPhoneNumber = await userService.checkPhoneNumberExist(
                userPhoneNumber
            );

            if (!checkPhoneNumber) {
                return logger.status200PhoneNumberExist(
                    response,
                    system.error,
                    userConstant.phoneNumberNotExistInSystem,
                    userPhoneNumber,
                    false
                );
            }
            return logger.status200PhoneNumberExist(
                response,
                system.success,
                userConstant.phoneNumberValid,
                userPhoneNumber,
                true
            );
        } catch (error) {
            errors.push(error.message);
            return logger.status400(response, error, errors);
        }
    }

    //[POST] /user/reset-password-by-phone-number
    async checkOTPOfPhoneNumber(request, response, next) {
        const errors = [];
        const formData = request.body;
        const keyAppFirebase = process.env.KEY_APP_FIREBASE;
        const idToken = formData.idToken;
        const phoneNumber = formData.phoneNumber;
        const areaCode = formData.areaCode;
        const userPhoneNumber = {
            areaCode: areaCode,
            phoneNumber: phoneNumber,
        };

        try {
            const checkOTPFirebase = await axios({
                method: 'post',
                baseURL: `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${keyAppFirebase}`,
                headers: { 'Content-type': 'application/json' },
                data: {
                    idToken: idToken,
                },
            });

            if (checkOTPFirebase) {
                const timeUUIDExist = 300000;
                const UUID = uuidv4();
                cache.put(userPhoneNumber, UUID, timeUUIDExist);
                return logger.status200CodeOTP(
                    response,
                    system.success,
                    system.otpValid,
                    true,
                    UUID
                );
            }
        } catch (error) {
            errors.push(error.message);

            if (error.name === 'Error') {
                return logger.status200CodeOTP(
                    response,
                    system.error,
                    system.otpInvalid,
                    false
                );
            }
            return logger.status400(response, error, errors);
        }
    }

    //[PUT] /user/reset-password-by-phone-number
    async resetPasswordByPhoneNumber(request, response, next) {
        const errors = [];
        const formData = request.body;
        const newPassword = formData.newPassword;
        const confirmPassword = formData.confirmPassword;
        const userUUID = formData.UUID;
        const phoneNumber = formData.phoneNumber;
        const areaCode = formData.areaCode;
        const userPhoneNumber = {
            areaCode: areaCode,
            phoneNumber: phoneNumber,
        };
        const UUID = cache.get(userPhoneNumber);
        try {
            if (newPassword !== confirmPassword) {
                return logger.status200(response, system.error, system.checkNewPassword);
            }

            const userData = await userService.findByPhoneNumber(userPhoneNumber);

            if (!userData) {
                return logger.status200PhoneNumberExist(
                    response,
                    system.error,
                    userConstant.emailNotExistInSystem,
                    userEmail,
                    false
                );
            } else {
                if (UUID !== userUUID) {
                    return logger.status200Msg(response, system.error, system.errorUUID);
                }

                userData.userPassword = newPassword;
                const reset = await userData.save();
                if (!reset) {
                    return logger.status200Msg(
                        response,
                        system.error,
                        system.resetPasswordFail
                    );
                } else {
                    cache.del(userPhoneNumber);
                    return logger.status200Msg(
                        response,
                        system.success,
                        system.resetPasswordSuccess
                    );
                }
            }
        } catch (error) {
            errors.push(error.message);
            return logger.status400(response, error, errors);
        }
    }

    async deactivePlan(request, response, next) {
        const errors = [];
        const user = request.user;
        try {
            user.userMembership = null;
            const data = await user.save();
            if (data) {
                return logger.status200Msg(
                    response,
                    system.success,
                    system.successDeactive
                );
            } else {
                return logger.status200Msg(response, system.error, system.errorDeactive);
            }
        } catch (error) {
            errors.push(error.message);
            return logger.status400(response, error, errors);
        }
    }

    async checkPinCode(request, response, next) {
        const errors = [];
        const user = request.user;
        const formData = request.body;
        const pinCode = formData.userPinCode;

        try {
            const checkPinCode = await userService.checkPINCode(
                pinCode,
                user.userPinCode
            );

            if (checkPinCode) {
                return logger.status200CheckpinCode(
                    response,
                    system.success,
                    system.validPinCode,
                    true
                );
            } else {
                return logger.status200CheckpinCode(
                    response,
                    system.error,
                    system.invalidPinCode,
                    false
                );
            }
        } catch (error) {
            errors.push(error.message);
            return logger.status400(response, error, errors);
        }
    }

    async like(request, response, next) {
        const errors = [];
        const param = request.params;
        const idProgram = param.id;
        const user = request.user;
        const idUser = user._id;
        let session = await mongoose.startSession();
        session.startTransaction();

        try {
            const selectField = ['_id', 'like', 'unlike'];
            const dataProgram = await programModel
                .findOne({ _id: idProgram })
                .select(selectField);

            // check exist id of program
            if (!dataProgram) {
                await session.abortTransaction();
                session.endSession();
                return logger.status404(
                    response,
                    system.error,
                    system.notFoundProgram(idProgram)
                );
            } else {
                const dataLike = {
                    userId: idUser,
                    programId: idProgram,
                    type: 'like',
                };

                const checkIsLiked = await likeAndUnlikeModel.findOne({
                    userId: idUser,
                    programId: idProgram,
                    type: 'like',
                });

                // check having data that user liked program
                if (checkIsLiked) {
                    // if have data, delete data and decrease like of program.
                    // this case, user remove like
                    await checkIsLiked.delete({ session: session });
                    dataProgram.like -= 1;
                    await dataProgram.save({ session: session });
                    const msg = {
                        removeLike: system.removeLike(idProgram),
                        decreaseLikeProgram: system.decreaseLikeProgram(idProgram),
                    };
                    await session.commitTransaction();
                    session.endSession();
                    return logger.status200Like(response, system.success, false, msg);
                } else {
                    const dataUnlike = {
                        userId: idUser,
                        programId: idProgram,
                        type: 'unlike',
                    };

                    const checkIsUnliked = await likeAndUnlikeModel.findOne(dataUnlike);

                    // check having data that user unliked program
                    if (checkIsUnliked) {
                        // if have data, change type from unlike to like
                        // this case: user can change hobby from unlike to like
                        checkIsUnliked.type = 'like';
                        await checkIsUnliked.save({ session: session });
                        dataProgram.unlike -= 1;
                        dataProgram.like += 1;
                        await dataProgram.save({ session: session });
                        const msg = {
                            likeProgram: system.likeProgram(idProgram),
                            increaseLikeProgram: system.addLike(idProgram),
                        };
                        await session.commitTransaction();
                        session.endSession();
                        return logger.status200Like(response, system.success, true, msg);
                    } else {
                        // checks the data that it have in system but data is deleted
                        const checkLikedIsDeleted =
                            await likeAndUnlikeModel.findOneDeleted(dataLike);

                        // this mean: first user like but they remove like. now they comeback to choose like
                        if (checkLikedIsDeleted) {
                            // restore data which the user liked that program
                            await checkLikedIsDeleted.restore({
                                session: session,
                            });
                            dataProgram.like += 1;
                            await dataProgram.save({ session: session });
                            const msg = {
                                likeProgram: system.likeProgram(idProgram),
                                increaseLikeProgram: system.addLike(idProgram),
                            };
                            await session.commitTransaction();
                            session.endSession();
                            return logger.status200Like(
                                response,
                                system.success,
                                true,
                                msg
                            );
                        } else {
                            //this case: it is the first time that user like program
                            const like = new likeAndUnlikeModel(dataLike);
                            await like.save();
                            dataProgram.like += 1;
                            await dataProgram.save({ session: session });
                            const msg = {
                                likeProgram: system.likeProgram(idProgram),
                                increaseLikeProgram: system.addLike(idProgram),
                            };
                            await session.commitTransaction();
                            session.endSession();
                            return logger.status200Like(
                                response,
                                system.success,
                                true,
                                msg
                            );
                        }
                    }
                }
            }
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            errors.push(error.message);
            return logger.status400(response, error, errors);
        }
    }

    async unlike(request, response, next) {
        const errors = [];
        const param = request.params;
        const idProgram = param.id;
        const user = request.user;
        const idUser = user._id;
        let session = await mongoose.startSession();
        session.startTransaction();
        try {
            const selectField = ['_id', 'unlike', 'like'];
            const dataProgram = await programModel
                .findOne({ _id: idProgram })
                .select(selectField);

            // check exist of program
            if (!dataProgram) {
                await session.abortTransaction();
                session.endSession();
                return logger.status404(
                    response,
                    system.error,
                    system.notFoundProgram(idProgram)
                );
            } else {
                const dataUnlike = {
                    userId: idUser,
                    programId: idProgram,
                    type: 'unlike',
                };
                // check having data that is the first time user unlike program
                const checkIsUnliked = await likeAndUnlikeModel.findOne(dataUnlike);

                if (checkIsUnliked) {
                    // if have data, delete data and decrease unlike of program.
                    // this case, user want to remove unlike
                    await checkIsUnliked.delete({ session: session });
                    dataProgram.unlike -= 1;
                    await dataProgram.save({ session: session });
                    const msg = {
                        removeUnlike: system.removeUnlike(idProgram),
                        decreaseUnlikeProgram: system.decreaseUnlikeProgram(idProgram),
                    };
                    await session.commitTransaction();
                    session.endSession();
                    return logger.status200Unlike(response, system.success, false, msg);
                } else {
                    const dataLike = {
                        userId: idUser,
                        programId: idProgram,
                        type: 'like',
                    };

                    // check having data that user liked program
                    const checkIsLiked = await likeAndUnlikeModel.findOne(dataLike);
                    if (checkIsLiked) {
                        // if have data, change type from like to unlike
                        // this case: user can change hobby from like to unlike
                        checkIsLiked.type = 'unlike';
                        await checkIsLiked.save({ session: session });
                        dataProgram.like -= 1;
                        dataProgram.unlike += 1;
                        await dataProgram.save({ session: session });
                        const msg = {
                            unlikeProgram: system.unlikeProgram(idProgram),
                            increaseUnlikeProgram: system.addUnlike(idProgram),
                        };
                        await session.commitTransaction();
                        session.endSession();
                        return logger.status200Unlike(
                            response,
                            system.success,
                            true,
                            msg
                        );
                    } else {
                        // checks the unlike data that it have in system but data is deleted
                        const checkUnLikedIsDeleted =
                            await likeAndUnlikeModel.findOneDeleted(dataUnlike);

                        /** this mean:
                         * firstly, user unlike but they remove unlike, they also can not choose like.
                         * now they comeback to choose unlike.
                         */

                        if (checkUnLikedIsDeleted) {
                            await checkUnLikedIsDeleted.restore({
                                session: session,
                            });
                            dataProgram.unlike += 1;
                            await dataProgram.save({ session: session });
                            const msg = {
                                unlikeProgram: system.unlikeProgram(idProgram),
                                increaseUnlikeProgram: system.addUnlike(idProgram),
                            };
                            await session.commitTransaction();
                            session.endSession();
                            return logger.status200Unlike(
                                response,
                                system.success,
                                true,
                                msg
                            );
                        } else {
                            //this case: it is the first time that user unlike program
                            const unlike = new likeAndUnlikeModel(dataUnlike);
                            await unlike.save({ session: session });
                            dataProgram.unlike += 1;
                            await dataProgram.save({ session: session });
                            const msg = {
                                unlikeProgram: system.unlikeProgram(idProgram),
                                increaseUnlikeProgram: system.addUnlike(idProgram),
                            };
                            await session.commitTransaction();
                            session.endSession();
                            return logger.status200Unlike(
                                response,
                                system.success,
                                true,
                                msg
                            );
                        }
                    }
                }
            }
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            errors.push(error.message);
            return logger.status400(response, error, errors);
        }
    }

    async view(request, response, next) {
        const params = request.params;
        const errors = [];
        let session = await mongoose.startSession();
        session.startTransaction();

        try {
            let programChallenger = await programModel.findOne({
                _id: params.id,
            });

            if (!programChallenger) {
                session.endSession();
                return logger.status404(
                    response,
                    system.error,
                    'Program ' + params.id + ' not found!'
                );
            } else {
                let date = new Date();
                let month = date.getMonth() + 1;
                let year = date.getFullYear();
                if (programChallenger.programView) {
                    if (
                        programChallenger.programView[year] &&
                        programChallenger.programView[year][month]
                    ) {
                        programChallenger.programView[year][month]['view'] += 1;
                    } else {
                        if (programChallenger.programView[year]) {
                            programChallenger.programView[year][month] = {
                                view: 1,
                                basic: 0,
                                standard: 0,
                                premium: 0,
                            };
                        } else {
                            programChallenger.programView[year] = {
                                [month]: {
                                    view: 1,
                                    basic: 0,
                                    standard: 0,
                                    premium: 0,
                                },
                            };
                        }
                    }
                } else {
                    programChallenger.programView = {
                        [year]: {
                            [month]: {
                                view: 1,
                                basic: 0,
                                standard: 0,
                                premium: 0,
                            },
                        },
                    };
                }

                if (programChallenger.programView) {
                    let total = 0;
                    Object.entries(programChallenger.programView).forEach(([v, va]) => {
                        Object.entries(va).forEach(([i, vals]) => {
                            Object.entries(vals).forEach(([o, number]) => {
                                if (number.view) {
                                    total += number.view;
                                }
                            });
                        });
                    });
                    programChallenger.programTotalView = total;
                } else {
                    programChallenger.programTotalView = 0;
                }

                var newChallenger = new programModel(programChallenger);
                await newChallenger.save({ session: session });
                await session.commitTransaction();
                session.endSession();
                return logger.status200(response, system.success, '', programChallenger);
            }
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            errors.push(error.message);
            return logger.status400(response, error, errors, system.error);
        }
    }

    async checktokenDRM(request, response, next) {
        try {
            return response.status(200).json({
                status: true,
                data: true,
            });
        } catch (error) {
            return response.status(400).json({
                status: false,
                data: false,
            });
        }
    }

    async updateParentProtection(request, response, next) {
        const errors = [];
        const user = request.user;
        const formData = request.body;
        let session = await mongoose.startSession();
        session.startTransaction();
        try {
            const dataUser = await userModel
                .findOne({
                    _id: user._id,
                })
                .populate({
                    path: 'userMembership parentProtection bankingInfor.koreanBank',
                });
            dataUser.parentProtection = formData.parentProtection;
            await dataUser.save({ session: session });

            await session.commitTransaction();
            session.endSession();

            return logger.status200(
                response,
                system.success,
                system.updateParentProtectionSuccess,
                dataUser
            );
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            errors.push(error.message);
            return logger.status400(response, error, errors);
        }
    }

    async checkNotice(request, response, next) {
        const errors = [];
        const user = request.user;
        const id = request.query.id;
        let session = await mongoose.startSession();
        session.startTransaction();
        try {
            if (id) {
                let notice = await noticeTransaction.findOne({ noticeID: id });
                if (notice) {
                    await notice.updateOne({ deleted: true }).session(session);
                    await session.commitTransaction();
                    session.endSession();
                    return logger.status200(response, system.success);
                } else {
                    session.endSession();
                    return logger.status404(response, system.error, 'Id not found');
                }
            } else {
                session.endSession();
                return logger.status404(response, system.error, 'Id is null');
            }
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            errors.push(error.message);
            return logger.status400(response, error, errors);
        }
    }

    async getNotice(request, response, next) {
        const errors = [];
        const user = request.user;
        try {
            let notice = await noticeTransaction.findOne({ idUser: user._id });
            return logger.status200(response, system.success, '', notice);
        } catch (error) {
            errors.push(error.message);
            return logger.status400(response, error, errors);
        }
    }

    // [PUT] /user/video-setting
    async updateVideoSetting(request, response, next) {
        const errors = [];
        const user = request.user;
        const formData = request.body;

        let session = await mongoose.startSession();
        session.startTransaction();
        try {
            const membership = await membershipModel.findById(user.userMembership);

            if (membership.packageName == constants.MEMBER_SHIP.PREMIUM) {
                user.userSettingVideo = parseInt(formData.userSettingVideo);
                await user.save(session);

                await session.commitTransaction();
                session.endSession();

                return logger.status200(
                    response,
                    system.success,
                    system.updateVideoSetting
                );
            } else {
                session.endSession();
                return logger.status400(
                    response,
                    system.unpermissionUpdateVideoSetting(membership.packageName),
                    errors
                );
            }
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            errors.push(error.message);
            return logger.status400(response, error, errors);
        }
    }

    // [POST] /user/feedback
    async createFeedback(request, response, next) {
        const errors = [];
        const user = request.user;
        let formData = request.body;
        const USERFEEDBACK_TYPE = Object.keys(constants.USERFEEDBACK_TYPE);
        const field = Object.keys(formData);

        let session = await mongoose.startSession();
        session.startTransaction();

        try {
            let check = false;
            formData.feedbackType.forEach((type_feedback) => {
                if (!USERFEEDBACK_TYPE.includes(type_feedback)) {
                    check = true;
                }
            });

            if (check) {
                session.endSession();
                return response.status(400).json({
                    status: false,
                    msg: 'User type error',
                });
            }

            const fieldAllowed = [
                'watched',
                'feedbackType',
                'feedbackMessage',
                'remark',
                'feedbackStatus',
            ];
            const isValidOperation = field.every((create) => {
                return fieldAllowed.includes(create);
            });

            if (!isValidOperation) {
                session.endSession();
                const fields = field
                    .filter((item) => !fieldAllowed.includes(item))
                    .join(', ');
                return logger.status400(response, system.invalidField + fields, errors);
            }

            formData.userID = user._id;
            formData.userEmail = user.userEmail;
            let userFeedback = await userFeedbackModel.create([formData], { session });

            await session.commitTransaction();
            session.endSession();

            return logger.status200(
                response,
                system.success,
                'Feedback have sent',
                userFeedback
            );
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            errors.push(error.message);
            return logger.status400(response, error, errors);
        }
    }
}

module.exports = new UserController();
