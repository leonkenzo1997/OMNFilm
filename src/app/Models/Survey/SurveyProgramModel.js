const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const mongooseDelete = require('mongoose-delete');
const mongoosePaginate = require('mongoose-paginate-v2');

const SurveyProgramModelSchema = new Schema(
    {
        programID: {
            type: Schema.Types.ObjectId,
            ref: 'ProgramSchema',
        },
        userID: {
            type: Schema.Types.ObjectId,
            ref: 'UserSchema',
        },
        statistics: {
            type: Object,
            default: {},
        },
        reason: {
            type: String,
            default: '',
        },
        template: {
            type: Number,
            default: 0,
        },
        nameTemplate: {
            type: String,
        },
        status: {
            type: String,
            default: '',
        },
        surveys: [
            {
                title: {
                    type: String,
                    default: '',
                },
                group: {
                    type: String,
                    default: '',
                },
                questions: [
                    {
                        label: {
                            type: String,
                            default: '',
                        },
                        type: {
                            type: String,
                            default: '',
                        },
                        value: {
                            type: String,
                            default: '',
                        },
                        answer: {
                            type: Array,
                            default: [],
                        },
                    },
                ],
            },
        ],
    },
    {
        timestamps: true,
        collection: 'survey_program',
    }
);

// add plugins soft delete
SurveyProgramModelSchema.plugin(mongooseDelete, {
    overrideMethods: 'all',
    deletedAt: true,
});

SurveyProgramModelSchema.plugin(mongoosePaginate);

SurveyProgramModelSchema.methods.toJSON = function () {
    const survey = this;
    const surveyObject = survey.toObject();
    delete surveyObject.deleted;
    delete surveyObject.createdAt;
    delete surveyObject.updatedAt;
    delete surveyObject.__v;
    return surveyObject;
};

module.exports = mongoose.model('SurveyProgramModelSchema', SurveyProgramModelSchema);
