const mongoose = require('mongoose');
const Schema = mongoose.Schema;

//library for validator data
const validator = require('validator');

// library for soft delete
const mongooseDelete = require('mongoose-delete');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const TagSchema = new Schema(
    {
        tagID: {
            type: Number,
        },
        tagName: {
            type: String,
        },
        tagUsage: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true,
        collection: 'tag',
    },
);


// using hiding private data of tag when relate data and send for the client
TagSchema.methods.toJSON = function () {
    const tag = this;
    const tagObject = tag.toObject();
    delete tagObject.__v;
    return tagObject;
};

// custom query helpers
TagSchema.query.sortable = function (request) {
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
TagSchema.plugin(AutoIncrement, { inc_field: 'tagID' });

// add plugins soft delete
TagSchema.plugin(mongooseDelete, {
    overrideMethods: 'all',
    deletedAt: true,
});

const tagModel = mongoose.model('TagSchema', TagSchema);
module.exports = tagModel;
