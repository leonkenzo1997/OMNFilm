const mongoose = require('mongoose');

const backgroundPosterSettingModel = require('../../../../Models/Background/BackgroundPosterSettingModel');
const businessQuery = require('../../../../Business/QueryModel');

// const homeSetService = require('../../../../Service/HomeSet/HomeSetService');
const categoriesSetModel = require('../../../../Models/CategoriesSet/CategoriesSetModel');
const programModel = require('../../../../Models/Program/ProgramModel');

const system = require('../../../../Constant/General/SystemConstant');
const backgroundConstant = require('../../../../Constant/Background/BackgroundConstant');
const logger = require('../../../../Constant/Logger/loggerConstant');

const constants = require('../../../../Constant/constants');

class BackgroundPosterSettingController {
    // [GET] /admin/background/poster-setting/

    async index(request, response, next) {
        const errors = [];

        try {
            const relations = {
                path: 'categoritesPosterProgramID',
                select: 'programName programImagePosterNoTitle programImagePoster',
            };

            let arrayBackgroundPosterSetting = await businessQuery.handle(
                categoriesSetModel,
                request,
                relations,
                'categoriesName categoritesPosterProgramID categoritesPosterDate categoriesID'
            );

            const data = JSON.parse(JSON.stringify(arrayBackgroundPosterSetting));

            await Promise.all(
                data.docs.map((item) => {
                    if (!item.categoritesPosterProgramID) {
                        item.shouldViewPoster = false;
                    } else {
                        item.shouldViewPoster = true;
                    }

                    item.id = item.categoriesID;
                    delete item.categoriesID;
                })
            );

            return logger.status200(response, system.success, '', data);
        } catch (error) {
            errors.push(error.message);
            return logger.status500(response, error, errors);
        }
    }

    async searchProgram(request, response) {
        const errors = [];

        try {
            request.query['programCurrentStatus'] = [
                constants.PROGRAM_STATUS.APPROVAL,
                constants.PROGRAM_STATUS.OMN,
                constants.PROGRAM_STATUS.INSTANT,
            ];

            request.query.programType = [
                constants.PROGRAM_TYPE.UPLOAD,
                constants.PROGRAM_TYPE.PROGRAM_ORIGINAL,
            ];

            request.query.programSeasonChild = false;

            const relation = {
                path: 'programCategory.categoryManageId userID',
                select: 'categoryMangeName userName userEmail',
            };

            const select = [
                'programTypeVideo',
                'programCategory.categoryManageId',
                'programName',
                'programType',
                'programImagePosterNoTitle',
                'programImagePoster',
                'userID',
                'programID',
            ];

            const programs = await businessQuery.handle(
                programModel,
                request,
                relation,
                select
            );

            const data = JSON.parse(JSON.stringify(programs));
            await Promise.all(
                data.docs.map((item) => {
                    item.id = item.programID;
                    delete item.programID;
                })
            );
            return logger.status200Data(response, system.success, data);
        } catch (error) {
            errors.push(error.message);
            return logger.status400(response, error, errors);
        }
    }

    // old flow
    // async index(request, response, next) {
    //     const errors = [];
    //     try {
    //         const relations = {
    //             // path: 'backgroundPosterSettingPosterList',
    //             // populate: {
    //             //     path: 'backgroundPosterSettingPosterList.videoID',
    //             //     select: 'backgroundPosterProgramID',
    //             //     populate: {
    //             //         path: 'backgroundPosterProgramID',
    //             //         populate: {
    //             //             path: 'programCategory.categoryManageId programCategory.categoryArrayTag',
    //             //             select: 'categoryMangeName tagName',
    //             //         },
    //             //         select: 'programName programCategory programParticipants programType',
    //             //     },
    //             // },
    //         };

    //         let arrayBackgroundPosterSetting = await businessQuery.handle(
    //             backgroundPosterSettingModel,
    //             request,
    //             relations
    //         );

    //         arrayBackgroundPosterSetting.docs = await getCountBackgroundPoster(
    //             JSON.parse(JSON.stringify(arrayBackgroundPosterSetting.docs))
    //         );

    //         return logger.status200(
    //             response,
    //             system.success,
    //             '',
    //             arrayBackgroundPosterSetting
    //         );
    //     } catch (error) {
    //         errors.push(error.message);
    //         return logger.status500(response, error, errors);
    //     }
    // }

