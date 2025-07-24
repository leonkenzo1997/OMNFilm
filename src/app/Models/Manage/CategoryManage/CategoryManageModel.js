const mongoose = require('mongoose');
const Schema = mongoose.Schema;

//library for validator data
const validator = require('validator');

// library for soft delete
const mongooseDelete = require('mongoose-delete');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const CategoryManageSchema = new Schema(
    {
        categoryMangeID: {
            type: Number,
        },
        categoryMangeName: {
            type: String,
        },
        categoryMangeArrayTag:[
            {
                type: Schema.Types.ObjectId,
                ref: 'TagSchema',
            },
        ],
        categoryMangeUsage: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true,
        collection: 'category_mange',
    },
);


// using hiding private data of categoryMange when relate data and send for the client
CategoryManageSchema.methods.toJSON = function () {
    const categoryMange = this;
    const categoryMangeObject = categoryMange.toObject();
    delete categoryMangeObject.__v;
    return categoryMangeObject;
};

// custom query helpers
CategoryManageSchema.query.sortable = function (request) {
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
CategoryManageSchema.plugin(AutoIncrement, { inc_field: 'categoryMangeID' });

// add plugins soft delete
CategoryManageSchema.plugin(mongooseDelete, {
    overrideMethods: 'all',
    deletedAt: true,
});

const categoryManageModel = mongoose.model('CategoryManageSchema', CategoryManageSchema);
module.exports = categoryManageModel;
