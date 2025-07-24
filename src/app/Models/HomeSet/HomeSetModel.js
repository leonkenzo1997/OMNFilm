const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// library for soft delete
const mongooseDelete = require('mongoose-delete');
const AutoIncrement = require('mongoose-sequence')(mongoose);
const mongoosePaginate = require('mongoose-paginate-v2');
const businessQuery = require('../../Business/QueryModel');

const HomeSetSchema = new Schema(
    {
        homesetID: {
            type: Number,
        },
        homesetName: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
        },
        slugName: {
            type: String,
            required: true,
            unique: true
        },
        homesetListCount: {
            type: Number,
            default: 0,
            validate(value) {
                if (value < 0) {
                    throw new Error('home set list count is positive number');
                }
            },
        },
        homesetCategoriesList: [
            {
                type: Schema.Types.ObjectId,
                ref: 'CategoriesSetSchema',
            },
        ],
        homesetMon: {
            type: Boolean,
            default: false,
        },
        homesetTue: {
            type: Boolean,
            default: false,
        },
        homesetWed: {
            type: Boolean,
            default: false,
        },
        homesetThu: {
            type: Boolean,
            default: false,
        },
        homesetFri: {
            type: Boolean,
            default: false,
        },
        homesetSat: {
            type: Boolean,
            default: false,
        },
        homesetSun: {
            type: Boolean,
            default: false,
        },
        homesetTimeStart: {
            type: String,
        },
        homesetTimeEnd: {
            type: String,
        },
    },
    {
        timestamps: true,
        collection: 'home_set',
    },
);

// custom query helpers
HomeSetSchema.query.sortable = function (request) {
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
HomeSetSchema.plugin(AutoIncrement, { inc_field: 'homesetID' });

// add plugins soft delete
HomeSetSchema.plugin(mongooseDelete, {
    overrideMethods: 'all',
    deletedAt: true,
});

HomeSetSchema.plugin(mongoosePaginate);

HomeSetSchema.paramLike = ['homesetName'];

module.exports = mongoose.model('HomeSetSchema', HomeSetSchema);
