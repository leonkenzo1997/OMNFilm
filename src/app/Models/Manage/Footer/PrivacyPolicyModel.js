const mongoose = require('mongoose');
const Schema = mongoose.Schema;

//library for validator data
const validator = require('validator');

// library for soft delete
const mongooseDelete = require('mongoose-delete');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const PrivacyPolicySchema = new Schema(
    {
        privacyPolicyID: {
            type: Number,
        },
        privacyPolicyContent: {
            type: String,
        },
    },
    {
        timestamps: true,
        collection: 'privacy_policy',
    },
);

// custom query helpers
PrivacyPolicySchema.query.sortable = function (request) {
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
PrivacyPolicySchema.plugin(AutoIncrement, { inc_field: 'privacyPolicyID' });

// add plugins soft delete
PrivacyPolicySchema.plugin(mongooseDelete, {
    overrideMethods: 'all',
    deletedAt: true,
});

const privacyPolicyModel = mongoose.model(
    'PrivacyPolicySchema',
    PrivacyPolicySchema,
);
module.exports = privacyPolicyModel;
