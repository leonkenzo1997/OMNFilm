const programEditModel = require('../../../Models/ProgramEdit/ProgramEditModel');
const programModel = require('../../../Models/Program/ProgramModel');
const userModel = require('../../../Models/User/UserModel');
const HistoryProgramModel = require('../../../Models/Program/HistoryProgramModel');
const system = require('../../../Constant/General/SystemConstant');
const businessQuery = require('../../../Business/QueryModel');
const logger = require('../../../Constant/Logger/loggerConstant');
const challengerProgramConstant = require('../../../Constant/Challenger/ChallengerProgramConstant');
const mongoose = require('mongoose');
const constants = require('../../../Constant/constants');
const emailConstant = require('../../../Constant/Email/EmailConstant');
const sendEmail = require('../../../Service/Email/EmailService');
const PushNotificationController = require('../../User/Push/PushNotificationController');

const historyEditProgramService = require('../../../Service/HistoryEditProgram/HistoryEditProgramService');

class ChallengerProgramController {
	// [GET] /admin/challengerEdit/admin
	async indexAdmin(request, response, next) {
		const errors = [];
		const selectFields = [
			'programName',
			'programCurrentStatus',
			'createdAt',
			'updatedAt',
			'programID',
			'isResultLetter',
		];
		const user = request.user;

		try {
			request.query.programType = constants.PROGRAM_TYPE.CHALLENGER;
			request.query.deleted = false;
			request.query.isPending = false;
			if (request.query.programCurrentStatus) {
				request.query.programCurrentStatus = {
					$ne: constants.PROGRAM_STATUS.DELETE,
					$eq: request.query.programCurrentStatus,
				};
			} else {
				request.query.programCurrentStatus = {
					$ne: constants.PROGRAM_STATUS.DELETE,
				};
			}
			if (request.query.id) {
				const userEmail = new RegExp(request.query.id, 'i');
				const users = await userModel.distinct('_id', { userEmail });
				request.query.userID = {
					$in: users,
				};
			}
			delete request.query.id;
			if (user && user.userType) {
				const data = await businessQuery.handle(
					programEditModel,
					request,
					{ path: 'userID', select: ['userName', 'userEmail'] },
					selectFields
				);
				return logger.status200(response, system.success, '', data);
			} else {
				return logger.status500(response, error, errors, system.permission);
			}
		} catch (error) {
			errors.push(error.message);
			return logger.status500(response, error, errors, system.error);
		}
	}

	// [GET] /admin/challengerEdit/user
	async indexUser(request, response, next) {
		const errors = [];
		const user = request.user;

		try {
			request.query.programType = constants.PROGRAM_TYPE.CHALLENGER;
			request.query.deleted = false;
			request.userID = user._id;
			const data = await businessQuery.handle(programEditModel, request);

			return logger.status200(response, system.success, '', data);
		} catch (error) {
			errors.push(error.message);
			return logger.status500(response, error, errors, system.error);
		}
	}

	// [GET] /admin/challengerEdit/:id
	async detail(request, response, next) {
		const params = request.params;
		const errors = [];
		try {
			const challengerData = await programEditModel
				.findById({
					_id: params.id,
				})
				.populate([
					{ path: 'userID', select: 'userName userEmail' },
					{
						path: 'programCategory.categoryManageId',
						select: 'categoryMangeName',
					},
					{ path: 'programCategory.categoryArrayTag', select: 'tagName' },
				]);
			if (!challengerData) {
				return logger.status404(response, system.error, challengerProgramConstant.notFound(paramsData.id));
			} else {
				return logger.status200(response, system.success, '', challengerData);
			}
		} catch (error) {
			errors.push(error.message);
			return logger.status400(response, error, errors, system.error);
		}
	}

