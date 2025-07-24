const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// library for soft delete
const mongooseDelete = require('mongoose-delete');
const AutoIncrement = require('mongoose-sequence')(mongoose);
const mongoosePaginate = require('mongoose-paginate-v2');

const BackgroundPosterSchema = new Schema(
    {
        backgroundPosterID: {
            type: Number,
        },
        backgroundPosterProgramID: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: 'ProgramSchema',
        },
    },
    {
        timestamps: true,
        collection: 'background_poster',
    }
);

// custom query helpers
BackgroundPosterSchema.query.sortable = function (request) {
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
BackgroundPosterSchema.plugin(AutoIncrement, { inc_field: 'backgroundPosterID' });

// add plugins soft delete
BackgroundPosterSchema.plugin(mongooseDelete, {
    overrideMethods: 'all',
    deletedAt: true,
});

BackgroundPosterSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('BackgroundPosterSchema', BackgroundPosterSchema);
