const bcrypt = require('bcryptjs');

const userModel = require('../../Models/User/UserModel');
const areaCodeModel = require('../../Models/User/AreaCodeModel');

const user = {
	findByEmail: async (email) => {
		const checkEmail = await userModel.exists({ userEmail: email });
		return checkEmail;
	},
	checkPassword: async (passwordChecked, password) => {
		const checkPassword = await bcrypt.compare(passwordChecked, password);
		return checkPassword;
	},
	findByAreaCode: async (id) => {
		const checkPassword = await areaCodeModel.findById({ _id: id });
		return checkPassword;
	},
	checkPhoneNumberExist: async (userPhoneNumber) => {
		const checkPhoneNumberExist = await userModel.exists({ userPhoneNumber });
		return checkPhoneNumberExist;
	},
	findByPhoneNumber: async (userPhoneNumber) => {
		const checkPhoneNumber = await userModel.findOne({ userPhoneNumber });
		return checkPhoneNumber;
	},
	checkPINCode: async (pinCodeChecked, pinCode) => {
		const checkPinCode = await bcrypt.compare(pinCodeChecked, pinCode);
		return checkPinCode;
	},
	findUser: async (id) => {
		const user = await userModel.findOne({ _id: id });
		return user;
	},
};

module.exports = user;
