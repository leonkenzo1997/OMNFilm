const mongoose = require('mongoose');
const Schema = mongoose.Schema;

//library for validator data
const validator = require('validator');

// library for soft delete
const mongooseDelete = require('mongoose-delete');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const CompanyInforSchema = new Schema(
    {
        companyInforID: {
            type: Number,
        },
        companyInforContent: {
            type: String,
        },
    },
    {
        timestamps: true,
        collection: 'company_infor',
    },
);

// custom query helpers
CompanyInforSchema.query.sortable = function (request) {
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
CompanyInforSchema.plugin(AutoIncrement, { inc_field: 'companyInforID' });

// add plugins soft delete
CompanyInforSchema.plugin(mongooseDelete, {
    overrideMethods: 'all',
    deletedAt: true,
});

const companyInforModel = mongoose.model(
    'CompanyInforSchema',
    CompanyInforSchema,
);
module.exports = companyInforModel;
