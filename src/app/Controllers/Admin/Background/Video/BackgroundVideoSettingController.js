const mongoose = require('mongoose');

const backgroundVideoSetting = require('../../../../Models/Background/BackgroundVideoSettingModel');
const businessQuery = require('../../../../Business/QueryModel');

const homeSetService = require('../../../../Service/HomeSet/HomeSetService');

const system = require('../../../../Constant/General/SystemConstant');
const backgroundConstant = require('../../../../Constant/Background/BackgroundConstant');
const logger = require('../../../../Constant/Logger/loggerConstant');

class BackgroundVideoSettingController {
    // [GET] /admin/background/video-setting/
    async index(request, response, next) {
        const errors = [];
        try {
            const relations = {
                path: 'backgroundVideoSettingVideoList',
            };

            let arrayBackgroundVideoSetting = await businessQuery.handle(
                backgroundVideoSetting,
                request,
                relations
            );

            arrayBackgroundVideoSetting.docs = await getCountBackgroundVideo(
                JSON.parse(JSON.stringify(arrayBackgroundVideoSetting.docs))
            );

            return logger.status200(
                response,
                system.success,
                '',
                arrayBackgroundVideoSetting
            );
        } catch (error) {
            errors.push(error.message);
            return logger.status500(response, error, errors);
        }
    }

    // [GET] /admin/background/video-setting/:id
    async detail(request, response, next) {
        const paramsData = request.params;
        const errors = [];
        try {
            let backgroundVideo = await backgroundVideoSetting
                .findById(paramsData.id)
                .populate({
                    path: 'homesetCategoriesList',
                    populate: {
                        path: 'categoriesArrayList',
                    },
                });

            if (!backgroundVideo) {
                return logger.status404(
                    response,
                    system.error,
                    backgroundConstant.notFound(paramsData.id)
                );
            }

            return logger.status200(response, system.success, '', backgroundVideo);
        } catch (error) {
            errors.push(error.message);
            return logger.status400(response, error, errors);
        }
    }

    // [POST] /admin/background/video-setting/create
    async create(request, response, next) {
        const formData = request.body;
        const errors = [];
        let session = await mongoose.startSession();

        try {
            session.startTransaction();

            let data = await new backgroundVideoSetting(formData).save({
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

    // [PUT] /admin/background/:id
    async update(request, response, next) {
        const paramsData = request.params;
        const formData = request.body;
        const errors = [];
        const homesetCategoriesList = formData.hasOwnProperty('homesetCategoriesList');
        const categoriesSetArray = formData.homesetCategoriesList;
        let session = await mongoose.startSession();
        session.startTransaction();

        try {
            if (!homesetCategoriesList) {
                const homeSet = await homeSetService.findAndUpdateData(
                    response,
                    paramsData.id,
                    formData,
                    session
                );

                return logger.status200(
                    response,
                    system.success,
                    backgroundConstant.msgUpdate(paramsData.id),
                    homeSet
                );
            } else {
                if (Array.isArray(categoriesSetArray)) {
                    if (categoriesSetArray.length > 0) {
                        // const dataHomeSet = await homeSetService.countProgramOfHomeSet(response, formData);
                        const dataHomeSet = formData;

                        const homeSet = await homeSetService.findAndUpdateData(
                            response,
                            paramsData.id,
                            dataHomeSet,
                            session
                        );

                        return logger.status200(
                            response,
                            system.success,
                            backgroundConstant.msgUpdate(paramsData.id),
                            homeSet
                        );
                    } else {
                        formData.homesetListCount = 0;
                        const homeSet = await homeSetService.findAndUpdateData(
                            response,
                            paramsData.id,
                            formData,
                            session
                        );

                        return logger.status200(
                            response,
                            system.success,
                            backgroundConstant.msgUpdate(paramsData.id),
                            homeSet
                        );
                    }
                } else {
                    return logger.status200Msg(
                        response,
                        system.error,
                        backgroundConstant.msgHomesetCategoriesListErrorField
                    );
                }
            }
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            errors.push(error.message);
            return logger.status400(response, error, errors);
        }
    }

    // [DELETE] /admin/background/:id
    async destroy(request, response, next) {
        // response.send('Deleted successfully categories!!!!');
        const paramsData = request.params;
        const errors = [];
        let session = await mongoose.startSession();
        try {
            session.startTransaction();
            const homeSet = await backgroundVideoSetting
                .delete({ _id: paramsData.id })
                .session(session);

            if (!homeSet.nModified) {
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
async function getCountBackgroundVideo(doc) {
    try {
        const isArray = Array.isArray(doc);

        if (!isArray) {
            doc = [doc];
        }

        const promise = doc.map((e) => {
            //count program in list background
            e.backgroundVideoSettingCount = e.backgroundVideoSettingVideoList.length;

            const arrayTime = [];
            e.backgroundVideoSettingVideoList.forEach((dataVideo) => {
                arrayTime.push(dataVideo.videoStart);
                arrayTime.push(dataVideo.videoEnd);
            });
            e.backgroundVideoSettingTimeStart = Math.min(...arrayTime);
            e.backgroundVideoSettingTimeEnd = Math.max(...arrayTime);
            return e;
        });
        let data = await Promise.all(promise);

        return isArray ? data : data[0];
    } catch (error) {
        console.error(error);
        return doc;
    }
}

module.exports = new BackgroundVideoSettingController();
