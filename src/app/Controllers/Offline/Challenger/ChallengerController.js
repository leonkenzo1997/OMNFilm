const programModel = require('../../../Models/Program/ProgramModel');
const programEditModel = require('../../../Models/ProgramEdit/ProgramEditModel');
const historyProgramModel = require('../../../Models/Program/HistoryProgramModel');
const historyEditProgramModel = require('../../../Models/Program/HistoryEditProgramModel');

const system = require('../../../Constant/General/SystemConstant');
const challengerConstant = require('../../../Constant/Challenger/ChallengerConstant');
const logger = require('../../../Constant/Logger/loggerConstant');
const businessQuery = require('../../../Business/QueryModel');
const mongoose = require('mongoose');
const constants = require('../../../Constant/constants');
const common = require('../../../Service/common');
const programConstant = require('../../../Constant/Program/ProgramConstant');
const historyEditProgramService = require('../../../Service/HistoryEditProgram/HistoryEditProgramService');

const _ = require('lodash');

class ChallengerController {
	// [GET] /admin/challenger/
	async index(request, response, next) {
		const userData = request.user;
		const errors = [];
		try {
			request.query.programType = constants.PROGRAM_TYPE.CHALLENGER;
			request.query.userID = userData._id;

			Object.assign(request.query, programConstant.FIELD_QUERY_DEFAULT);
			const arrayChallenger = await businessQuery.handle(programModel, request);
			return logger.status200(response, system.success, '', arrayChallenger);
		} catch (error) {
			errors.push(error.message);
			return logger.status500(response, error, errors);
		}
	}

	// [GET] /admin/challenger/listProgramUpload
	async listProgramUpload(request, response, next) {
		const userData = request.user;
		const errors = [];
		try {
			request.query.programType = constants.PROGRAM_TYPE.CHALLENGER;
			request.query.userID = userData._id;
			request.query.programCurrentStatus = constants.PROGRAM_STATUS.UPLOAD;
			const arrayChallenger = await businessQuery.handle(programModel, request);
			return logger.status200(response, system.success, '', arrayChallenger);
		} catch (error) {
			errors.push(error.message);
			return logger.status500(response, error, errors);
		}
	}

	// [GET] /admin/challenger/listProgramApproval
	async listProgramApproval(request, response, next) {
		const userData = request.user;
		const errors = [];
		try {
			request.query.programType = constants.PROGRAM_TYPE.CHALLENGER;
			request.query.userID = userData._id;
			request.query.programCurrentStatus = constants.PROGRAM_STATUS.APPROVAL;
			const arrayChallenger = await businessQuery.handle(programModel, request);
			return logger.status200(response, system.success, '', arrayChallenger);
		} catch (error) {
			errors.push(error.message);
			return logger.status500(response, error, errors);
		}
	}

	// [GET] /admin/challenger/:id
	async detail(request, response, next) {
		const paramsData = request.params;
		const userData = request.user;
		const errors = [];

		try {
			const challenger = await programModel.findOne({
				_id: paramsData.id,
				userID: userData._id,
			});
			if (!challenger) {
				return logger.status404(response, system.error, challengerConstant.notFound(paramsData.id));
			} else {
				return logger.status200(response, system.success, '', challenger);
			}
		} catch (error) {
			errors.push(error.message);
			return logger.status400(response, error, errors);
		}
	}