	// [POST] /admin/challengerEdit/approval
	async updateStatus(request, response, next) {
		const user = request.user;
		const formData = request.body;
		const params = request.params;
		const updates = Object.keys(formData);
		const errors = [];
		let session = await mongoose.startSession();
		session.startTransaction();

		const selectUpdate = [
			'programCategory',
			'programCurrentStatus',
			'programElement',
			'programImageBracter',
			'programImagePoster',
			'programImageTitle',
			'programMusicInfo',
			'programName',
			'programParticipants',
			'programSeasonData',
			'programSubTitle',
			'programSummary',
			'programThumbnail',
			'programVideoSetting',
			'programTitle',
			'programImagePosterNoTitle',
			'programType',
			'programTypeVideo',
			'programID',
		];
		try {
			if (user && user.userType) {
				const allowed = ['programCurrentStatus'];
				const isValidOperation = updates.every((update) => {
					return allowed.includes(update);
				});

				if (!isValidOperation) {
					session.endSession();
					return logger.status400(response, challengerProgramConstant.invalidData, errors, system.error);
				}
				//allow status
				const allowedStatus = [
					constants.PROGRAM_STATUS.DENIAL,
					constants.PROGRAM_STATUS.APPROVAL,
					constants.PROGRAM_STATUS.DELETE,
					constants.PROGRAM_STATUS.UPLOAD,
					constants.PROGRAM_STATUS.REVIEW,
				];

				if (!allowedStatus.includes(formData.programCurrentStatus)) {
					session.endSession();
					return logger.status400(response, challengerProgramConstant.invalidData, errors, system.error);
				}

				//deleted program edit and update program
				const editData = await programEditModel.findById(
					{
						_id: params.id,
						programType: constants.PROGRAM_TYPE.CHALLENGER,
						deleted: false,
					},
					selectUpdate
				);

				if (editData) {
					const program = await programModel.findById({
						_id: editData.programID,
					});
					if (!program) {
						return logger.status404(response, challengerProgramConstant.errorUpdate, errors);
					}
					switch (formData.programCurrentStatus) {
						case constants.PROGRAM_STATUS.REVIEW:
							if (editData.programCurrentStatus === constants.PROGRAM_STATUS.UPLOAD) {
								await editData
									.updateOne({
										programCurrentStatus: constants.PROGRAM_STATUS.REVIEW,
										deleted: false,
										status: null,
									})
									.session(session);
								await session.commitTransaction();
								session.endSession();
								return logger.status200Msg(response, system.success, system.review);
							} else {
								session.endSession();
								return logger.status400(
									response,
									challengerProgramConstant.errorUpdate,
									errors,
									system.error
								);
							}
							break;
						case constants.PROGRAM_STATUS.APPROVAL:
							if (
								editData.programCurrentStatus === constants.PROGRAM_STATUS.UPLOAD ||
								editData.programCurrentStatus === constants.PROGRAM_STATUS.REVIEW
							) {
								// Update upload program status to approval and delete
								editData.programCurrentStatus = constants.PROGRAM_STATUS.APPROVAL;
								editData.deleted = true;
								await editData.save({ session: session });
								// Update program status to approval
								program.programCurrentStatus = constants.PROGRAM_STATUS.APPROVAL;
								program.deleted = false;
								await program.save({ session: session });

								// Update parent to approval
								if (program.programTypeVideo === constants.TYPE_VIDEO.SS) {
									await programModel.updateOne(
										{
											_id: program.programChildrenSeasonData.parentID,
										},
										{
											programCurrentStatus: constants.PROGRAM_STATUS.APPROVAL,
										}
									);
								}

								await session.commitTransaction();
								session.endSession();
								return logger.status200(response, system.success, system.approval);
							} else {
								session.endSession();
								return logger.status400(response, challengerProgramConstant.errorUpdate, errors);
							}
							break;
						case constants.PROGRAM_STATUS.DENIAL:
							if (
								editData.programCurrentStatus === constants.PROGRAM_STATUS.UPLOAD ||
								editData.programCurrentStatus === constants.PROGRAM_STATUS.REVIEW
							) {
								// return status for program
								await program
									.updateOne({
										programCurrentStatus: constants.PROGRAM_STATUS.APPROVAL,
										deleted: false,
										status: null,
									})
									.session(session);

								// Update parent to approval
								if (program.programTypeVideo === constants.TYPE_VIDEO.SS) {
									await programModel.updateOne(
										{
											_id: program.programChildrenSeasonData.parentID,
										},
										{
											programCurrentStatus: constants.PROGRAM_STATUS.APPROVAL,
										}
									);
								}

								// delete program upload
								await editData
									.updateOne({
										deleted: true,
										programCurrentStatus: constants.PROGRAM_STATUS.DENIAL,
									})
									.session(session);

								await session.commitTransaction();
								session.endSession();
								return logger.status200(response, system.success, system.denied);
							} else {
								session.endSession();
								return logger.status400(response, challengerProgramConstant.errorUpdate, errors);
							}
							break;
						case constants.PROGRAM_STATUS.DELETE:
							if (
								editData.programCurrentStatus === constants.PROGRAM_STATUS.UPLOAD ||
								editData.programCurrentStatus === constants.PROGRAM_STATUS.REVIEW
							) {
								// return status for program
								await program
									.updateOne({
										programCurrentStatus: constants.PROGRAM_STATUS.DELETE,
										deleted: true,
										status: null,
									})
									.session(session);

								await editData
									.updateOne({
										deleted: false,
										programCurrentStatus: constants.PROGRAM_STATUS.DELETE,
									})
									.session(session);
								await session.commitTransaction();
								session.endSession();
								return logger.status200(response, system.success, system.deleted);
							} else {
								session.endSession();
								return logger.status400(response, challengerProgramConstant.errorUpdate, errors);
							}
							break;
						case constants.PROGRAM_STATUS.UPLOAD:
							if (editData.programCurrentStatus === constants.PROGRAM_STATUS.EDIT) {
								await editData
									.updateOne({
										programCurrentStatus: constants.PROGRAM_STATUS.UPLOAD,
									})
									.session(session);
								await session.commitTransaction();
								session.endSession();
								return logger.status200(response, system.success, 'Change status success');
							} else {
								session.endSession();
								return logger.status400(response, challengerProgramConstant.errorUpdate, errors);
							}
							break;
						default:
							session.endSession();
							return logger.status400(response, challengerProgramConstant.errorUpdate, errors);
							break;
					}
				}
				session.endSession();
				return logger.status404(response, errors, challengerProgramConstant.notFound(params.id));
			}
			session.endSession();
			return logger.status403(response, system.permission);
		} catch (error) {
			await session.abortTransaction();
			session.endSession();
			errors.push(error.message);
			return logger.status400(response, error, errors, system.error);
		}
	}

