const mongoose = require('mongoose');
const Schema = mongoose.Schema;

//library for validator data
// const validator = require('validator');

// library for soft delete
const mongooseDelete = require('mongoose-delete');
const AutoIncrement = require('mongoose-sequence')(mongoose);
const mongoosePaginate = require('mongoose-paginate-v2');

const CategoriesSetSchema = new Schema(
    {
        categoriesID: {
            type: Number,
        },
        categoriesName: {
            type: String,
            required: true,
        },
        slugName: {
            type: String,
            required: true,
            unique: true,
        },
        categoriesListCount: {
            type: Number,
            default: 0,
            validate(value) {
                if (value < 0) {
                    throw new Error('categories set list count is positive number');
                }
            },
        },
        categoriesArrayList: [
            {
                type: Schema.Types.ObjectId,
                ref: 'ListSchema',
            },
        ],
        categoriesImageSurvey: {
            type: String,
            default: null,
        },
        isSurvey: {
            type: Boolean,
            default: false,
        },
        indexOfSurvey: {
            type: Number,
            default: 1,
        },
        categoritesPosterDate: {
            type: Date,
            default: Date.now,
        },
        categoritesPosterProgramID: {
            type: Schema.Types.ObjectId,
            ref: 'ProgramSchema',
            default: null,
        },
    },
    {
        timestamps: true,
        collection: 'categories_set',
    }
);

// custom query helpers
CategoriesSetSchema.query.sortable = function (request) {
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
CategoriesSetSchema.plugin(AutoIncrement, { inc_field: 'categoriesID' });

// add plugins soft delete
CategoriesSetSchema.plugin(mongooseDelete, {
    overrideMethods: 'all',
    deletedAt: true,
});

CategoriesSetSchema.plugin(mongoosePaginate);

CategoriesSetSchema.paramLike = ['categoriesName'];

// CategoriesSetSchema.virtual('listProgramList', {
//     ref: 'ProgramSchema', // table challenger
//     localField: '_id', // _id of user
//     foreignField: '', // field contain id of user in challenger model
// });

// mongoose.set("debug", (collectionName, method, query, doc) => {
//     if (process.env.DEBUG) {
//         console.log(`${collectionName}.${method}`, JSON.stringify(query), doc);
//     }
// });

module.exports = mongoose.model('CategoriesSetSchema', CategoriesSetSchema);