	// [POST] /offline/challenger/create
	async create(request, response, next) {
		const formData = request.body;
		const userData = request.user;
		const errors = [];
		formData.programType = constants.PROGRAM_TYPE.CHALLENGER;
		formData.programCurrentStatus = constants.PROGRAM_STATUS.UPLOAD;
		formData.isPending = common.checkPendingProgram();

		let session = await mongoose.startSession();
		session.startTransaction();

		try {
			// Create slug for program
			let checkDaplicate = {};
			while (checkDaplicate) {
				formData['slugName'] = common.generateSlug(formData.programName);
				checkDaplicate = await programModel.findOne({ slugName: formData['slugName'] });
			}

			let parent;
			// Update programSeasonData (List season) for parent
			if (
				formData.programTypeVideo === constants.TYPE_VIDEO.SS &&
				formData.programChildrenSeasonData &&
				formData.programChildrenSeasonData.parentID
			) {
				parent = await programModel.findById(formData.programChildrenSeasonData.parentID);

				// Parent null or type = child
				if (!parent || parent.programSeasonChild) {
					return logger.status404(response, false, programConstant.parentIDNotFound);
				}

				if (!parent.programSeasonData || !parent.programSeasonData.length) {
					parent.programSeasonData = [
						{
							seasonName: formData.programChildrenSeasonData.seasonName,
							episode: [],
						},
					];
				} else if (
					parent.programSeasonData &&
					!parent.programSeasonData.find(
						(item) => item.seasonName === formData.programChildrenSeasonData.seasonName
					)
				) {
					parent.programSeasonData.push({
						seasonName: formData.programChildrenSeasonData.seasonName,
						episode: [],
					});
				}
			} else {
				let seasonData = [];
				if (formData.programTypeVideo === constants.TYPE_VIDEO.SS) {
					seasonData = [
						{
							seasonName: formData.programChildrenSeasonData.seasonName,
							episode: [],
						},
					];
				}
				parent = new programModel({
					...formData,
					programSeasonData: seasonData,
					programSeasonChild: false,
					programChildrenSeasonData: {},
					userID: userData._id,
				});
			}

			if (parent.programType !== formData.programType) {
				await session.abortTransaction();
				session.endSession();
				return logger.status400(response, programConstant.typeParentInvalid, errors);
			}

			// Create data for children
			let children;
			if (formData.programTypeVideo === constants.TYPE_VIDEO.SS) {
				formData.programSeasonChild = true;
				formData.programSeasonData = [];
				formData.programChildrenSeasonData.parentID = parent._id;

				// Add id children in to programSeasonData
				for (let item of parent.programSeasonData) {
					if (item.seasonName === formData.programChildrenSeasonData.seasonName) {
						formData.programChildrenSeasonData.seasonID = item._id
						// IF formData._id exist
						if (formData._id) {
							const idChild = formData._id;
							delete formData._id;
							// Check formData._id exist in season
							if (!item.episode.includes(idChild)) {
								return logger.status404(response, system.error, challengerConstant.notFound(idChild));
							}
							const checkChildren = await programModel.findById(idChild);

							// Check formData._id exist in db
							if (!checkChildren) {
								return logger.status404(response, system.error, challengerConstant.notFound(idChild));
							}
							// Update status to upload if child was delete

							let dataUpdate = {};
							if (checkChildren.programCurrentStatus === constants.PROGRAM_STATUS.DELETE) {
								dataUpdate = {
									...formData,
									programCurrentStatus: constants.PROGRAM_STATUS.UPLOAD,
								};
							} else {
								dataUpdate = formData;
							}
							children = await programModel.findByIdAndUpdate(idChild, dataUpdate).session(session);
						} else {
							// Create new children
							children = new programModel({
								...formData,
								userID: userData._id,
							});
							await children.save({ session });

							item.episode.push(children._id);
						}
					}
				}
			}

			await parent.save({ session });

			// Add history program edit
			let historyProgramEdit = JSON.parse(JSON.stringify(children || parent))
			historyProgramEdit.programID = historyProgramEdit._id;
			delete historyProgramEdit._id

			historyProgramEdit = new historyEditProgramModel(historyProgramEdit);
			await historyProgramEdit.save({ session });

			// Add historyEditProgramID for program
			const newProgram = children || parent;
			newProgram.historyEditProgramID = historyProgramEdit._id;

			await newProgram.save({ session });

			await session.commitTransaction();
			session.endSession();
			return logger.status201(response, children || parent);
		} catch (error) {
			await session.abortTransaction();
			session.endSession();
			errors.push(error.message);
			return logger.status400(response, error, errors);
		}
	}

