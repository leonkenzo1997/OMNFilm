const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const mongooseDelete = require('mongoose-delete');
const AutoIncrement = require('mongoose-sequence')(mongoose);
const logQuery = require('../../Service/Logging/LogtimeDB');
const mongoosePaginate = require("mongoose-paginate-v2");

const HistoryAccountchema = new Schema(
    {
        historyID: {
            type: Number
        },
        userID: {
            type: Schema.Types.ObjectId,
			ref: 'UserSchema',
            index: true
        },
        action: {
            type: String
        },
        reason: {
            type: String
        },
        title: {
            type: String
        },
        byUser: {
            type: String
        }
    },
    {
        timestamps: true,
        collection: 'history_account',
    },
);

//add plugins auto increment id
HistoryAccountchema.plugin(AutoIncrement, { inc_field: 'histotyID' });

// add plugins soft delete
HistoryAccountchema.plugin(mongooseDelete, {
    overrideMethods: 'all',
    deletedAt: true,
});

logQuery.logDBTime(HistoryAccountchema);

HistoryAccountchema.plugin(mongoosePaginate);

HistoryAccountchema.paramLike = ["userEmail"];

const HistoryAccountModel = mongoose.model('HistoryAccountchema', HistoryAccountchema);

module.exports = HistoryAccountModel;
