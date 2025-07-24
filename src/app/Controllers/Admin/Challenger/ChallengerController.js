const programModel = require('../../../Models/Program/ProgramModel');
const businessQuery = require('../../../Business/QueryModel');
const system = require('../../../Constant/General/SystemConstant');
const challengerConstant = require('../../../Constant/Challenger/ChallengerConstant');
const programEditModel = require('../../../Models/ProgramEdit/ProgramEditModel');
const userModel = require('../../../Models/User/UserModel');
const HistoryProgramModel = require('../../../Models/Program/HistoryProgramModel');
const historyEditProgramService = require('../../../Service/HistoryEditProgram/HistoryEditProgramService');
const logger = require('../../../Constant/Logger/loggerConstant');
const sendEmail = require('../../../Service/Email/EmailService');
const mongoose = require('mongoose');
const constants = require('../../../Constant/constants');
const programConstant = require('../../../Constant/Program/ProgramConstant');
const emailConstant = require('../../../Constant/Email/EmailConstant');
const PushNotificationController = require('../../User/Push/PushNotificationController');
const adminService = require('../../../Service/Admin/AdminService');

class ChallengerController {
	// [GET] /admin/challenger/list-delete
	async listDelete(request, response, next) {
		const errors = [];

		const selectFields = ['programName', 'programCurrentStatus', 'createdAt', 'updatedAt', 'isResultLetter'];
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
			const challengerDel = await businessQuery.handle(
				programModel,
				request,
				{ path: 'userID', select: ['userName', 'userEmail'] },
				selectFields
			);
			return logger.status200(response, system.success, '', challengerDel);
		} catch (error) {
			errors.push(error.message);
			return logger.status500(response, error, errors, system.error);
		}
	}

	// [GET] /admin/challenger/
	async index(request, response, next) {
		const errors = [];
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
		const selectFields = ['programName', 'programCurrentStatus', 'createdAt', 'updatedAt', 'isResultLetter'];
		try {
			if (request.query.id) {
				const userEmail = new RegExp(request.query.id, 'i');
				const users = await userModel.distinct('_id', { userEmail });
				request.query.userID = {
					$in: users,
				};
			}
			delete request.query.id;

			Object.assign(request.query, programConstant.FIELD_QUERY_DEFAULT);
			const arrayChallenger = await businessQuery.handle(
				programModel,
				request,
				[{ path: 'userID', select: ['userName', 'userEmail'] }],
				selectFields
			);
			return logger.status200(response, system.success, '', arrayChallenger);
		} catch (error) {
			errors.push(error.message);
			return logger.status500(response, error, errors, system.error);
		}
	}

	// [GET] /admin/challenger/:id
	async detail(request, response, next) {
		const paramsData = request.params;
		const errors = [];
		const selectFields = ['userName', 'userEmail'];
		try {
			const challenger = await programModel
				.findById({
					_id: paramsData.id,
				})
				.populate([
					{
						path: 'userID',
						select: selectFields,
					},
					{
						path: 'programCategory.categoryManageId',
						select: 'categoryMangeName',
					},
					{
						path: 'programCategory.categoryArrayTag',
						select: 'tagName',
					},
					{
						path: 'programSeasonData.episode',
						select: 'programChildrenSeasonData',
						match: { isPending: false, deleted: false },
					},
				])
				.lean();
			if (!challenger) {
				return logger.status404(response, system.error, challengerConstant.notFound(paramsData.id));
			}
			if (challenger.programTypeVideo === constants.TYPE_VIDEO.SS && challenger.programSeasonChild) {
				challenger.programSeasonData = (
					(await programModel
						.findById(challenger.programChildrenSeasonData.parentID)
						.populate({ path: 'programSeasonData.episode', select: 'programChildrenSeasonData', match: { deleted: false } })) || {}
				).programSeasonData;
				challenger.programChildrenSeasonData.seasonID = (
					challenger.programSeasonData.find((item) => {
						return item.seasonName === challenger.programChildrenSeasonData.seasonName;
					}) || {}
				)._id;
			}
			return logger.status200(response, system.success, '', challenger);
		} catch (error) {
			errors.push(error.message);
			return logger.status400(response, error, errors, system.error);
		}
	}

	// [GET] /admin/challenger/list-delete/:id
	async detailDelete(request, response, next) {
		let paramsData = request.params;
		const errors = [];
		try {
			const challenger = await programModel.findOneDeleted({
				_id: paramsData.id,
			});

			if (!challenger) {
				return logger.status404(response, system.error, challengerConstant.notFound(paramsData.id));
			} else {
				return logger.status200(response, system.success, '', challenger);
			}
		} catch (error) {
			errors.push(error.message);
			return logger.status400(response, error, errors, system.error);
		}
	}

	// [PUT] /admin/challenger/:id
	async updateStatus(request, response, next) {
		const paramsData = request.params;
		const formData = request.body;
		const updates = Object.keys(formData);
		let errors = [];
		let allowedStatus = [];
		let user = request.user;

		let session = await mongoose.startSession();
		session.startTransaction();

		try {
			//only allow change status
			const allowedUpdates = ['programCurrentStatus'];
			const isValidOperation = updates.every((update) => {
				return allowedUpdates.includes(update);
			});

			if (!isValidOperation) {
				session.endSession();
				const fields = updates.filter((item) => !allowedUpdates.includes(item)).join(', ');
				return logger.status400(response, system.invalidField + fields, errors, system.error);
			}

			//check permision user
			if (user && user.userType) {
				//admin
				allowedStatus = [
					constants.PROGRAM_STATUS.REVIEW,
					constants.PROGRAM_STATUS.OMN,
					constants.PROGRAM_STATUS.DENIAL,
					constants.PROGRAM_STATUS.APPROVAL,
					constants.PROGRAM_STATUS.DELETE,
					constants.PROGRAM_STATUS.INSTANT,
					constants.PROGRAM_STATUS.EDIT,
				];
			} else {
				session.endSession();
				return logger.status400(response, challengerConstant.permissionError, errors, system.error);
			}

			if (!allowedStatus.includes(formData.programCurrentStatus)) {
				session.endSession();
				return logger.status400(response, challengerConstant.permissionError, errors, system.error);
			}

			let dataOld = await programModel.findById({
				_id: paramsData.id,
				programType: constants.PROGRAM_TYPE.CHALLENGER,
				deleted: false,
			});

			if (!dataOld) {
				session.endSession();
				return logger.status404(response, system.error, challengerConstant.notFound(paramsData.id));
			}

			// Not update parent
			if (dataOld.programTypeVideo === constants.TYPE_VIDEO.SS && !dataOld.programSeasonChild) {
				session.endSession();
				return logger.status400(response, programConstant.updateParentAdmin, []);
			}

			const status = formData.programCurrentStatus;
			const dataOldJson = dataOld.toObject();

			switch (status) {
				case constants.PROGRAM_STATUS.REVIEW:
					if (
						dataOldJson.programCurrentStatus === constants.PROGRAM_STATUS.UPLOAD ||
						dataOldJson.programCurrentStatus === constants.PROGRAM_STATUS.DENIAL ||
						dataOldJson.programCurrentStatus === constants.PROGRAM_STATUS.EDIT
					) {
						await dataOld.updateOne(formData).session(session);

						await session.commitTransaction();
						session.endSession();
						return logger.status200Msg(
							response,
							system.success,
							challengerConstant.msgUpdate(paramsData.id)
						);
					} else {
						session.endSession();
						return logger.status400(response, challengerConstant.errorUpdate, errors, system.error);
					}
					break;
				case constants.PROGRAM_STATUS.DENIAL:
					if (dataOldJson.programCurrentStatus === constants.PROGRAM_STATUS.INSTANT) {
						session.endSession();
						return logger.status400(response, challengerConstant.errorUpdate, errors);
					}

					await dataOld
						.updateOne({
							...formData,
							programDisplay: false,
						})
						.session(session);
					await session.commitTransaction();
					session.endSession();

					// Check type is Season
					if (dataOldJson.programTypeVideo === constants.TYPE_VIDEO.SS) {
						const check = await programModel.findOne({
							'programChildrenSeasonData.parentID': dataOldJson.programChildrenSeasonData.parentID,
							programSeasonChild: true,
							programCurrentStatus: {
								$in: [
									constants.PROGRAM_STATUS.INSTANT,
									constants.PROGRAM_STATUS.OMN,
									constants.PROGRAM_STATUS.APPROVAL,
								],
							},
						});

						// Update parent if no one approval
						if (!check) {
							await programModel.updateOne(
								{
									_id: dataOldJson.programChildrenSeasonData.parentID,
								},
								{
									$set: {
										programCurrentStatus: constants.PROGRAM_STATUS.REVIEW,
										programDisplay: false,
									},
								}
							);
						}

						// Socket for episode
						adminService.notiStatusEpisodeOffline(dataOld, status);
					}
					return logger.status200Msg(response, system.success, challengerConstant.msgUpdate(paramsData.id));
					break;
				case constants.PROGRAM_STATUS.DELETE:
					await dataOld
						.updateOne({
							...formData,
							programDisplay: false,
						})
						.session(session);

					// Check type is Season
					if (dataOldJson.programTypeVideo === constants.TYPE_VIDEO.SS) {
						const parent = await programModel.findById(dataOld.programChildrenSeasonData.parentID);

						if (parent) {
							parent.programCurrentStatus = constants.PROGRAM_STATUS.REVIEW;
							parent.programDisplay = false;

							parent.programSeasonData.forEach((item) => {
								if (item.seasonName === dataOld.programChildrenSeasonData.seasonName) {
									item.episodeDeleted && item.episodeDeleted.length
										? item.episodeDeleted.push(dataOld._id)
										: item.episodeDeleted = [dataOld._id];

									item.episodeDeleted = _.uniqWith(item.episodeDeleted, _.isEqual);
								}
							});

							await parent.save({ session });
						}

						// Socket for episode
						adminService.notiStatusEpisodeOffline(dataOld, status);
					}

					await session.commitTransaction();
					session.endSession();
					return logger.status200Msg(response, system.success, challengerConstant.msgUpdate(paramsData.id));
					break;
				case constants.PROGRAM_STATUS.INSTANT:
					if (dataOldJson.programCurrentStatus === constants.PROGRAM_STATUS.DENIAL) {
						session.endSession();
						return logger.status400(response, uploadConstant.errorUpdate, errors);
					}
					formData.programDisplay = true;
					formData.programType = constants.PROGRAM_TYPE.UPLOAD;
					await dataOld.updateOne(formData).session(session);

					// Check type is Season
					if (dataOldJson.programTypeVideo === constants.TYPE_VIDEO.SS) {
						// Update parent to approval
						const parent = await programModel.findById(dataOld.programChildrenSeasonData.parentID);

						if (parent) {
							let episodeDeleted = [];

							// If all episode deleted has approval => parent display in online
							parent.programSeasonData.forEach((item) => {
								if (item.seasonName === dataOld.programChildrenSeasonData.seasonName) {
									episodeDeleted = item.episodeDeleted
										? _.differenceWith(item.episodeDeleted, [dataOld._id], _.isEqual)
										: [];

									item.episodeDeleted = episodeDeleted;
								}
							});

							if (!episodeDeleted.length) {
								parent.programCurrentStatus = constants.PROGRAM_STATUS.APPROVAL;
								parent.programDisplay = true;
							}

							parent.programType = constants.PROGRAM_TYPE.UPLOAD;
							await parent.save({ session });
						}

						// Update children programType to upload
						await programModel
							.updateOne(
								{
									'programChildrenSeasonData.parentID':
										dataOldJson.programChildrenSeasonData.parentID,
									programSeasonChild: true,
								},
								{
									$set: {
										programType: constants.PROGRAM_TYPE.UPLOAD,
									},
								}
							)
							.session(session);

						// Socket for episode
						adminService.notiStatusEpisodeOffline(dataOld, status);
					}

					PushNotificationController.pushNotificationNewProgram(dataOld, user);

					await session.commitTransaction();
					session.endSession();
					return logger.status200Msg(response, system.success, challengerConstant.msgUpdate(paramsData.id));
					break;
				case constants.PROGRAM_STATUS.APPROVAL:
					if (
						[
							constants.PROGRAM_STATUS.UPLOAD,
							constants.PROGRAM_STATUS.REVIEW,
							constants.PROGRAM_STATUS.EDIT,
							constants.PROGRAM_STATUS.DENIAL,
						].includes(dataOldJson.programCurrentStatus)
					) {
						if (dataOldJson.programCurrentStatus === constants.PROGRAM_STATUS.EDIT) {
							const findProgramEdit = await programEditModel.findOne({
								programID: dataOldJson._id,
								userID: dataOldJson.userID,
								programCurrentStatus: {
									$in: [constants.PROGRAM_STATUS.EDIT, constants.PROGRAM_STATUS.UPLOAD],
								},
							});

							if (findProgramEdit) {
								session.endSession();
								return logger.status200Msg(response, system.success, challengerConstant.msgProgram);
							}
						}
						await dataOld.updateOne(formData).session(session);

						// Check type is Season
						if (dataOldJson.programTypeVideo === constants.TYPE_VIDEO.SS) {
							// Update parent to approval
							const parent = await programModel.findById(dataOld.programChildrenSeasonData.parentID);

							if (parent) {
								let episodeDeleted = [];

								// If all episode deleted has approval => parent display in online
								parent.programSeasonData.forEach((item) => {
									if (item.seasonName === dataOld.programChildrenSeasonData.seasonName) {
										episodeDeleted = item.episodeDeleted
											? _.differenceWith(item.episodeDeleted, [dataOld._id], _.isEqual)
											: [];

										item.episodeDeleted = episodeDeleted;
									}
								});

								if (!episodeDeleted.length) {
									parent.programCurrentStatus = constants.PROGRAM_STATUS.APPROVAL;
								}
								await parent.save({ session });
							}

							// Socket for episode
							adminService.notiStatusEpisodeOffline(dataOld, status);
						}

						await session.commitTransaction();
						session.endSession();

						return logger.status200Msg(
							response,
							system.success,
							challengerConstant.msgUpdate(paramsData.id)
						);
					} else {
						session.endSession();
						return logger.status400(response, challengerConstant.errorUpdate, errors);
					}
					break;
				case constants.PROGRAM_STATUS.OMN:
					if (
						[
							constants.PROGRAM_STATUS.UPLOAD,
							constants.PROGRAM_STATUS.REVIEW,
							constants.PROGRAM_STATUS.APPROVAL,
						].includes(dataOldJson.programCurrentStatus)
					) {
						formData.programType = constants.PROGRAM_TYPE.UPLOAD;
						await dataOld.updateOne(formData).session(session);

						// Check type is Season
						if (dataOldJson.programTypeVideo === constants.TYPE_VIDEO.SS) {
							// Update parent to approval
							const parent = await programModel.findById(dataOld.programChildrenSeasonData.parentID);

							if (parent) {
								let episodeDeleted = [];

								// If all episode deleted has approval => parent display in online
								parent.programSeasonData.forEach((item) => {
									if (item.seasonName === dataOld.programChildrenSeasonData.seasonName) {
										episodeDeleted = item.episodeDeleted
											? _.differenceWith(item.episodeDeleted, [dataOld._id], _.isEqual)
											: [];

										item.episodeDeleted = episodeDeleted;
									}
								});

								if (!episodeDeleted.length) {
									parent.programCurrentStatus = constants.PROGRAM_STATUS.APPROVAL;
								}

								parent.programType = constants.PROGRAM_TYPE.UPLOAD;
								await parent.save({ session });
							}

							// Update children programType to upload
							await programModel
								.updateOne(
									{
										'programChildrenSeasonData.parentID':
											dataOldJson.programChildrenSeasonData.parentID,
										programSeasonChild: true,
									},
									{
										$set: {
											programType: constants.PROGRAM_TYPE.UPLOAD,
										},
									}
								)
								.session(session);

							// Socket for episode
							adminService.notiStatusEpisodeOffline(dataOld, status);
						}

						await session.commitTransaction();
						session.endSession();
						return logger.status200Msg(
							response,
							system.success,
							challengerConstant.msgUpdate(paramsData.id)
						);
					} else {
						session.endSession();
						return logger.status400(response, challengerConstant.errorUpdate, errors);
					}
					break;
				case constants.PROGRAM_STATUS.EDIT:
					if (
						dataOldJson.programCurrentStatus === constants.PROGRAM_STATUS.UPLOAD ||
						dataOldJson.programCurrentStatus === constants.PROGRAM_STATUS.REVIEW ||
						dataOldJson.programCurrentStatus === constants.PROGRAM_STATUS.DENIAL ||
						dataOldJson.programCurrentStatus === constants.PROGRAM_STATUS.OMN
					) {
						await dataOld.updateOne(formData).session(session);
						await session.commitTransaction();
						session.endSession();

						// Add history
						request.body = {
							status: 'edit',
							title: 'Change status program to edit',
							content: 'Change status program to edit',
						};
						request.params.id = dataOld._id;
						await ChallengerController.prototype.addHistory(request, response, next);
						// return logger.status200Msg(
						// 	response,
						// 	system.success,
						// 	challengerConstant.msgUpdate(paramsData.id)
						// );
					} else if (dataOldJson.programCurrentStatus === constants.PROGRAM_STATUS.APPROVAL) {
						dataOldJson.programID = dataOldJson._id;
						let findProgramEdit = await programEditModel.findOne({
							programID: dataOldJson._id,
							userID: dataOldJson.userID,
							programCurrentStatus: {
								$in: [constants.PROGRAM_STATUS.EDIT, constants.PROGRAM_STATUS.UPLOAD],
							},
						});
						if (!findProgramEdit) {
							dataOldJson.programID = dataOldJson._id;
							delete dataOldJson._id;
							dataOldJson.programCurrentStatus = constants.PROGRAM_STATUS.EDIT;
							findProgramEdit = new programEditModel(dataOldJson);
							findProgramEdit.createdAt = Date.now();
							findProgramEdit.updatedAt = Date.now();
							await findProgramEdit.save({ session: session });

							await dataOld
								.updateOne({
									programCurrentStatus: constants.PROGRAM_STATUS.EDIT,
									deleted: true,
								})
								.session(session);
							await session.commitTransaction();
							session.endSession();

							// Check type is Season
							if (dataOldJson.programTypeVideo === constants.TYPE_VIDEO.SS) {
								const check = await programModel.findOne({
									'programChildrenSeasonData.parentID':
										dataOldJson.programChildrenSeasonData.parentID,
									programSeasonChild: true,
									programCurrentStatus: {
										$in: [
											constants.PROGRAM_STATUS.INSTANT,
											constants.PROGRAM_STATUS.OMN,
											constants.PROGRAM_STATUS.APPROVAL,
										],
									},
								});

								// Update parent if no one approval
								if (!check) {
									await programModel.updateOne(
										{
											_id: dataOldJson.programChildrenSeasonData.parentID,
										},
										{
											$set: {
												programCurrentStatus: constants.PROGRAM_STATUS.REVIEW,
											},
										}
									);
								}
							}

							// Add history
							request.body = {
								status: 'edit',
								title: 'Change status program to edit',
								content: 'Change status program to edit',
							};
							request.params.id = dataOld._id;
							await ChallengerController.prototype.addHistory(request, response, next);
							// return logger.status200Msg(
							// 	response,
							// 	system.success,
							// 	challengerConstant.msgUpdate(paramsData.id)
							// );
						} else {
							session.endSession();
							return logger.status400(response, challengerConstant.errorUpdate, errors);
						}
					} else {
						session.endSession();
						return logger.status400(response, challengerConstant.errorUpdate, errors);
					}
					break;
				default:
					session.endSession();
					return logger.status400(response, challengerConstant.errorUpdate, errors);
					break;
			}
		} catch (error) {
			await session.abortTransaction();
			session.endSession();
			errors.push(error.message);
			return logger.status400(response, error, errors, system.error);
		}
	}

	async updateStatusNewFlow(request, response, next) {
		const paramsData = request.params;
		const formData = request.body;
		const updates = Object.keys(formData);
		let errors = [];
		let allowedStatus = [];
		let user = request.user;

		let session = await mongoose.startSession();
		session.startTransaction();

		try {
			//only allow change status
			const allowedUpdates = ['programCurrentStatus'];
			const isValidOperation = updates.every((update) => {
				return allowedUpdates.includes(update);
			});

			if (!isValidOperation) {
				session.endSession();
				const fields = updates.filter((item) => !allowedUpdates.includes(item)).join(', ');
				return logger.status400(response, system.invalidField + fields, errors, system.error);
			}

			//check permision user
			if (user && user.userType) {
				//admin
				allowedStatus = [
					constants.PROGRAM_STATUS.REVIEW,
					constants.PROGRAM_STATUS.OMN,
					constants.PROGRAM_STATUS.DENIAL,
					constants.PROGRAM_STATUS.APPROVAL,
					constants.PROGRAM_STATUS.DELETE,
					constants.PROGRAM_STATUS.INSTANT,
				];
			} else {
				session.endSession();
				return logger.status400(response, challengerConstant.permissionError, errors, system.error);
			}

			if (!allowedStatus.includes(formData.programCurrentStatus)) {
				session.endSession();
				return logger.status400(response, challengerConstant.permissionError, errors, system.error);
			}

			let dataOld = await programModel.findById({
				_id: paramsData.id,
				programType: constants.PROGRAM_TYPE.CHALLENGER,
				deleted: false,
			});

			if (!dataOld) {
				session.endSession();
				return logger.status404(response, system.error, challengerConstant.notFound(paramsData.id));
			}

			// Not update parent
			if (dataOld.programTypeVideo === constants.TYPE_VIDEO.SS && !dataOld.programSeasonChild) {
				session.endSession();
				return logger.status400(response, programConstant.updateParentAdmin, []);
			}

			const status = formData.programCurrentStatus;
			const dataOldJson = dataOld.toObject();

			switch (status) {
				case constants.PROGRAM_STATUS.REVIEW:
					if (
						dataOldJson.programCurrentStatus === constants.PROGRAM_STATUS.UPLOAD ||
						dataOldJson.programCurrentStatus === constants.PROGRAM_STATUS.DENIAL ||
						dataOldJson.programCurrentStatus === constants.PROGRAM_STATUS.EDIT
					) {
						await dataOld.updateOne(formData).session(session);

						if (dataOld.programTypeVideo === constants.TYPE_VIDEO.SS) {
							const checkStatusParent = await programModel.findOne({
								'programChildrenSeasonData.parentID': dataOldJson.programChildrenSeasonData.parentID,
								programSeasonChild: true,
								programCurrentStatus: {
									$ne: constants.PROGRAM_STATUS.APPROVAL,
								},
							});

							if (checkStatusParent) {
								await programModel
									.updateOne(
										{
											_id: dataOldJson.programChildrenSeasonData.parentID,
										},
										{
											$set: {
												programCurrentStatus: constants.PROGRAM_STATUS.REVIEW,
												programDisplay: false,
											},
										}
									)
									.session(session);
							}
						}

						await historyEditProgramService.findNewestAndUpdateStatusHistoryEdit(
							response,
							session,
							dataOldJson,
							constants.PROGRAM_STATUS.REVIEW
						);

						await session.commitTransaction();
						session.endSession();
						return logger.status200Msg(
							response,
							system.success,
							challengerConstant.msgUpdate(paramsData.id)
						);
					} else {
						session.endSession();
						return logger.status400(response, challengerConstant.errorUpdate, errors, system.error);
					}
					break;
				case constants.PROGRAM_STATUS.DENIAL:
					if (dataOldJson.programCurrentStatus === constants.PROGRAM_STATUS.INSTANT) {
						session.endSession();
						return logger.status400(response, challengerConstant.errorUpdate, errors);
					}

					await dataOld
						.updateOne({
							...formData,
							programDisplay: false,
						})
						.session(session);

					// Check type is Season
					if (dataOldJson.programTypeVideo === constants.TYPE_VIDEO.SS) {
						const check = await programModel.findOne({
							'programChildrenSeasonData.parentID': dataOldJson.programChildrenSeasonData.parentID,
							programSeasonChild: true,
							programCurrentStatus: {
								$in: [
									constants.PROGRAM_STATUS.INSTANT,
									constants.PROGRAM_STATUS.OMN,
									constants.PROGRAM_STATUS.APPROVAL,
								],
							},
							_id: { $ne: dataOld._id }
						});

						// Update parent if no one approval
						if (!check) {
							await programModel
								.updateOne(
									{
										_id: dataOldJson.programChildrenSeasonData.parentID,
									},
									{
										$set: {
											programCurrentStatus: constants.PROGRAM_STATUS.DENIAL,
											programDisplay: false,
										},
									}
								)
								.session(session);
						}

						// Socket for episode
						adminService.notiStatusEpisodeOffline(dataOld, status);
					}

					await historyEditProgramService.findNewestAndUpdateStatusHistoryEdit(
						response,
						session,
						dataOldJson,
						constants.PROGRAM_STATUS.DENIAL
					);

					await session.commitTransaction();
					session.endSession();
					return logger.status200Msg(response, system.success, challengerConstant.msgUpdate(paramsData.id));
					break;
				case constants.PROGRAM_STATUS.DELETE:
					await dataOld
						.updateOne({
							...formData,
							programDisplay: false,
						})
						.session(session);

					// Check type is Season
					if (dataOldJson.programTypeVideo === constants.TYPE_VIDEO.SS) {
						const parent = await programModel.findById(dataOld.programChildrenSeasonData.parentID);

						if (parent) {
							parent.programCurrentStatus = constants.PROGRAM_STATUS.REVIEW;
							parent.programDisplay = false;

							parent.programSeasonData.forEach((item) => {
								if (item.seasonName === dataOld.programChildrenSeasonData.seasonName) {
									item.episodeDeleted && item.episodeDeleted.length
										? item.episodeDeleted.push(dataOld._id)
										: item.episodeDeleted = [dataOld._id];

									item.episodeDeleted = _.uniqWith(item.episodeDeleted, _.isEqual);
								}
							});

							await parent.save({ session });
						}

						// Socket for episode
						adminService.notiStatusEpisodeOffline(dataOld, status);
					}

					await historyEditProgramService.findNewestAndUpdateStatusHistoryEdit(
						response,
						session,
						dataOldJson,
						constants.PROGRAM_STATUS.DELETE
					);

					await session.commitTransaction();
					session.endSession();
					return logger.status200Msg(response, system.success, challengerConstant.msgUpdate(paramsData.id));
					break;
				case constants.PROGRAM_STATUS.INSTANT:
					if (dataOldJson.programCurrentStatus === constants.PROGRAM_STATUS.DENIAL) {
						session.endSession();
						return logger.status400(response, uploadConstant.errorUpdate, errors);
					}
					formData.programDisplay = true;
					formData.programType = constants.PROGRAM_TYPE.UPLOAD;
					await dataOld.updateOne(formData).session(session);

					// Check type is Season
					if (dataOldJson.programTypeVideo === constants.TYPE_VIDEO.SS) {
						// Update parent to approval
						const parent = await programModel.findById(dataOld.programChildrenSeasonData.parentID);

						if (parent) {
							let episodeDeleted = [];

							// If all episode deleted has approval => parent display in online
							parent.programSeasonData.forEach((item) => {
								if (item.seasonName === dataOld.programChildrenSeasonData.seasonName) {
									episodeDeleted = item.episodeDeleted
										? _.differenceWith(item.episodeDeleted, [dataOld._id], _.isEqual)
										: [];

									item.episodeDeleted = episodeDeleted;
								}
							});

							if (!episodeDeleted.length) {
								parent.programCurrentStatus = constants.PROGRAM_STATUS.APPROVAL;
								parent.programDisplay = true;
							}

							parent.programType = constants.PROGRAM_TYPE.UPLOAD;
							await parent.save({ session });
						}

						// Update children programType to upload
						await programModel
							.updateMany(
								{
									'programChildrenSeasonData.parentID':
										dataOldJson.programChildrenSeasonData.parentID,
									programSeasonChild: true,
								},
								{
									$set: {
										programType: constants.PROGRAM_TYPE.UPLOAD,
									},
								}
							)
							.session(session);

						// Socket for episode
						adminService.notiStatusEpisodeOffline(dataOld, status);
					}

					await historyEditProgramService.findNewestAndUpdateStatusHistoryEdit(
						response,
						session,
						dataOldJson,
						constants.PROGRAM_STATUS.INSTANT
					);

					PushNotificationController.pushNotificationNewProgram(dataOld, user);

					await session.commitTransaction();
					session.endSession();
					return logger.status200Msg(response, system.success, challengerConstant.msgUpdate(paramsData.id));
					break;
				case constants.PROGRAM_STATUS.APPROVAL:
					if (
						[
							constants.PROGRAM_STATUS.UPLOAD,
							constants.PROGRAM_STATUS.REVIEW,
							constants.PROGRAM_STATUS.EDIT,
							constants.PROGRAM_STATUS.DENIAL,
						].includes(dataOldJson.programCurrentStatus)
					) {
						await dataOld.updateOne(formData).session(session);

						// Check type is Season
						if (dataOldJson.programTypeVideo === constants.TYPE_VIDEO.SS) {
							// Update parent to approval
							const parent = await programModel.findById(dataOld.programChildrenSeasonData.parentID);

							if (parent) {
								let episodeDeleted = [];

								// If all episode deleted has approval => parent display in online
								parent.programSeasonData.forEach((item) => {
									if (item.seasonName === dataOld.programChildrenSeasonData.seasonName) {
										episodeDeleted = item.episodeDeleted
											? _.differenceWith(item.episodeDeleted, [dataOld._id], _.isEqual)
											: [];

										item.episodeDeleted = episodeDeleted;
									}
								});

								if (!episodeDeleted.length) {
									parent.programCurrentStatus = constants.PROGRAM_STATUS.APPROVAL;
								}
								await parent.save({ session });
							}

							// Socket for episode
							adminService.notiStatusEpisodeOffline(dataOld, status);
						}

						await historyEditProgramService.findNewestAndUpdateStatusHistoryEdit(
							response,
							session,
							dataOldJson,
							constants.PROGRAM_STATUS.APPROVAL
						);

						await session.commitTransaction();
						session.endSession();

						return logger.status200Msg(
							response,
							system.success,
							challengerConstant.msgUpdate(paramsData.id)
						);
					} else {
						session.endSession();
						return logger.status400(response, challengerConstant.errorUpdate, errors);
					}
					break;
				case constants.PROGRAM_STATUS.OMN:
					if (
						[
							constants.PROGRAM_STATUS.UPLOAD,
							constants.PROGRAM_STATUS.REVIEW,
							constants.PROGRAM_STATUS.APPROVAL,
							constants.PROGRAM_STATUS.EDIT,
						].includes(dataOldJson.programCurrentStatus)
					) {
						formData.programType = constants.PROGRAM_TYPE.UPLOAD;
						await dataOld.updateOne(formData).session(session);

						// Check type is Season
						if (dataOldJson.programTypeVideo === constants.TYPE_VIDEO.SS) {
							// Update parent to approval
							const parent = await programModel.findById(dataOld.programChildrenSeasonData.parentID);

							if (parent) {
								let episodeDeleted = [];

								// If all episode deleted has approval => parent display in online
								parent.programSeasonData.forEach((item) => {
									if (item.seasonName === dataOld.programChildrenSeasonData.seasonName) {
										episodeDeleted = item.episodeDeleted
											? _.differenceWith(item.episodeDeleted, [dataOld._id], _.isEqual)
											: [];

										item.episodeDeleted = episodeDeleted;
									}
								});

								if (!episodeDeleted.length) {
									parent.programCurrentStatus = constants.PROGRAM_STATUS.APPROVAL;
								}

								parent.programType = constants.PROGRAM_TYPE.UPLOAD;
								await parent.save({ session });
							}

							// Update children programType to upload
							await programModel
								.updateMany(
									{
										'programChildrenSeasonData.parentID':
											dataOldJson.programChildrenSeasonData.parentID,
										programSeasonChild: true,
									},
									{
										$set: {
											programType: constants.PROGRAM_TYPE.UPLOAD,
										},
									}
								)
								.session(session);

							// Socket for episode
							adminService.notiStatusEpisodeOffline(dataOld, status);
						}

						await historyEditProgramService.findNewestAndUpdateStatusHistoryEdit(
							response,
							session,
							dataOldJson,
							constants.PROGRAM_STATUS.OMN
						);

						await session.commitTransaction();
						session.endSession();
						return logger.status200Msg(
							response,
							system.success,
							challengerConstant.msgUpdate(paramsData.id)
						);
					} else {
						session.endSession();
						return logger.status400(response, challengerConstant.errorUpdate, errors);
					}
					break;
				default:
					session.endSession();
					return logger.status400(response, challengerConstant.errorUpdate, errors);
					break;
			}
		} catch (error) {
			await session.abortTransaction();
			session.endSession();
			errors.push(error.message);
			return logger.status400(response, error, errors, system.error);
		}
	}

	// [PATCH] /admin/challenger/:id/restore
	async restore(request, response, next) {
		const paramsData = request.params;
		const errors = [];
		let session = await mongoose.startSession();
		session.startTransaction();

		try {
			const challenger = await programModel
				.restore({
					_id: paramsData.id,
				})
				.session(session);

			if (!challenger) {
				await session.commitTransaction();
				session.endSession();
				return logger.status404(response, system.error, challengerConstant.notFound(paramsData.id));
			} else {
				await session.commitTransaction();
				session.endSession();
				return logger.status200(response, system.success, challengerConstant.msgRestore(paramsData.id));
			}
		} catch (error) {
			await session.abortTransaction();
			session.endSession();
			errors.push(error.message);
			return logger.status400(response, error, errors, system.error);
		}
	}

	// [DELETE] /admin/challenger/:id
	async destroy(request, response, next) {
		const paramsData = request.params;
		const errors = [];
		let session = await mongoose.startSession();
		session.startTransaction();

		try {
			const challenger = await programModel
				.delete({
					_id: paramsData.id,
				})
				.session(session);

			if (!challenger) {
				session.endSession();
				return logger.status404(response, system.error, challengerConstant.notFound(paramsData.id));
			}
			await session.commitTransaction();
			session.endSession();
			return logger.status200(response, system.success, challengerConstant.msgDelete(paramsData.id));
		} catch (error) {
			await session.abortTransaction();
			session.endSession();
			errors.push(error.message);
			return logger.status500(response, error, errors, system.error);
		}
	}

	// [DELETE] /admin/challenger/:id/complete-destroy
	async completeDestroy(request, response, next) {
		const paramsData = request.params;
		const errors = [];
		let session = await mongoose.startSession();
		session.startTransaction();

		try {
			const challenger = await programModel
				.deleteOne({
					_id: paramsData.id,
				})
				.session(session);

			if (!challenger) {
				session.endSession();
				return logger.status404(response, system.error, challengerConstant.notFound(paramsData.id));
			}
			await session.commitTransaction();
			session.endSession();
			return logger.status200(response, system.success, challengerConstant.msgCompleteDelete(paramsData.id));
		} catch (error) {
			await session.abortTransaction();
			session.endSession();
			errors.push(error.message);
			return logger.status500(response, error, errors, system.error);
		}
	}

	async view(request, response, next) {
		const params = request.params;
		const errors = [];
		let session = await mongoose.startSession();
		session.startTransaction();

		try {
			let programChallenger = await programModel.findOne({
				_id: params.id,
			});

			if (!programChallenger) {
				session.endSession();
				return logger.status404(response, system.error, challengerConstant.notFound(params.id));
			} else {
				let date = new Date();
				let month = date.getMonth() + 1;
				let year = date.getFullYear();
				if (programChallenger.programView) {
					if (programChallenger.programView[year] && programChallenger.programView[year][0][month]) {
						programChallenger.programView[year][0][month]['view'] += 1;
						// programChallenger.programView[year][0][month]['basic'] = 99;
						// programChallenger.programView[year][0][month]['standard'] = 100;
						// programChallenger.programView[year][0][month]['premium'] = 1000;
					} else {
						if (programChallenger.programView[year]) {
							programChallenger.programView[year][0][month] = {
								view: 1,
								basic: 0,
								standard: 0,
								premium: 0,
							};
						} else {
							programChallenger.programView[year] = [
								{
									[month]: {
										view: 1,
										basic: 0,
										standard: 0,
										premium: 0,
									},
								},
							];
						}
					}
				} else {
					programChallenger.programView = {
						[year]: [
							{
								[month]: {
									view: 1,
									basic: 0,
									standard: 0,
									premium: 0,
								},
							},
						],
					};
				}

				if (programChallenger.programView) {
					let total = 0;
					Object.entries(programChallenger.programView).forEach(([v, va]) => {
						Object.entries(va).forEach(([i, vals]) => {
							Object.entries(vals).forEach(([o, number]) => {
								if (number.view) {
									total += number.view;
								}
							});
						});
					});
					programChallenger.programTotalView = total;
				} else {
					programChallenger.programTotalView = 0;
				}

				var newChallenger = new programModel(programChallenger);
				await newChallenger.save({ session: session });
				await session.commitTransaction();
				session.endSession();
				return logger.status200(response, system.success, '', programChallenger);
			}
		} catch (error) {
			await session.abortTransaction();
			session.endSession();
			errors.push(error.message);
			return logger.status400(response, error, errors, system.error);
		}
	}

	// [GET] /admin/challenger/status
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
						[currentStatus]: await programModel.countDocuments({
							programType: constants.PROGRAM_TYPE.CHALLENGER,
							deleted: false,
							programCurrentStatus: status,
							...query,
							programSeasonChild: true,
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
		const selectFields = ['programName', 'programCurrentStatus', 'createdAt', 'updatedAt', 'isResultLetter'];
		try {
			request.query.programType = constants.PROGRAM_TYPE.CHALLENGER;
			request.query.deleted = true;
			request.query.programCurrentStatus = constants.PROGRAM_STATUS.DELETE;
			const challengerDel = await businessQuery.handle(
				programModel,
				request,
				{ path: 'userID', select: ['userName', 'userEmail'] },
				selectFields
			);
			return logger.status200(response, system.success, '', challengerDel);
		} catch (error) {
			errors.push(error.message);
			return logger.status500(response, error, errors, system.error);
		}
	}

	// [POST] /admin/challenger/history/:id
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
				return logger.status404(response, false, system.notFoundProgram(params.id));
			}

			if (checkProgram.programTypeVideo === constants.TYPE_VIDEO.SS) {
				formData.programParentID = checkProgram?.programChildrenSeasonData?.parentID || undefined;
			}

			const history = new HistoryProgramModel({
				manager: user._id,
				managerName: user.userName,
				programID: params.id,
				typeProgram: constants.TYPE_PROGRAM_HISTORY.CHALLENGER,
				receiverID: checkProgram.userID || undefined,
				...formData,
			});

			if (checkProgram.isResultLetter === false) {
				checkProgram.isResultLetter = true;
				await checkProgram.save({ session: session });
			}

			const dataProgram = await programModel.findOne({ _id: params.id }).populate({
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

			PushNotificationController.pushNotificationChangeStatus(dataProgram, user);
			if (dataProgram.userID && dataProgram.userID.userEmail) {
				sendEmail.sendEmailChangeStatusProgram('', dataProgram.userID.userEmail, dataSendEmail);
			}
			return logger.status200(response, system.success, system.addSuccessHistory, history);
		} catch (error) {
			await session.abortTransaction();
			session.endSession();
			errors.push(error.message);
			return logger.status400(response, error, errors);
		}
	}

	// [GET] /admin/challenger/history/:id
	async getHistory(request, response, next) {
		const params = request.params;
		const errors = [];
		try {
			const checkProgram = await programModel.findById(params.id);
			if (!checkProgram) {
				return logger.status404(response, false, system.notFoundProgram(params.id));
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
				return logger.status404(response, false, system.notFoundProgram(params.id));
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
				return logger.status404(response, false, system.missingField);
			}
			const program = await programModel.findOne({
				_id: params.programID,
				programType: constants.PROGRAM_TYPE.CHALLENGER,
			});
			if (!program) {
				return logger.status404(response, false, system.notFoundProgram(params.programID));
			}
			const result = program.programSeasonData.find(
				(item) => item._id && item._id.toString() === params.seasonID
			);
			if (!result) {
				return logger.status404(response, false, system.notFoundSeasonID);
			}
			return logger.status200(response, system.success, '', result.seasonEpisode);
		} catch (error) {
			errors.push(error.message);
			return logger.status400(response, error, errors);
		}
	}

	// [GET] /admin/challenger/children/:id
	async getListChildren(request, response, next) {
		const params = request.params;
		const errors = [];
		try {
			request.query.programType = constants.PROGRAM_TYPE.CHALLENGER;
			request.query.deleted = false;
			request.query['programChildrenSeasonData.parentID'] = params.id;
			request.query.programSeasonChild = true;
			const selectFields = [
				'programName',
				'programCurrentStatus',
				'createdAt',
				'updatedAt',
				'isResultLetter',
				'programChildrenSeasonData',
			];
			const arrayChallenger = await businessQuery.handle(
				programModel,
				request,
				[{ path: 'userID', select: ['userName', 'userEmail'] }],
				selectFields
			);
			return logger.status200(response, system.success, '', arrayChallenger);
		} catch (error) {
			errors.push(error.message);
			return logger.status400(response, error, errors);
		}
	}

	async update(request, response, next) {
		const formData = request.body;
		const params = request.params;
		let session = await mongoose.startSession();
		session.startTransaction();

		const errors = [];
		try {
			// get key in array formData
			const keyData = Object.keys(formData);
			const challenger = await programModel.findOne({ _id: params.id });

			// loop each key in array of formData and assign
			keyData.forEach((update) => {
				return (challenger[update] = formData[update]);
			});

			const dataChallenger = await upload.save({ session: session });
			await session.commitTransaction();
			session.endSession();
			return logger.status200(response, system.success, challengerConstant.msgUpdate(params.id), dataChallenger);
		} catch (error) {
			await session.abortTransaction();
			session.endSession();
			errors.push(error.message);
			return logger.status400(response, error, errors);
		}
	}
}

module.exports = new ChallengerController();
