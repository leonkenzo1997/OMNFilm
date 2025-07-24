const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// library for soft delete
const mongooseDelete = require('mongoose-delete');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const SampleManagaSchema = new Schema(
    {
        sampleID: {
            type: Number,
        },
        uploadType: {
            type: String,
            required: true,
        },
        title: {
            type: Object,
        },
        subTitle: {
            type: String,
            default: '',
        },
        category: {
            type: Object,
        },
        participants: {
            type: Object,
            default: null,
        },
        type: {
            type: String,
        },
        contents: {
            type: Object,
            default: {},
        },
        episodeSummary: [
            {
                type: String,
                default: '',
            },
        ],
        musicInfo: [
            {
                type: Object,
                default: null,
            },
        ],
        linkProgram: {
            type: Schema.Types.ObjectId,
            ref: 'ProgramSchema',
        },
    },
    {
        timestamps: true,
        collection: 'sample_manage',
    },
);

//add plugins auto increment id
SampleManagaSchema.plugin(AutoIncrement, { inc_field: 'sampleID' });

// add plugins soft delete
SampleManagaSchema.plugin(mongooseDelete, {
    overrideMethods: 'all',
    deletedAt: true,
});

module.exports = mongoose.model('SampleManagaSchema', SampleManagaSchema);