	async updateStatusNewFlow(request, response, next) {
		const user = request.user;
		const formData = request.body;
		const params = request.params;
		const updates = Object.keys(formData);
		const errors = [];
		let session = await mongoose.startSession();
		session.startTransaction();

		const selectUpdate = [
			'programCategory',
			'programCurrentStatus',
			'programElement',
			'programImageBracter',
			'programImagePoster',
			'programImageTitle',
			'programMusicInfo',
			'programName',
			'programParticipants',
			'programSeasonData',
			'programSubTitle',
			'programSummary',
			'programThumbnail',
			'programVideoSetting',
			'programTitle',
			'programImagePosterNoTitle',
			'programType',
			'programTypeVideo',
			'programID',
			'programEditor',
			'historyEditProgramID',
			'userID',
		];
		try {
			if (user && user.userType) {
				const allowed = ['programCurrentStatus'];
				const isValidOperation = updates.every((update) => {
					return allowed.includes(update);
				});

				if (!isValidOperation) {
					session.endSession();
					return logger.status400(response, challengerProgramConstant.invalidData, errors, system.error);
				}
				//allow status
				const allowedStatus = [
					constants.PROGRAM_STATUS.DENIAL,
					constants.PROGRAM_STATUS.APPROVAL,
					constants.PROGRAM_STATUS.DELETE,
					constants.PROGRAM_STATUS.UPLOAD,
					constants.PROGRAM_STATUS.REVIEW,
				];

				if (!allowedStatus.includes(formData.programCurrentStatus)) {
					session.endSession();
					return logger.status400(response, challengerProgramConstant.invalidData, errors, system.error);
				}

				//deleted program edit and update program
				const editData = await programEditModel.findById(
					{
						_id: params.id,
						programType: constants.PROGRAM_TYPE.CHALLENGER,
						deleted: false,
					},
					selectUpdate
				);

				if (editData) {
					const program = await programModel.findById({
						_id: editData.programID,
					});
					if (!program) {
						return logger.status404(response, challengerProgramConstant.errorUpdate, errors);
					}
					switch (formData.programCurrentStatus) {
						case constants.PROGRAM_STATUS.REVIEW:
							if (
								editData.programCurrentStatus === constants.PROGRAM_STATUS.UPLOAD ||
								editData.programCurrentStatus === constants.PROGRAM_STATUS.EDIT ||
								editData.programCurrentStatus === constants.PROGRAM_STATUS.REVIEW
							) {
								await editData
									.updateOne({
										programCurrentStatus: constants.PROGRAM_STATUS.REVIEW,
										deleted: false,
										status: null,
									})
									.session(session);

								await historyEditProgramService.findNewestAndUpdateStatusHistoryEdit(
									response,
									session,
									editData,
									constants.PROGRAM_STATUS.REVIEW
								);
								await session.commitTransaction();
								session.endSession();
								return logger.status200Msg(response, system.success, system.review);
							} else {
								session.endSession();
								return logger.status400(
									response,
									challengerProgramConstant.errorUpdate,
									errors,
									system.error
								);
							}
							break;
						case constants.PROGRAM_STATUS.APPROVAL:
							if (
								editData.programCurrentStatus === constants.PROGRAM_STATUS.UPLOAD ||
								editData.programCurrentStatus === constants.PROGRAM_STATUS.REVIEW ||
								editData.programCurrentStatus === constants.PROGRAM_STATUS.EDIT
							) {
								// Update upload program status to approval and delete
								editData.programCurrentStatus = constants.PROGRAM_STATUS.APPROVAL;
								editData.deleted = true;
								await editData.save({ session: session });

								// Update program status to approval
								program.programCurrentStatus = constants.PROGRAM_STATUS.APPROVAL;
								program.deleted = false;
								await program.save({ session: session });

								// Update program status to approval
								program.programCurrentStatus = program.programCurrentStatus;
								program.isEdit = false;
								const dataUpdate = JSON.parse(JSON.stringify(editData));
								delete dataUpdate.programCurrentStatus;
								delete dataUpdate.programID;
								delete dataUpdate._id;
								delete dataUpdate.createdAt;

								dataUpdate.deleted = false;

								// get key in array formData
								const keyData = Object.keys(dataUpdate);

								// loop each key in array of formData and assign
								keyData.forEach((update) => {
									return (program[update] = dataUpdate[update]);
								});
								const updateProgram = await program.save(session);
								// Update parent to approval
								if (program.programTypeVideo === constants.TYPE_VIDEO.SS) {
									await programModel
										.updateOne(
											{
												_id: program.programChildrenSeasonData.parentID,
											},
											{
												programCurrentStatus: constants.PROGRAM_STATUS.APPROVAL,
											}
										)
										.session(session);
								}
								await historyEditProgramService.findNewestAndUpdateStatusHistoryEdit(
									response,
									session,
									editData,
									constants.PROGRAM_STATUS.APPROVAL
								);
								await session.commitTransaction();
								session.endSession();
								return logger.status200(response, system.success, system.approval);
							} else {
								session.endSession();
								return logger.status400(response, challengerProgramConstant.errorUpdate, errors);
							}
							break;
						case constants.PROGRAM_STATUS.DENIAL:
							if (
								editData.programCurrentStatus === constants.PROGRAM_STATUS.UPLOAD ||
								editData.programCurrentStatus === constants.PROGRAM_STATUS.REVIEW ||
								editData.programCurrentStatus === constants.PROGRAM_STATUS.EDIT
							) {
								// return status for program
								await program
									.updateOne({
										programCurrentStatus: constants.PROGRAM_STATUS.DENIAL,
										deleted: false,
										isEdit: false,
										programEditor: editData.programEditor,
									})
									.session(session);

								// Update parent to approval
								if (program.programTypeVideo === constants.TYPE_VIDEO.SS) {
									await programModel.updateOne(
										{
											_id: program.programChildrenSeasonData.parentID,
										},
										{
											programCurrentStatus: constants.PROGRAM_STATUS.APPROVAL,
										}
									);
								}

								// delete program upload
								await editData
									.updateOne({
										deleted: true,
										programCurrentStatus: constants.PROGRAM_STATUS.DENIAL,
									})
									.session(session);

								await historyEditProgramService.findNewestAndUpdateStatusHistoryEdit(
									response,
									session,
									editData,
									constants.PROGRAM_STATUS.DENIAL
								);

								await session.commitTransaction();
								session.endSession();
								return logger.status200(response, system.success, system.denied);
							} else {
								session.endSession();
								return logger.status400(response, challengerProgramConstant.errorUpdate, errors);
							}
							break;
						case constants.PROGRAM_STATUS.DELETE:
							if (
								editData.programCurrentStatus === constants.PROGRAM_STATUS.UPLOAD ||
								editData.programCurrentStatus === constants.PROGRAM_STATUS.REVIEW ||
								editData.programCurrentStatus === constants.PROGRAM_STATUS.EDIT
							) {
								// return status for program
								await program
									.updateOne({
										isEdit: false,
										deleted: false,

										// increase times to edit
										programEditor: editData.programEditor,
									})
									.session(session);

								await editData
									.updateOne({
										deleted: false,
										programCurrentStatus: constants.PROGRAM_STATUS.DELETE,
									})
									.session(session);

								await historyEditProgramService.findNewestAndUpdateStatusHistoryEdit(
									response,
									session,
									editData,
									constants.PROGRAM_STATUS.DELETE
								);
								await session.commitTransaction();
								session.endSession();
								return logger.status200(response, system.success, system.deleted);
							} else {
								session.endSession();
								return logger.status400(response, challengerProgramConstant.errorUpdate, errors);
							}
							break;
						// case constants.PROGRAM_STATUS.UPLOAD:
						// 	if (editData.programCurrentStatus === constants.PROGRAM_STATUS.EDIT) {
						// 		await editData
						// 			.updateOne({
						// 				programCurrentStatus: constants.PROGRAM_STATUS.UPLOAD,
						// 			})
						// 			.session(session);
						// 		await session.commitTransaction();
						// 		session.endSession();
						// 		return logger.status200(response, system.success, 'Change status success');
						// 	} else {
						// 		session.endSession();
						// 		return logger.status400(response, challengerProgramConstant.errorUpdate, errors);
						// 	}
						// 	break;
						default:
							session.endSession();
							return logger.status400(response, challengerProgramConstant.errorUpdate, errors);
							break;
					}
				}
				session.endSession();
				return logger.status404(response, errors, challengerProgramConstant.notFound(params.id));
			}
			session.endSession();
			return logger.status403(response, system.permission);
		} catch (error) {
			await session.abortTransaction();
			session.endSession();
			errors.push(error.message);
			return logger.status400(response, error, errors, system.error);
		}
	}

