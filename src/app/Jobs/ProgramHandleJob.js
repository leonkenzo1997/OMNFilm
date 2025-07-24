const ProgramModel = require('../Models/Program/ProgramModel');
const ProgramEditModel = require('../Models/ProgramEdit/ProgramEditModel');
const historyEditProgram = require('../Models/Program/HistoryEditProgramModel');
const constants = require('../Constant/constants')
const programOriginalConstant = require('../Constant/ProgramOriginal/ProgramOriginalConstant')
const ProgramOriginalController = require('../Controllers/Admin/ProgramOriginal/ProgramOriginalController')
class ProgramHandleJob {
	async updatePendingProgram() {
		try {
			await ProgramModel.updateMany(
				{},
				{
					isPending: false,
				}
			);

			await ProgramEditModel.updateMany(
				{},
				{
					isPending: false,
				}
			);

			await historyEditProgram.updateMany(
				{},
				{
					isPending: false,
				}
			);
		} catch (error) {
			console.log(error.message);
		}
	}

	async checkCompleteOriginal() {
		try {
			const programs = await ProgramModel.find({
				isComplete: false,
				programType: constants.PROGRAM_TYPE.PROGRAM_ORIGINAL,
				deleted: false
			})

			await Promise.all(programs.map(async program => {
				// Check complete
				let fieldsAllow = []
				if (program.programTypeVideo === constants.TYPE_VIDEO.SS) {
					fieldsAllow = [
						...programOriginalConstant.fieldsAllowUpdate,
						'programEpisodeSummary'
					]
				} else {
					fieldsAllow = programOriginalConstant.fieldsAllowUpdate
				}

				// Filter remove other field not allow
				const newFormData = Object.fromEntries(
					Object.entries(JSON.parse(JSON.stringify(program))).filter((item) => fieldsAllow.includes(item[0]))
				);

				const formData = await ProgramOriginalController.checkStatusComplete(
					newFormData,
					null,
					program.programTypeVideo
				);

				if (formData.isComplete) {
					program.isComplete = true
					await program.save()
				}
			}))
		} catch (error) {
			console.log(error)
		}
	}
}

module.exports = new ProgramHandleJob();