    // [GET] /admin/background/poster-setting/:id
    async detail(request, response, next) {
        const paramsData = request.params;
        const errors = [];
        try {
            let backgroundPosterSetting = await categoriesSetModel
                .findById(paramsData.id)
                .populate({
                    path: 'categoritesPosterProgramID',
                    populate: {
                        path: 'programCategory.categoryManageId userID',
                        select: 'categoryMangeName userName userEmail',
                    },
                    select: backgroundConstant.fieldSelect,
                })
                .select(
                    'categoriesName categoritesPosterProgramID categoritesPosterDate'
                );

            // constructor data to return exact for FE
            const data = {
                programCategory:
                    backgroundPosterSetting.categoritesPosterProgramID.programCategory,
                programImagePosterNoTitle:
                    backgroundPosterSetting.categoritesPosterProgramID
                        .programImagePosterNoTitle,
                programImagePoster:
                    backgroundPosterSetting.categoritesPosterProgramID.programImagePoster,
                programTypeVideo:
                    backgroundPosterSetting.categoritesPosterProgramID.programTypeVideo,
                _id: backgroundPosterSetting.categoritesPosterProgramID._id,
                programType:
                    backgroundPosterSetting.categoritesPosterProgramID.programType,
                programName:
                    backgroundPosterSetting.categoritesPosterProgramID.programName,
                userID: backgroundPosterSetting.categoritesPosterProgramID.userID,
            };

            if (!backgroundPosterSetting) {
                return logger.status404(
                    response,
                    system.error,
                    backgroundConstant.notFound(paramsData.id)
                );
            }

            return logger.status200(response, system.success, '', data);
        } catch (error) {
            errors.push(error.message);
            return logger.status400(response, error, errors);
        }
    }

    // [POST] /admin/background/poster-setting/create
    async create(request, response, next) {
        const formData = request.body;
        const errors = [];
        let session = await mongoose.startSession();

        try {
            session.startTransaction();

            let data = await new backgroundPosterSettingModel(formData).save({
                session: session,
            });

            await session.commitTransaction();
            session.endSession();

            return logger.status201(response, data);
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            errors.push(error.message);
            return logger.status400(response, error, errors);
        }
    }

    // [PUT] /admin/background/poster-setting/:id
    async update(request, response, next) {
        const paramsData = request.params;
        const formData = request.body;
        const errors = [];

        let session = await mongoose.startSession();
        session.startTransaction();

        try {
            const backgroundPosterSetting = await categoriesSetModel
                .findByIdAndUpdate(
                    { _id: paramsData.id },
                    {
                        categoritesPosterProgramID: formData.categoritesPosterProgramID,
                        categoritesPosterDate: Date.now(),
                    },
                    {
                        new: true,
                        runValidators: true,
                        session: session,
                    }
                )
                .populate({
                    path: 'categoritesPosterProgramID',
                    populate: {
                        path: 'programCategory.categoryManageId userID',
                        select: 'categoryMangeName userName userEmail',
                    },
                    select: backgroundConstant.fieldSelect,
                })
                .select(
                    'categoriesName categoritesPosterProgramID categoritesPosterDate'
                );

            await session.commitTransaction();
            session.endSession();
            return logger.status200(
                response,
                system.success,
                backgroundConstant.msgUpdate(paramsData.id),
                backgroundPosterSetting
            );
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            errors.push(error.message);
            return logger.status400(response, error, errors);
        }
    }

    // [DELETE] /admin/background/Poster-setting/:id
    async destroy(request, response, next) {
        const paramsData = request.params;
        const errors = [];
        let session = await mongoose.startSession();
        try {
            session.startTransaction();
            const data = await backgroundPosterSettingModel
                .delete({ _id: paramsData.id })
                .session(session);

            if (!data.nModified) {
                await session.abortTransaction();
                session.endSession();
                return logger.status404(
                    response,
                    system.error,
                    backgroundConstant.notFound(paramsData.id)
                );
            }
            await session.commitTransaction();
            session.endSession();
            return logger.status200(
                response,
                system.success,
                backgroundConstant.msgDelete(paramsData.id)
            );
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            errors.push(error.message);
            return logger.status500(response, error, errors);
        }
    }
}
async function getCountBackgroundPoster(doc) {
    try {
        const isArray = Array.isArray(doc);

        if (!isArray) {
            doc = [doc];
        }

        const promise = doc.map((e) => {
            //count program in list background
            e.backgroundPosterSettingCount = e.backgroundPosterSettingPosterList.length;

            const arrayTime = [];
            e.backgroundPosterSettingPosterList.forEach((dataPoster) => {
                arrayTime.push(dataPoster.posterStart);
                arrayTime.push(dataPoster.posterEnd);
            });
            e.backgroundPosterSettingTimeStart = Math.min(...arrayTime);
            e.backgroundPosterSettingTimeEnd = Math.max(...arrayTime);
            return e;
        });
        let data = await Promise.all(promise);

        return isArray ? data : data[0];
    } catch (error) {
        console.error(error);
        return doc;
    }
}

module.exports = new BackgroundPosterSettingController();
