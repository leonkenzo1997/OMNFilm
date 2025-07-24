const programModel = require('../../Models/Program/ProgramModel');
const _ = require('lodash');

const program = {
	editOtherProgram: async (parent, data = {}, session) => {
		try {
			if (
				_.isEmpty(parent) ||
				_.isEmpty(data) ||
				_.isEmpty(data.programChildrenSeasonData) ||
				!data.programChildrenSeasonData.seasonID
			)
				return;

			const arrayFieldUpdate = [
				'programCategory',
				'programThumbnail',
				'programName',
				'programTitle',
				'programSubTitle',
				'programSummary',
				'programElement',
				'programParticipants',
				'programEpisodeSummary',
				'programMusicInfo',
				'programVideoSetting',
			];
			const dataUpldate = Object.fromEntries(
				Object.entries(data).filter((item) => arrayFieldUpdate.includes(item[0]))
			);

			if (!_.isEmpty(dataUpldate)) {
				let arrayChild = [];
				parent.programSeasonData.forEach((item) => {
					arrayChild = arrayChild.concat(item.episode);
				});

				if (arrayChild.length) {
					await programModel.updateMany({ _id: { $in: arrayChild } }, { $set: dataUpldate }).session(session);
				}
			}

			// Find season of parent
			const season = parent.programSeasonData.find(
				(item) => item._id && item._id.toString() === data.programChildrenSeasonData.seasonID
			);

			if (season && data.programChildrenSeasonData.seasonName !== season.seasonName) {
				// Update seasonName for parent
				await programModel
					.updateMany(
						{
							_id: parent._id,
							'programSeasonData._id': season._id,
						},
						{
							$set: {
								'programSeasonData.$.seasonName': data.programChildrenSeasonData.seasonName,
							},
						}
					)
					.session(session);

				// Update seasonName for other children
				if (season.episode && season.episode.length) {
					await programModel
						.updateMany(
							{
								_id: { $in: season.episode },
							},
							{
								$set: {
									'programChildrenSeasonData.seasonName': data.programChildrenSeasonData.seasonName,
								},
							}
						)
						.session(session);
				}
			}
		} catch (error) {
			console.log(error);
			return;
		}
	},
};

module.exports = program;