	// [PUT] /admin/challengerEdit/:id
	async update(request, response, next) {
		const paramsData = request.params;
		const formData = request.body;
		const errors = [];
		let session = await mongoose.startSession();
		session.startTransaction();
		try {
			formData.programCurrentStatus = constants.PROGRAM_STATUS.EDIT;
			const challenger = await programEditModel
				.findByIdAndUpdate({ _id: paramsData.id }, formData, {
					new: true,
					runValidators: true,
				})
				.session(session);
			await session.commitTransaction();
			session.endSession();
			return logger.status200(response, system.success, '', challenger);
		} catch (error) {
			await session.abortTransaction();
			session.endSession();
			errors.push(error.message);
			return logger.status400(response, error, errors, system.error);
		}
	}

	// [GET] /admin/challenger-challenger/status
	async statusAll(request, response, next) {
		const errors = [];
		try {
			const query = {};
			if (request.query.date) {
				query.updatedAt = {
					$gte: new Date(request.query.date + ' 00:00:00').toUTCString(),
					$lte: new Date(request.query.date + ' 23:59:59').toUTCString(),
				};
			}
			const arrStatus = Object.values(constants.PROGRAM_STATUS);
			const result = await Promise.all(
				[...arrStatus, 'total'].map(async (status) => {
					const currentStatus = status;
					if (status === 'total') status = /.*/;
					return {
						[currentStatus]: await programEditModel.countDocuments({
							programType: constants.PROGRAM_TYPE.CHALLENGER,
							deleted: false,
							programCurrentStatus: status,
							...query,
							isPending: false,
						}),
					};
				})
			);

			const data = Object.assign(...result);
			return logger.status200(response, system.success, '', data);
		} catch (error) {
			errors.push(error.message);
			return logger.status500(response, error, errors);
		}
	}

