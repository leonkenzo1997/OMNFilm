const email = {
	sendEmailOTP: 'Send email OTP fail!!!',
	SUBJECT_FORGOT_PASSWORD: 'OTP TO RESET PASSWORD',
	SUBJECT_RESET_PINCODE: 'OTP TO RESET PINCODE',

	GET_SUBJECT_EMAIL: function (status, programName, programType) {
		const constants = require('../../Constant/constants')
		switch (status) {
			case constants.PROGRAM_STATUS.APPROVAL:
				return 'YOUR PROGRAM IN ' + programType.toUpperCase() + ' ' + programName + ' HAVE BEEN APPROVED';
				break;
		
			case constants.PROGRAM_STATUS.DENIAL:
				return 'YOUR PROGRAM IN ' + programType.toUpperCase() + ' ' + programName + ' HAVE BEEN DENIAL';
				break;

			case constants.PROGRAM_STATUS.OMN:
				return 'YOUR PROGRAM IN ' + programType.toUpperCase() + ' ' + programName + ' HAVE BEEN ACHIEVED LEVEL OMN';
				break;

			case constants.PROGRAM_STATUS.INSTANT:
				return 'YOUR PROGRAM IN ' + programType.toUpperCase() + ' ' + programName + ' HAVE BEEN ACHIEVED LEVEL INSTANT';
				break;

			case constants.PROGRAM_STATUS.REVIEW:
				return 'YOUR PROGRAM IN ' + programType.toUpperCase() + ' ' + programName + ' HAVE BEEN REVIEWED';
				break;

			case constants.PROGRAM_STATUS.EDIT:
				return 'YOUR PROGRAM IN ' + programType.toUpperCase() + ' ' + programName + ' HAVE BEEN EDITED';
				break;

			case constants.PROGRAM_STATUS.DELETE:
				return 'YOUR PROGRAM IN ' + programType.toUpperCase() + ' ' + programName + ' HAVE BEEN DELETED';
				break;

			default:
				return
				break;
		}
	}
};

module.exports = email;
