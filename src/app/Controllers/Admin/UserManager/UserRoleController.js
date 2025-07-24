const mongoose = require("mongoose");

const userModel = require("../../../Models/User/UserModel");
const system = require("../../../Constant/General/SystemConstant");
const userConstant = require("../../../Constant/User/UserConstant");
const logger = require("../../../Constant/Logger/loggerConstant");

const constants = require("../../../Constant/constants");
const businessQuery = require('../../../Business/QueryModel');
const rsService = require('../../../Service/RsUser/RsFormula');
const userRoleModel = require("../../../Models/User/UserRoleModel");


class UserRoleController {
  // [GET] /user-manager/
  async index(request, response, next) {
    const user = request.user;
    const errors = [];
    let userArray = {};
    try {
      if (user.userType == constants.USER_TYPE.SUPPERADMIN) {

      }
      let select = ['userEmail', 'userType', 'userGender', 'userName'];
      if (user.userType == constants.USER_TYPE.SUPPERADMIN) {
        // request.query.sort = 'userType,1';
        userArray = await businessQuery.handle(userModel, request, null, select);
      } else if (user.userType == constants.USER_TYPE.ADMIN) {
        request.query.userType = {$ne : constants.USER_TYPE.SUPPERADMIN};
        userArray = await businessQuery.handle(userModel, request, null, select);
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

      const fieldAllowed = ['userName', 'userEmail', 'userPassword'];
			const isValidOperation = createParam.every((update) => {
				return fieldAllowed.includes(update);
			});

			if (!isValidOperation) {
				session.endSession();
				const fields = createParam.filter((item) => !fieldAllowed.includes(item)).join(', ');
				return logger.status400(response, system.invalidField + fields, errors);
			}

      if (user?.userType == constants.USER_TYPE.SUPPERADMIN 
        ||  user?.userType == constants.USER_TYPE.ADMIN) {
          //check userEmail
          let checkExist = await userModel.find({userEmail: formData.userEmail});
          if (checkExist) {
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

  // [PUT] /user-manager/update/:id - update user admin
  async update(request, response, next) {
    //only user have email same -> update 
    // or supper admin(only change password and username)
    const paramsData = request.params;
    let formData = request.body;
    const user = request.user;
    const errors = [];
    let userUpdate = {};

    let session = await mongoose.startSession();
    session.startTransaction();

    try {
      if (paramsData.id == user.id) {
        userUpdate = await userModel.findByIdPass(
          paramsData.id,
          formData.password_old,
          { errors: errors }
        );
      } else {
        //error update user admin
        session.endSession();
        return response.status(400).json({
          status: system.error,
          msg: "User can't update, Please contact supper admin"
        }); 
      }

      if (userUpdate.password) {
        formData.userPassword = await userModel.createPass(formData.password_new);
        delete formData.password_new;
        delete formData.password_old;
  
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
          let userDel = await userModel.findOne({_id: params.id});
          if (userDel) {
            await userDel.updateOne({deleted: true});
            return response.status(400).json({
              status: system.success,
              msg: "User id :"+ params.id +" is deleted"
            }); 
          } else {
            return response.status(400).json({
              status: system.error,
              msg: "User not exist!"
            }); 
          }
        } else if (user.userType == constants.USER_TYPE.ADMIN) {
          let userDel = await userModel.findOne({
              _id: params.id, 
              $and :[
                {userType : {$ne : 1}},
                {userType : {$ne : 4}}
              ]});
          if (userDel) {
            await userDel.updateOne({deleted: true});
            return response.status(200).json({
              status: system.success,
              msg: "User id :"+ params.id +" is deleted"
            }); 
          } else {
            return response.status(400).json({
              status: system.error,
              msg: "User not exist!"
            }); 
          }
        } else {

        }
      }
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      errors.push(error.message);
      return logger.status400(response, error, errors);
    }
  }
}

module.exports = new UserRoleController();