	// [GET] /admin/challenger/list-soft-delete
	async listSoftDelete(request, response, next) {
		const errors = [];
		const selectFields = [
			'programName',
			'programCurrentStatus',
			'createdAt',
			'updatedAt',
			'isResultLetter',
			'programID',
		];
		try {
			request.query.programType = constants.PROGRAM_TYPE.CHALLENGER;
			request.query.deleted = true;
			request.query.programCurrentStatus = constants.PROGRAM_STATUS.DELETE;
			const challengerProDel = await businessQuery.handle(
				programEditModel,
				request,
				{ path: 'userID', select: ['userName', 'userEmail'] },
				selectFields
			);
			return logger.status200(response, system.success, '', challengerProDel);
		} catch (error) {
			errors.push(error.message);
			return logger.status500(response, error, errors, system.error);
		}
	}

	// [GET] /admin/challenger/request-delete
	async listDelete(request, response, next) {
		const errors = [];
		const selectFields = [
			'programName',
			'programCurrentStatus',
			'createdAt',
			'updatedAt',
			'isResultLetter',
			'programID',
		];
		try {
			request.query.programType = constants.PROGRAM_TYPE.CHALLENGER;
			request.query.deleted = false;
			request.query.programCurrentStatus = constants.PROGRAM_STATUS.DELETE;

			if (request.query.id) {
				const users = await userModel.distinct('_id', {
					userEmail: new RegExp(request.query.id, 'i'),
				});
				request.query.userID = { $in: users };
			}
			delete request.query.id;
			const challengerReqDel = await businessQuery.handle(
				programEditModel,
				request,
				{ path: 'userID', select: ['userName', 'userEmail'] },
				selectFields
			);

			return logger.status200(response, system.success, '', challengerReqDel);
		} catch (error) {
			errors.push(error.message);
			return logger.status500(response, error, errors, system.error);
		}
	}

