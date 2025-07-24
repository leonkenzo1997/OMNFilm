const mongoose = require('mongoose');
const Schema = mongoose.Schema;

//library for validator data
const validator = require('validator');

// library for soft delete
const mongooseDelete = require('mongoose-delete');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const AreaCodeSchema = new Schema(
    {
        areaCodeID: {
            type: Number,
        },
        name: {
            type: String,
        },
        domain: {
            type: String,
        },
        language: {
            type: String,
        },
        capital: {
            type: String,
        },
        nativeName: {
            type: String,
        },
        alpha2Code: {
            type: String,
        },
        alpha3Code: {
            type: String,
        },
        areaCode: {
            type: String,
        },
        region: {
            type: String,
        },
        subregion: {
            type: String,
        },
        cioc: {
            type: String,
        },
        flag: {
            type: String,
        },
        flagBase64: {
            type: String,
        },
    },
    {
        timestamps: true,
        collection: 'area_code',
    },
);

// custom query helpers
AreaCodeSchema.query.sortable = function (request) {
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
AreaCodeSchema.plugin(AutoIncrement, { inc_field: 'areaCodeID' });

// add plugins soft delete
AreaCodeSchema.plugin(mongooseDelete, {
    overrideMethods: 'all',
    deletedAt: true,
});

const areaCodeModel = mongoose.model('AreaCodeSchema', AreaCodeSchema);
module.exports = areaCodeModel;