	// [PUT] /offline/challanger/update
	async update(request, response, next) {
		const formData = request.body;
		const userData = request.user;
		const params = request.params;
		let errors = [];

		formData.isPending = common.checkPendingProgram();
		let session = await mongoose.startSession();
		session.startTransaction();

		try {
			formData.programCurrentStatus = constants.PROGRAM_STATUS.UPLOAD;

			const challanger = await programModel.findById({
				_id: params.id,
				programType: constants.PROGRAM_TYPE.CHALLENGER,
				programCurrentStatus: constants.PROGRAM_STATUS.EDIT,
				userID: userData._id,
				deleted: false,
			});

			const challengerProgram = await programEditModel.findOne({
				programID: params.id,
				programType: constants.PROGRAM_TYPE.CHALLENGER,
				programCurrentStatus: constants.PROGRAM_STATUS.EDIT,
				userID: userData._id,
				deleted: false,
			});

			if (!challengerProgram) {
				if (!challanger) {
					session.endSession();
					return logger.status404(response, system.error, challengerConstant.notFound(paramsData.id));
				}
				await challanger.updateOne(formData).session(session);
				await session.commitTransaction();
				session.endSession();
				return logger.status200Msg(response, system.success, challengerConstant.msgUpdate(params.id));
			} else {
				await challengerProgram.updateOne(formData).session(session);
				await session.commitTransaction();
				session.endSession();
				return logger.status200Msg(response, system.success, challengerConstant.msgUpdate(params.id));
			}
		} catch (error) {
			await session.abortTransaction();
			session.endSession();
			errors.push(error.message);
			return logger.status500(response, error, errors);
		}
	}

	// [PUT] /offline/challanger/update
	async updateNewFlow(request, response, next) {
		const formData = request.body;
		const userData = request.user;
		const params = request.params;
		let errors = [];

		formData.isPending = common.checkPendingProgram();
		let session = await mongoose.startSession();
		session.startTransaction();

		let data = {
			editData: '',
			history: '',
		};
		try {
			const challanger = await programModel.findById({
				_id: params.id,
				programType: constants.PROGRAM_TYPE.CHALLENGER,
				userID: userData._id,
				deleted: false,
			});

			if (!challanger) {
				session.endSession();
				return logger.status404(response, system.error, challengerConstant.notFound(params.id));
			}

			const challengerProgram = await programEditModel.findOne({
				programID: params.id,
				programType: constants.PROGRAM_TYPE.CHALLENGER,
				programCurrentStatus: {
					$in: [
						constants.PROGRAM_STATUS.UPLOAD,
						constants.PROGRAM_STATUS.EDIT,
						constants.PROGRAM_STATUS.REVIEW,
					],
				},
				userID: userData._id,
				deleted: false,
			});

			const checkEdit = challanger.isEdit;
			const programStatus = challanger.programCurrentStatus;

			// default status is edit
			formData.programCurrentStatus = constants.PROGRAM_STATUS.EDIT;
			// increase times to edit
			formData.programEditor = challanger.programEditor + 1;

			formData.isResultLetter = true;

			if (!challengerProgram && !checkEdit) {
				// case 1:  the firt time to edit
				switch (programStatus) {
					case constants.PROGRAM_STATUS.UPLOAD:
					case constants.PROGRAM_STATUS.EDIT:
					case constants.PROGRAM_STATUS.REVIEW:
					case constants.PROGRAM_STATUS.DENIAL: {
						const dataBackUp = await historyEditProgramService.createHistoryEdit(
							response,
							session,
							challanger
						);
						// edit directly in program table
						const successDataProgram = await saveProgram(
							response,
							session,
							challanger,
							formData,
							dataBackUp
						);

						// if type season, update status and isResultLetter of parent program
						if (challanger.programTypeVideo === constants.TYPE_VIDEO.SS) {
							await updateParentProgram(response, session, challanger);
						}

						// write action edit of program in history table
						const successAddHistory = await addHistory(response, userData, session, successDataProgram, '');

						await session.commitTransaction();
						session.endSession();
						data.editData = successDataProgram;
						data.history = successAddHistory;

						return logger.status200(
							response,
							system.success,
							challengerConstant.msgUpdate(params.id),
							data
						);
						break;
					}

					case constants.PROGRAM_STATUS.OMN:
					case constants.PROGRAM_STATUS.INSTANT:
					case constants.PROGRAM_STATUS.APPROVAL: {
						// must change flag isEdit from false to true to confirm which program is editing
						challanger.isEdit = true;
						await challanger.save({ session: session });

						const challangerData = challanger.toObject();
						delete challangerData.isEdit;

						// program have status upload when moving data in program edit table
						formData.programCurrentStatus = constants.PROGRAM_STATUS.UPLOAD;

						const keyData = Object.keys(formData);
						// loop each key in array of formData and assign
						keyData.forEach((update) => (challangerData[update] = formData[update]));

						challangerData.programID = challangerData._id;

						// create data back up for program
						const dataBackUp = await historyEditProgramService.createApprovalProgramEditHistoryEdit(
							response,
							session,
							challengerData
						);

						delete challangerData._id;
						// assign id data back up in program
						challangerData.historyEditProgramID = dataBackUp._id;

						// case when program have status omn, instant, approval, we must move it through program edit table
						const challangerProgramEdit = new programEditModel(challangerData);
						challangerProgramEdit.createdAt = Date.now();
						challangerProgramEdit.updatedAt = Date.now();
						const successDataProgramEdit = await challangerProgramEdit.save({ session: session });

						// write action edit of program in history table
						const successAddHistory = await addHistory(
							response,
							userData,
							session,
							'',
							successDataProgramEdit
						);

						await session.commitTransaction();
						session.endSession();

						data.history = successAddHistory;
						data.editData = successDataProgramEdit;

						return logger.status200(
							response,
							system.success,
							challengerConstant.msgUpdate(params.id),
							data
						);
					}

					default: {
						return logger.status400(response, 'error', errors);
					}
				}
			} else {
				if (!challengerProgram) {
					return logger.status404(response, system.error, challengerConstant.notFound(params.id));
				}
				// case2: from 2 edit times program, just change data in program edit table
				const programEditStatus = challengerProgram.programCurrentStatus;

				switch (programEditStatus) {
					case constants.PROGRAM_STATUS.REVIEW:
					case constants.PROGRAM_STATUS.UPLOAD:
					case constants.PROGRAM_STATUS.EDIT: {
						const dataBackUp = await historyEditProgramService.createProgramEditHistoryEdit(
							response,
							session,
							challengerProgram
						);

						const successProgramEdit = await saveProgramEdit(
							response,
							session,
							challengerProgram,
							formData,
							dataBackUp
						);

						// write action edit of program in history table
						const successAddHistory = await addHistory(response, userData, session, '', successProgramEdit);
						await session.commitTransaction();
						session.endSession();

						data.history = successAddHistory;
						data.editData = successProgramEdit;
						return logger.status200(
							response,
							system.success,
							challengerConstant.msgUpdate(challenger._id),
							data
						);
					}

					default: {
						return logger.status400(response, 'error', errors);
						break;
					}
				}
			}
		} catch (error) {
			await session.abortTransaction();
			session.endSession();
			errors.push(error.message);
			return logger.status500(response, error, errors);
		}
	}