	// [POST] /admin/challenger-program/history/:id
	async addHistory(request, response, next) {
		const formData = request.body;
		const params = request.params;
		const user = request.user;
		let session = await mongoose.startSession();
		session.startTransaction();
		const errors = [];
		try {
			if (!formData.status || !Object.values(constants.HISTORY_STATUS).includes(formData.status)) {
				session.endSession();
				return logger.status400(response, system.statusInvalid, errors);
			}
			const checkProgram = await programModel.findById(params.id);
			if (!checkProgram) {
				session.endSession();
				return logger.status404(response, system.error, system.notFoundProgram(params.id));
			}

			if (checkProgram.programTypeVideo === constants.TYPE_VIDEO.SS) {
				formData.programParentID = checkProgram?.programChildrenSeasonData?.parentID || undefined;
			}

			const history = new HistoryProgramModel({
				manager: user._id,
				managerName: user.userName,
				programID: params.id,
				typeProgram: constants.TYPE_PROGRAM_HISTORY.CHALLENGER_PROGRAM,
				receiverID: checkProgram.userID || undefined,
				...formData,
			});

			if (checkProgram.isResultLetter === false) {
				checkProgram.isResultLetter = true;
				await checkProgram.save({ session: session });
			}

			const dataProgram = await programEditModel.findOne({ _id: params.id }).populate({
				path: 'userID',
			});

			history.receiverID = dataProgram.userID._id.toString() || undefined
			await history.save({ session: session });

			await session.commitTransaction();
			session.endSession();
			const dataSendEmail = {
				programTitle: dataProgram.programName,
				programCurrentStatus: dataProgram.programCurrentStatus,
				message: formData.content,
				subject: emailConstant.GET_SUBJECT_EMAIL(
					dataProgram.programCurrentStatus,
					dataProgram.programName,
					dataProgram.programType
				),
			};

			sendEmail.sendEmailChangeStatusProgram('', dataProgram.userID.userEmail, dataSendEmail);
			PushNotificationController.pushNotificationChangeStatus(dataProgram, user);
			return logger.status200(response, system.success, system.addSuccessHistory, history);
		} catch (error) {
			await session.abortTransaction();
			session.endSession();
			errors.push(error.message);
			return logger.status400(response, error, errors);
		}
	}

