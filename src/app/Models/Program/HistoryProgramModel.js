const { constant } = require('lodash');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// library for soft delete
const mongooseDelete = require('mongoose-delete');
const mongoosePaginate = require('mongoose-paginate-v2');

const constants = require('../../Constant/constants');
const logQuery = require('../../../app/Service/Logging/LogtimeDB');

const HistoryProgramSchema = new Schema(
    {
        manager: {
            type: Schema.Types.ObjectId,
            ref: 'UserSchema',
        },
        receiverID: {
            type: Schema.Types.ObjectId,
            ref: 'UserSchema',
        },
        programID: {
            type: Schema.Types.ObjectId,
            ref: 'ProgramSchema',
        },
        programParentID: {
            type: Schema.Types.ObjectId,
            ref: 'ProgramSchema',
        },
        typeProgram: {
            type: Number,
            default: constants.TYPE_PROGRAM_HISTORY.CHALLENGER,
            enum: Object.values(constants.TYPE_PROGRAM_HISTORY),
        },
        managerName: {
            type: String,
            default: '',
        },
        status: {
            type: String,
            default: constants.PROGRAM_STATUS.UPLOAD,
            enum: Object.values(constants.PROGRAM_STATUS),
        },
        title: {
            type: String,
            default: '',
        },
        content: {
            type: String,
            default: '',
        },
        isRead: {
            type: Boolean,
            default: false,
        },
        // This field use only for tab omner
		seen: {
			type: Boolean,
			default: false,
		},
        createdTime: {
			type: Number,
			default: Date.now
		}
    },
    {
        timestamps: true,
        collection: 'history_program',
    }
);

// custom query helpers
HistoryProgramSchema.query.sortable = function (request) {
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

// add plugins soft delete
HistoryProgramSchema.plugin(mongooseDelete, {
    overrideMethods: false,
    deletedAt: true,
});

HistoryProgramSchema.plugin(mongoosePaginate);

logQuery.logDBTime(HistoryProgramSchema);

module.exports = mongoose.model('HistoryProgramSchema', HistoryProgramSchema);