	async returnOldData(request, response, next) {
		const formData = request.body;
		const userData = request.user;
		const params = request.params;
		let errors = [];

		let session = await mongoose.startSession();
		session.startTransaction();

		try {
			const oldVersion = await historyEditProgramService.findHistoryEdit(response, session, params.id);

			if (!oldVersion) {
				session.endSession();
				return logger.status404(
					response,
					system.error,
					uploadConstant.notFoundOldVersion(params.id, oldVersion.programID)
				);
			}
			delete oldVersion.historyEditProgramID;
			delete oldVersion.programEditor;
			delete oldVersion.createdAt;
			delete oldVersion.updatedAt;
			oldVersion.isPending = common.checkPendingProgram();

			if (oldVersion.isProgramEdit) {
				const uploadProgram = await programEditModel.findOne({
					programID: oldVersion.programID,
					userID: userData._id,
					deleted: false,
				});

				if (!uploadProgram) {
					session.endSession();
					return logger.status404(response, system.error, uploadConstant.notFound(oldVersion.programID));
				}

				delete oldVersion._id;

				// get key in array formData
				const keyData = Object.keys(oldVersion);

				// loop each key in array of formData and assign
				keyData.forEach((update) => {
					return (uploadProgram[update] = oldVersion[update]);
				});
				uploadProgram.programEditor = uploadProgram.programEditor + 1;
				const updateProgramEdit = await uploadProgram.save(session);

				// write action edit of program in history table
				const successAddHistory = await addHistoryEditRevert(
					response,
					userData,
					session,
					'',
					updateProgramEdit
				);

				await session.commitTransaction();
				session.endSession();

				return logger.status200Msg(response, system.success, uploadConstant.msgUpdateSuccess(params.id));
			} else {
				const upload = await programModel.findOne({
					_id: oldVersion.programID,
					userID: userData._id,
					deleted: false,
				});

				if (!upload) {
					session.endSession();
					return logger.status404(response, system.error, uploadConstant.notFound(oldVersion.programID));
				}

				delete oldVersion._id;

				// get key in array formData
				const keyData = Object.keys(oldVersion);

				// loop each key in array of formData and assign
				keyData.forEach((update) => {
					return (upload[update] = oldVersion[update]);
				});
				upload.programEditor = upload.programEditor + 1;

				const updateProgram = await upload.save(session);

				// write action edit of program in history table
				await addHistoryEditRevert(response, userData, session, updateProgram, '');

				await session.commitTransaction();
				session.endSession();
				return logger.status200Msg(response, system.success, uploadConstant.msgUpdateSuccess(params.id));
			}
		} catch (error) {
			await session.abortTransaction();
			session.endSession();
			errors.push(error.message);
			return logger.status500(response, error, errors);
		}
	}

