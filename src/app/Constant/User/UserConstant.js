const user = {
	notFound: function (id) {
		return 'Not found id: ' + id + ' in user!!!';
	},
	msgDeleteUser: function (id) {
		return 'Deleted successfully _id: ' + id + ' in user!!!';
	},
	msgUpdateUser: function (id) {
		return 'Updated successfully _id ' + id + ' in user!!!';
	},
	msgRestore: function (id) {
		return 'Restored successfully _id ' + id + ' in user!!!';
	},
	existEmail: 'Email is already existed. Please input another email!!!',
	emailNotExistInSystem: 'Your account do not exist. Please input email again!!!',
	existPhoneNumber: 'Your phone number is already existed. Please input another phone number!!!',
	phoneNumberNotExistInSystem:
		'Your phone number do not register. Please input phone number that you are registered!!!',
	phoneNumberValid: 'Your phone number is valid!!!',
	allowedUpdates: [
		'userName',
		'userEmail',
		'userPassword',
		'userPhoneNumber',
		'userGender',
		'userDOB',
		// 'userMembership',
		'userPinCode',
		'userCategoriesSet',
		'userPinCode',
		'isPinCode',
		'usingPinCode',
		'mylist',
		'deviceToken',
		'typeDevice',
		'parentProtection',
		'userSettingVideo',
	],
	checkEmail: 'Email is valid !!!',
	editEmail: 'You can not edit data. Email is unique!!!',
	editPassword: 'Tou can not edit data. Your action is invalid!!!',
	errorUserCategoriesSet: 'You must choose at least three categories. Please choose more!!!',
	editToken: 'You can not edit token. Your action is invalid!!!',
	allowedResetPassword: ['newPassword', 'confirmPassword', 'userEmail', 'UUID'],
	allowedResetPinCode: ['newPinCode', 'confirmPinCode', 'userEmail', 'UUID'],
	allowedChangePassword: ['newPassword', 'confirmPassword', 'oldPassword', 'isLogoutAll'],
	allowedChangePhoneNumber: ['idAreaCode', 'areaCode', 'phoneNumber', 'currentPassword'],
	checkOTPField: ['codeOTP', 'userEmail'],
	checkPhoneNumberExistField: [
		'idAreaCode',
		'areaCode',
		'phoneNumber',
		'idToken',
		'UUID',
		'newPassword',
		'confirmPassword',
	],
	checkUpdateUser: [
		'userName',
		'userGender',
		'userDOB',
		// 'userMembership',
		'userCategoriesSet',
		'mylist',
		'userPinCode',
		'isPinCode',
		'usingPinCode',
		'parentProtection',
	],
	checkFieldPinCode: ['userPinCode'],
	checkFieldsVideoSetting: ['userSettingVideo'],
};

module.exports = user;
