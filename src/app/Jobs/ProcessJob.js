const constants = require('../Constant/constants');
const programModel = require('../Models/Program/ProgramModel');
const d5 = 60 * 60 * 24 * 5;
class processJobs {
	async handle() {
		try {
			let data = await programModel.find({
				deleted: false,
				programTypeVideo: { $ne: constants.TYPE_VIDEO.SS },
				programCurrentStatus: [
					constants.PROGRAM_STATUS.EDIT,
					constants.PROGRAM_STATUS.UPLOAD,
					constants.PROGRAM_STATUS.REVIEW,
				],
			});

			if (!data || !data.length) return

			Object.entries(data).forEach(async ([v, va]) => {
				let now = new Date().getTime() / 1000;
				if (va.programCurrentStatus === constants.PROGRAM_STATUS.EDIT) {
					//with program status is (edit) -> updatedAt
					let updatedAt = va.updatedAt.getTime() / 1000;
					if (now - updatedAt >= d5) {
						if (va.programDisplay) {
							va.programCurrentStatus = va.status;
							va.status = null;
							va.programProcess = 100;
						} else {
							va.deleted = true;
							va.programCurrentStatus = constants.PROGRAM_STATUS.DELETE;
							va.programProcess = 100;
						}
					} else {
						let percent = ((now - updatedAt) / d5) * 100;
						va.programProcess = Number(percent.toFixed(0));
					}
				} else {
					//with program status is (upload, review) -> createdAt
					let createdAt = va.createdAt.getTime() / 1000;
					if (now - createdAt >= d5) {
						va.deleted = true;
						va.programCurrentStatus = constants.PROGRAM_STATUS.DELETE;
						va.programProcess = 100;
					} else {
						let percent = ((now - createdAt) / d5) * 100;
						va.programProcess = Number(percent.toFixed(0));
					}
				}

				let update = {
					deleted: va.deleted,
					programCurrentStatus: va.programCurrentStatus,
					programProcess: va.programProcess,
				};

				await va.updateOne(update);
			});
		} catch (error) {
			console.log(error.message);
		}
	}
}

module.exports = new processJobs();
