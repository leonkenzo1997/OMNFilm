const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const mongooseDelete = require('mongoose-delete');
const mongoosePaginate = require('mongoose-paginate-v2');

const SurveyModelSchema = new Schema(
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
                    default: ''
                },
                type: {
                    type: String,
                    default: ''
                },
                value: {
                    type: String,
                    default: ''
                },
                answer: {
                    type: Array,
                    default: []
                }
            }
        ]
    },
    {
        timestamps: true,
        collection: 'survey_admin',
    },
);

// add plugins soft delete
SurveyModelSchema.plugin(mongooseDelete, {
    overrideMethods: 'all',
    deletedAt: true,
});

SurveyModelSchema.plugin(mongoosePaginate);

SurveyModelSchema.methods.toJSON = function () {
	const survey = this;
	const surveyObject = survey.toObject();
	delete surveyObject.deleted;
    delete surveyObject.createdAt;
    delete surveyObject.updatedAt;
    delete surveyObject.__v;
	return surveyObject;
};

module.exports = mongoose.model('SurveyModelSchema', SurveyModelSchema);