	// [GET] /admin/challenger-program/history/:id
	async getHistory(request, response, next) {
		const params = request.params;
		const errors = [];
		try {
			const checkProgram = await programModel.findById(params.id);
			if (!checkProgram) {
				return logger.status404(response, system.error, system.notFoundProgram(params.id));
			}
			if (checkProgram.programTypeVideo === constants.TYPE_VIDEO.SS && !checkProgram.programSeasonChild && checkProgram.verifyDenial === null) {
				request.query.programParentID = params.id;
			} else {
				request.query.programID = params.id;
			}

			if (request.query.status === constants.HISTORY_TYPE.DELETE) {
				request.query.status = constants.HISTORY_TYPE.DELETE;
			} else if (request.query.status === constants.HISTORY_TYPE.NOT_DELETE) {
				request.query.status = {
					$ne: constants.HISTORY_TYPE.DELETE,
				};
			}
			const histories = await businessQuery.handle(HistoryProgramModel, request);
			return logger.status200(response, system.success, '', histories);
		} catch (error) {
			errors.push(error.message);
			return logger.status400(response, error, errors);
		}
	}

	// [GET] /admin/challenger/history-newest/:id
	async getHistoryNewest(request, response, next) {
		const params = request.params;
		const errors = [];
		try {
			const checkProgram = await programModel.findById(params.id);
			if (!checkProgram) {
				return logger.status404(response, system.error, system.notFoundProgram(params.id));
			}

			if (checkProgram.programTypeVideo === constants.TYPE_VIDEO.SS && !checkProgram.programSeasonChild && checkProgram.verifyDenial === null) {
				request.query.programParentID = params.id;
			} else {
				request.query.programID = params.id;
			}

			if (request.query.status === constants.HISTORY_TYPE.DELETE) {
				request.query.status = constants.HISTORY_TYPE.DELETE;
			} else if (request.query.status === constants.HISTORY_TYPE.NOT_DELETE) {
				request.query.status = {
					$ne: constants.HISTORY_TYPE.DELETE,
				};
			}
			const history = await HistoryProgramModel.findOne({
				...request.query,
			}).sort({
				createdAt: -1,
			});
			return logger.status200(response, system.success, '', history);
		} catch (error) {
			errors.push(error.message);
			return logger.status400(response, error, errors);
		}
	}

	// [GET] /admin/challenger/episodes
	async getEpisodes(request, response, next) {
		const params = request.query;
		const errors = [];
		try {
			if (!params.programID || !params.seasonID) {
				return logger.status404(response, system.error, system.missingField);
			}
			const program = await programEditModel.findOne({
				_id: params.programID,
				programType: constants.PROGRAM_TYPE.CHALLENGER,
			});
			if (!program) {
				return logger.status404(response, system.error, system.notFoundProgram(params.programID));
			}
			const result = program.programSeasonData.find(
				(item) => item._id && item._id.toString() === params.seasonID
			);

			if (!result) {
				return logger.status404(response, system.error, system.notFoundSeasonID);
			}
			return logger.status200(response, system.success, '', result.seasonEpisode);
		} catch (error) {
			errors.push(error.message);
			return logger.status400(response, error, errors);
		}
	}
}

module.exports = new ChallengerProgramController();
