const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// library for soft delete
const mongooseDelete = require('mongoose-delete');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const ProductionSampleSchema = new Schema(
    {
        productionID: {
            type: Number,
        },
        poster: {
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
        summary: {
            type: String,
        },
        scenario: {
            type: String,
        },
        components: [
            {
                type: Object,
                default: null,
            },
        ],
        reference: [
            {
                type: Object,
                default: null,
            },
        ],
    },
    {
        timestamps: true,
        collection: 'production_sample',
    },
);

//add plugins auto increment id
ProductionSampleSchema.plugin(AutoIncrement, { inc_field: 'productionID' });

// add plugins soft delete
ProductionSampleSchema.plugin(mongooseDelete, {
    overrideMethods: 'all',
    deletedAt: true,
});

module.exports = mongoose.model(
    'ProductionSampleSchema',
    ProductionSampleSchema,
);
