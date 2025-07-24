const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const mongooseDelete = require('mongoose-delete');
const AutoIncrement = require('mongoose-sequence')(mongoose);
const logQuery = require('../../../app/Service/Logging/LogtimeDB');

const NoticeTransactionSchema = new Schema(
    {
        noticeID: {
            type: Number
        },
        title: {
            type: String
        },
        idUser: {
            type: Schema.Types.ObjectId,
            index: true
        },
        error: {
            type: Object
        }
    },
    {
        timestamps: true,
        collection: 'notice-transaction'
    },
);

//add plugins auto increment id
NoticeTransactionSchema.plugin(AutoIncrement, { inc_field: 'noticeID' });

// add plugins soft delete
NoticeTransactionSchema.plugin(mongooseDelete, {
    overrideMethods: true,
    deletedAt: true
});

logQuery.logDBTime(NoticeTransactionSchema);

module.exports = mongoose.model('NoticeTransactionSchema', NoticeTransactionSchema);