	// [DELETE] /offline/challenger/:id
	async delete(request, response, next) {
		const errors = [];
		let session = await mongoose.startSession();
		session.startTransaction();
		try {
			const program = await programModel.findOne({
				_id: request.params.id,
				userID: request.user._id,
				programType: constants.PROGRAM_TYPE.CHALLENGER,
			});

			if (!program) {
				return logger.status404(response, system.error, challengerConstant.notFound(request.params.id));
			}

			program.programCurrentStatus = constants.PROGRAM_STATUS.DELETE;
			program.programDisplay = false;

			await program.save({ session });

			if (program.programTypeVideo === constants.TYPE_VIDEO.SS && program.programSeasonChild) {
				const parent = await programModel.findById(program.programChildrenSeasonData.parentID);

				if (parent) {
					parent.programCurrentStatus = constants.PROGRAM_STATUS.REVIEW;
					parent.programDisplay = false;

					parent.programSeasonData.forEach((item) => {
						if (item.seasonName === program.programChildrenSeasonData.seasonName) {
							item.episodeDeleted && item.episodeDeleted.length
								? item.episodeDeleted.push(program._id)
								: item.episodeDeleted = [program._id];

							item.episodeDeleted = _.uniqWith(item.episodeDeleted, _.isEqual);
						}
					});

					await parent.save({ session });
				}
			}

			await session.commitTransaction();
			session.endSession();
			return logger.status200Msg(response, system.success, challengerConstant.msgDelete(request.params.id));
		} catch (error) {
			await session.abortTransaction();
			session.endSession();
			errors.push(error.message);
			return logger.status500(response, error, errors);
		}
	}
}

async function saveProgram(response, session, challengerData, formData, dataBackup) {
	const errors = [];
	try {
		// get key in array formData
		const keyData = Object.keys(formData);
		const challenger = await programModel.findOne({ _id: challengerData._id });

		// loop each key in array of formData and assign
		keyData.forEach((update) => (challenger[update] = formData[update]));
		if (!challenger.isResultLetter) {
			challenger.isResultLetter = true;
		}

		challenger.historyEditProgramID = dataBackup._id;

		const dataChallenger = await challenger.save(session);
		return dataChallenger;
	} catch (error) {
		await session.abortTransaction();
		session.endSession();
		errors.push(error.message);
		return logger.status400(response, error, errors);
	}
}

async function saveProgramEdit(response, session, challengerEditData, formData, dataBackup) {
	const errors = [];
	try {
		// get key in array formData
		const keyData = Object.keys(formData);
		const challengerProgram = await programEditModel.findOne({ _id: challengerEditData._id });

		// loop each key in array of formData and assign
		keyData.forEach((update) => {
			return (challengerProgram[update] = formData[update]);
		});
		challengerProgram.historyEditProgramID = dataBackup._id;
		const dataChallengerProgram = await challengerProgram.save(session);
		return dataChallengerProgram;
	} catch (error) {
		await session.abortTransaction();
		session.endSession();
		errors.push(error.message);
		return logger.status400(response, error, errors);
	}
}

