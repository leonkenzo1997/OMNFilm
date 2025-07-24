const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// library for soft delete
const mongooseDelete = require('mongoose-delete');
const mongoosePaginate = require('mongoose-paginate-v2');

const RecentVideoSchema = new Schema(
    {
        userID: {
            type: Schema.Types.ObjectId,
            ref: 'UserSchema'
        },
        programID: {
            type: Schema.Types.ObjectId,
            ref: 'ProgramSchema'
        },
        categoryID: {
            type: Schema.Types.ObjectId,
            ref: 'CategoryManageSchema'
        }
    },
    {
        timestamps: true,
        collection: 'recent_video',
    },
);

// custom query helpers
RecentVideoSchema.query.sortable = function (request) {
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

RecentVideoSchema.plugin(mongoosePaginate);

// add plugins soft delete
RecentVideoSchema.plugin(mongooseDelete, {
    overrideMethods: 'all',
    deletedAt: true,
});

module.exports = mongoose.model('RecentVideoSchema', RecentVideoSchema);
