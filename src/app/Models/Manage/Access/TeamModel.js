const mongoose = require('mongoose');
const Schema = mongoose.Schema;

//library for validator data
const validator = require('validator');

// library for soft delete
const mongooseDelete = require('mongoose-delete');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const TeamSchema = new Schema(
    {
        teamID: {
            type: Number,
        },
        teamName: {
            type: String,
        },
    },
    {
        timestamps: true,
        collection: 'team',
    },
);

// custom query helpers
TeamSchema.query.sortable = function (request) {
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
TeamSchema.plugin(AutoIncrement, { inc_field: 'teamID' });

// add plugins soft delete
TeamSchema.plugin(mongooseDelete, {
    overrideMethods: 'all',
    deletedAt: true,
});

const TeamModel = mongoose.model('TeamSchema', TeamSchema);
module.exports = TeamModel;
