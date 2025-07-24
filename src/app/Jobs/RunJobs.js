const constants = require('../Constant/constants');
const { pushNotificationNewProgram } = require('../Controllers/User/Push/PushNotificationController');
const programModel = require('../Models/Program/ProgramModel');
const userModel = require('../Models/User/UserModel');

class runJobs {
	async handle() {
		try {
			const data = await programModel.find({
				deleted: false,
				programCurrentStatus: [
					constants.PROGRAM_STATUS.APPROVAL,
					constants.PROGRAM_STATUS.OMN
				],
				programDisplay: false,
			});

			const user = await userModel.findOne({
				userType: constants.USER_TYPE.ADMIN,
			});

			if (!data || !data.length || !user) return

			Promise.all(
				data.map(async (program) => {
					pushNotificationNewProgram(program, user);
				})
			);

			await programModel.updateMany(
				{
					deleted: false,
					programCurrentStatus: [
						constants.PROGRAM_STATUS.APPROVAL,
						constants.PROGRAM_STATUS.OMN
					],
					programDisplay: false,
				},
				{
					programDisplay: true
				}
			)

			await programModel.updateMany(
				{
					$or: [
						{
							deleted: true
						},
						{
							programCurrentStatus: constants.PROGRAM_STATUS.DELETE
						}
					],
					programDisplay: true,
				},
				{
					programDisplay: false
				}
			)
		} catch (error) {
			console.log(error.message);
		}
	}
}

module.exports = new runJobs();
