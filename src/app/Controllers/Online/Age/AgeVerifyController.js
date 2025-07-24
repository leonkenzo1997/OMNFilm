const userModel = require('../../../Models/User/UserModel');
const system = require('../../../Constant/General/SystemConstant');
const logger = require('../../../Constant/Logger/loggerConstant');

class AgeVerifyController {
    //[GET] /age/check
    async check(request, response, next) {
        const errors = [];
        const userData = request.user;
        try {
            let check = await userModel.findOne({
                _id: userData._id,
                deleted: false
            });
            if (check) {
                if (check.confirmAge) {
                    var dob = check.socialNo;
                    var year = Number(dob.substr(0, 4));
                    var month = Number(dob.substr(4, 2)) - 1;
                    var day = Number(dob.substr(6, 2));
                    var today = new Date();
                    var age = today.getFullYear() - year;
                    if (today.getMonth() < month || (today.getMonth() == month && today.getDate() < day)) {
                        age--;
                    }

                    return response.status(200).json({
                        status: system.success,
                        socialNo: check.socialNo,
                        age: age,
                        signDateSocial: check.signDateSocial,
                        msg: 'User have age verify.'
                    });
                } else {
                    return response.status(201).json({
                        status: system.error,
                        msg: 'User not age verify.'
                    });
                }
            } else {
                return response.status(201).json({
                    status: system.error,
                    msg: 'User not found.'
                });
            }
        } catch (error) {
            errors.push(error.message);
            return logger.status400(response, error, errors);
        }
    }
}

module.exports = new AgeVerifyController();
