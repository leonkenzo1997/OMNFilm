const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// library for soft delete
const mongooseDelete = require('mongoose-delete');
const AutoIncrement = require('mongoose-sequence')(mongoose);
const constants = require('../../Constant/constants');
const mongoosePaginate = require('mongoose-paginate-v2');

const BackgroundVideoSchema = new Schema(
    {
        backgroundVideoID: {
            type: Number,
        },
        backgroundVideoProgramID: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: 'ProgramSchema',
        },
        backgroundVideoTrailer: {
            type: String,
            required: true,
        },
        backgroundVideoType: {
            type: Number,
            default: constants.TYPE_BACKGROUND.VIDEO,
        },
        // backgroundVideoTrailerStatus: {
        //     type: Boolean,
        //     default: true,
        // },
    },
    {
        timestamps: true,
        collection: 'background_video',
    }
);

// custom query helpers
BackgroundVideoSchema.query.sortable = function (request) {
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

// using hiding private data of user when relate data and send for the client
BackgroundVideoSchema.methods.toJSON = function () {
    const backgroundVideo = this;
    const backgroundVideoObject = backgroundVideo.toObject();

    delete backgroundVideoObject.backgroundVideoID;
    delete backgroundVideoObject.__v;

    return backgroundVideoObject;
};

//add plugins auto increment id
BackgroundVideoSchema.plugin(AutoIncrement, { inc_field: 'backgroundVideoID' });

// add plugins soft delete
BackgroundVideoSchema.plugin(mongooseDelete, {
    overrideMethods: 'all',
    deletedAt: true,
});

BackgroundVideoSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('BackgroundVideoSchema', BackgroundVideoSchema);