// [POST] /admin/challenger/history/:id
async function addHistory(response, user, session, challenger, challengerProgram) {
	const errors = [];

	let formData = {
		manager: user._id,
		managerName: user.userName ? user.userName : user.userEmail,
		status: constants.HISTORY_STATUS.EDIT,
		programID: '',
		typeProgram: '',
		title: '',
		content: '',
	};
	try {
		if (!_.isEmpty(challenger) && _.isEmpty(challengerProgram)) {
			// case 1: create history for program (for the first time to edit)

			formData.programID = challenger._id;
			formData.typeProgram = constants.TYPE_PROGRAM_HISTORY.CHALLENGER;
			formData.title = ` Edit ${challenger.programName} is: ${challenger.programEditor} times `;
			formData.content = 'Change status program to status edit';
			if (challenger.programTypeVideo === constants.TYPE_VIDEO.SS) {
				formData.programParentID = challenger?.programChildrenSeasonData?.parentID || undefined;
			}
		} else {
			// case 2: create history for program edit (for the many time to edit)

			formData.programID = challengerProgram.programID;
			formData.typeProgram = constants.TYPE_PROGRAM_HISTORY.CHALLENGER_PROGRAM;
			formData.title = ` Edit ${challengerProgram.programName} is: ${challengerProgram.programEditor} times `;
			formData.content = 'Change status program edit to status edit';

			if (challengerProgram.programTypeVideo === constants.TYPE_VIDEO.SS) {
				formData.programParentID = challengerProgram?.programChildrenSeasonData?.parentID || undefined;
			}
		}

		formData.receiverID = challenger.userID || undefined
		const history = new historyProgramModel(formData);
		history.createdAt = Date.now();
		history.updatedAt = Date.now();
		success = await history.save(session);

		return success;
	} catch (error) {
		await session.abortTransaction();
		session.endSession();
		errors.push(error.message);
		return logger.status400(response, error, errors);
	}
}

// [POST] /admin/challenger/history/:id
async function addHistoryEditRevert(response, user, session, challenger, challengerProgram) {
	const errors = [];

	let formData = {
		manager: user._id,
		managerName: user.userName ? user.userName : user.userEmail,
		status: constants.HISTORY_STATUS.EDIT_REVERT_DATA,
		programID: '',
		typeProgram: '',
		title: '',
		content: '',
	};
	try {
		if (!_.isEmpty(challenger) && _.isEmpty(challengerProgram)) {
			// case 1: create history for program (for the first time to edit)

			formData.programID = challenger._id;
			formData.typeProgram = constants.TYPE_PROGRAM_HISTORY.CHALLENGER;
			formData.title = ` Edit ${challenger.programName} is: ${challenger.programEditor} times `;
			formData.content = 'revert data of program';
			if (challenger.programTypeVideo === constants.TYPE_VIDEO.SS) {
				formData.programParentID = challenger?.programChildrenSeasonData?.parentID || undefined;
			}
		} else {
			// case 2: create history for program edit (for the many time to edit)

			formData.programID = challengerProgram.programID;
			formData.typeProgram = constants.TYPE_PROGRAM_HISTORY.CHALLENGER_PROGRAM;
			formData.title = ` Edit ${challengerProgram.programName} is: ${challengerProgram.programEditor} times `;
			formData.content = 'revert data of program edit';
			if (challengerProgram.programTypeVideo === constants.TYPE_VIDEO.SS) {
				formData.programParentID = challengerProgram?.programChildrenSeasonData?.parentID || undefined;
			}
		}
		formData.receiverID = challenger.userID || undefined
		const history = new historyProgramModel(formData);
		history.createdAt = Date.now();
		history.updatedAt = Date.now();
		success = await history.save(session);

		return success;
	} catch (error) {
		await session.abortTransaction();
		session.endSession();
		errors.push(error.message);
		return logger.status400(response, error, errors);
	}
}

async function updateParentProgram(response, session, challenger) {
	const errors = [];
	try {
		const checkStatusParent = await programModel.findOne({
			'programChildrenSeasonData.parentID': challenger.programChildrenSeasonData.parentID,
			programSeasonChild: true,
			programCurrentStatus: {
				$ne: constants.PROGRAM_STATUS.APPROVAL,
			},
		});

		if (checkStatusParent) {
			await programModel
				.updateOne(
					{
						_id: challenger.programChildrenSeasonData.parentID,
					},
					{
						$set: {
							programCurrentStatus: constants.PROGRAM_STATUS.EDIT,
							programDisplay: false,
							isResultLetter: true,
						},
					}
				)
				.session(session);
		}
	} catch (error) {
		await session.abortTransaction();
		session.endSession();
		errors.push(error.message);
		return logger.status400(response, error, errors);
	}
}

module.exports = new ChallengerController();
