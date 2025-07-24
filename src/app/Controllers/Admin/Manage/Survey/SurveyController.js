const mongoose = require('mongoose');
const surveyModel = require('../../../../Models/CategoriesSet/CategoriesSetModel');

const system = require('../../../../Constant/General/SystemConstant');
const logger = require('../../../../Constant/Logger/loggerConstant');

const businessQuery = require('../../../../Business/QueryModel');
const userModel = require('../../../../Models/User/UserModel');
const CategoriesSetModel = require('../../../../Models/CategoriesSet/CategoriesSetModel');

class SurveyController {
    // [GET] /admin/categoriesset/list-survey
    async index(request, response, next) {
        const errors = [];
        const selectField = [
            '_id',
            'categoriesName',
            'categoriesImageSurvey',
            'isSurvey',
            'createdAt',
            'indexOfSurvey',
        ];
        try {
            const survey = await surveyModel
                .find({ isSurvey: true })
                .select(selectField)
                .limit(12);
            return logger.status200(response, system.success, '', survey);
        } catch (error) {
            errors.push(error.message);
            return logger.status500(response, error, errors);
        }
    }

    // [GET] /admin/categoriesset/list-survey
    async listNotSurvey(request, response, next) {
        const errors = [];

        try {
            const survey = await CategoriesSetModel.find({
                isSurvey: false,
                // search function
                categoriesName: new RegExp(request.query.categoriesName, 'i'),
            });
            return logger.status200(response, system.success, '', survey);
        } catch (error) {
            errors.push(error.message);
            return logger.status500(response, error, errors);
        }
    }

    //[PUT] /admin/categoriesset/update-survey
    async updateSurvey(request, response, next) {
        const errors = [];
        const params = request.params;
        const formData = request.body;
        const selectField = [
            '_id',
            'categoriesName',
            'categoriesImageSurvey',
            'isSurvey',
            'createdAt',
            'indexOfSurvey',
        ];
        let session = await mongoose.startSession();
        session.startTransaction();
        try {
            const updateSurvey = await surveyModel.findById({ _id: params.id });

            if (!formData.isSurvey) {
                updateSurvey.isSurvey = formData.isSurvey;
                await updateSurvey.save({ session: session });
                await session.commitTransaction();
                session.endSession();
                return logger.status200(
                    response,
                    system.success,
                    system.addSuccessSurvey(params.id),
                    updateSurvey
                );
            } else {
                const survey = await surveyModel
                    .find({ isSurvey: true })
                    .select(selectField);

                if (survey.length >= 12) {
                    session.endSession();
                    return logger.status400(response, system.listSurveyLimit, errors);
                }

                updateSurvey.isSurvey = formData.isSurvey;
                await updateSurvey.save({ session: session });
                await session.commitTransaction();
                session.endSession();
                return logger.status200(
                    response,
                    system.success,
                    system.addSuccessSurvey(params.id),
                    updateSurvey
                );
            }
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            errors.push(error.message);
            return logger.status500(response, error, errors);
        }
    }

    //[PUT] /admin/categoriesset/update-survey
    async updateImageSurvey(request, response, next) {
        const errors = [];
        const params = request.params;
        const formData = request.body;

        let session = await mongoose.startSession();
        session.startTransaction();
        try {
            const updateSurvey = await surveyModel.findById({ _id: params.id });
            updateSurvey.categoriesImageSurvey = formData.categoriesImageSurvey;
            await updateSurvey.save({ session: session });
            await session.commitTransaction();
            session.endSession();
            return logger.status200(
                response,
                system.success,
                system.updateSuccessSurvey(params.id)
            );
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            errors.push(error.message);
            return logger.status500(response, error, errors);
        }
    }
}

module.exports = new SurveyController();
