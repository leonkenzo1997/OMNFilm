const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const mongooseDelete = require('mongoose-delete');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const mongoosePaginate = require('mongoose-paginate-v2');
const logQuery = require('../../../app/Service/Logging/LogtimeDB');

const RsSchema = new Schema(
    {
        rsID: {
            type: Number,
        },
        userID: {
            type: Schema.Types.ObjectId,
            ref: 'UserSchema',
        },
        date: {
            type: String
        },
        confirmed: {
            type: String
        },
        payable: {
            type: String
        },
        residual: {
            type: String
        },
        forward: {
            type: String
        },
        able: {
            type: Boolean,
			default: false,
        },
        request: {
            type: Boolean,
			default: false,
        },
        hasConfirm: {
            type: Boolean,
			default: false,
        },
        byConfirm: {
            userID: {
                type: Schema.Types.ObjectId,
                ref: 'UserSchema'
            },
            name: {
                type: String
            }
        },
        info: {
            type: Object
        },
        ofMonth: {
            type: String
        },
        isRS: {
            type: Boolean,
			default: false
        }
    },
    {
        timestamps: true,
        collection: 'rs_profit',
    },
);

//add plugins auto increment id
RsSchema.plugin(AutoIncrement, { inc_field: 'rsID' });

RsSchema.plugin(mongoosePaginate);

// add plugins soft delete
RsSchema.plugin(mongooseDelete, {
    overrideMethods: 'all',
    deletedAt: true,
    use$neOperator: false
});

logQuery.logDBTime(RsSchema);

RsSchema.paramLike = ['date'];

module.exports = mongoose.model('RsSchema', RsSchema);