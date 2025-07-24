const mongoose = require('mongoose');
const Schema = mongoose.Schema;

//library for validator data
const validator = require('validator');

// library for soft delete
const mongooseDelete = require('mongoose-delete');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const VideoManagePolicySchema = new Schema(
    {
        videoManagePolicyID: {
            type: Number,
        },
        videoManagePolicyContent: {
            type: String,
        },
    },
    {
        timestamps: true,
        collection: 'video_manage_policy',
    },
);

// custom query helpers
VideoManagePolicySchema.query.sortable = function (request) {
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
VideoManagePolicySchema.plugin(AutoIncrement, {
    inc_field: 'videoManagePolicyID',
});

// add plugins soft delete
VideoManagePolicySchema.plugin(mongooseDelete, {
    overrideMethods: 'all',
    deletedAt: true,
});

const videoManagePolicyModel = mongoose.model(
    'VideoManagePolicySchema',
    VideoManagePolicySchema,
);
module.exports = videoManagePolicyModel;
