const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// library for soft delete
const mongooseDelete = require('mongoose-delete');
const AutoIncrement = require('mongoose-sequence')(mongoose);
const logQuery = require('../../../app/Service/Logging/LogtimeDB');

const UserProgramSchema = new Schema(
    {
        userProgramID: {
            type: Number
        },
        userID: {
            type: Schema.Types.ObjectId,
			ref: 'UserSchema'
        },
        programIDs: {
            type: Object
        },
        timeplays: {
            type: Object
        },
        timePlayVideos: {
            type: Object 
        },
        accumlative: {
            type: Number,
            default: 0
        },
        lastProgram: {
            type: Object
        }
    },
    {
        timestamps: true,
        collection: 'user_program',
    },
);

// custom query helpers
UserProgramSchema.query.sortable = function (request) {
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
UserProgramSchema.plugin(AutoIncrement, { inc_field: 'userProgramID' });

// add plugins soft delete
UserProgramSchema.plugin(mongooseDelete, {
    overrideMethods: 'all',
    deletedAt: true,
});

logQuery.logDBTime(UserProgramSchema);

const UserProgramModel = mongoose.model('UserProgramSchema', UserProgramSchema);
module.exports = UserProgramModel;
