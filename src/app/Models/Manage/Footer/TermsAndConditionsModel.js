const mongoose = require('mongoose');
const Schema = mongoose.Schema;

//library for validator data
const validator = require('validator');

// library for soft delete
const mongooseDelete = require('mongoose-delete');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const TermsAndConditionsSchema = new Schema(
    {
        termsAndConditionsID: {
            type: Number,
        },
        termsAndConditionsContent: {
            type: String,
        },
    },
    {
        timestamps: true,
        collection: 'terms_and_conditions',
    },
);

// custom query helpers
TermsAndConditionsSchema.query.sortable = function (request) {
    let query = request.query;
    let sort = query.hasOwnProperty('_sort'); // hasOwnProperty return true or false

    if (sort) {
        const isValidType = ['asc', 'desc'].includes(query.type);
        return this.sort({
            [query.column]: isValidType ? query.type : 'desc',
        });
    }

    return this;
};

//add plugins auto increment id
TermsAndConditionsSchema.plugin(AutoIncrement, {
    inc_field: 'termsAndConditionsID',
});

// add plugins soft delete
TermsAndConditionsSchema.plugin(mongooseDelete, {
    overrideMethods: 'all',
    deletedAt: true,
});

const termsAndConditionsModel = mongoose.model(
    'TermsAndConditionsSchema',
    TermsAndConditionsSchema,
);
module.exports = termsAndConditionsModel;
