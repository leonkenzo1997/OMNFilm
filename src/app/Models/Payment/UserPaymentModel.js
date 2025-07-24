const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const mongooseDelete = require('mongoose-delete');
const AutoIncrement = require('mongoose-sequence')(mongoose);
const logQuery = require('../../../app/Service/Logging/LogtimeDB');

const UserPaymentSchema = new Schema(
    {
        userPaymentID: {
            type: Number,
            index: true
        },
        idUser: {
            type: Schema.Types.ObjectId,
            ref: 'UserSchema',
            index: true
        },
        cardNumber: {
            type: String,
            index: true
        },
        cardNumberFirst: {
            type: String
        },
        cardExpire: {
            type: String
        },
        regNo: {
            type: String
        },
        cardPw: {
            type: String
        },
        cardQuota: {
            type: String
        },
        buyerTel: {
            type: String
        },
        firstPayment: {
            type: Boolean,
            default: false
        },
        bankCode: {
            type: String,
            default: ''
        },
        goodName: {
            type: String
        },
        currency: {
            type: String
        },
        price: {
            type: Number
        }
    },
    {
        timestamps: true,
        collection: 'user-payment',
    },
);

//add plugins auto increment id
UserPaymentSchema.plugin(AutoIncrement, { inc_field: 'userPaymentID' });

// add plugins soft delete
UserPaymentSchema.plugin(mongooseDelete, {
    overrideMethods: 'all',
    deletedAt: true,
});

logQuery.logDBTime(UserPaymentSchema);

module.exports = mongoose.model('UserPaymentSchema', UserPaymentSchema);
