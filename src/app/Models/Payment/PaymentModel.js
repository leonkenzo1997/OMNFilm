const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const mongooseDelete = require('mongoose-delete');
const AutoIncrement = require('mongoose-sequence')(mongoose);
const logQuery = require('../../../app/Service/Logging/LogtimeDB');
const mongoosePaginate = require('mongoose-paginate-v2');

const PaymentSchema = new Schema(
    {
        paymentID: {
            type: Number,
            index: true
        },
        environment: {
            type: String,
        },
        product_id: {
            type: String
        },
        transaction_id: {
            type: String
        },
        original_transaction_id: {
            type: String
        },
        purchase_date: {
            type: String
        },
        is_trial_period: {
            type: String
        },
        bundle_id: {
            type: String
        },
        app_item_id: {
            type: String
        },
        receipt_type: {
            type: String
        },
        receipt_creation_date_ms: {
            type: String
        },
        //save android
        packageName: {
            type: String
        },
        purchaseToken: {
            type: String
        },
        purchaseState: {
            type: String
        },
        orderId: {
            type: String
        },
        kind: {
            type: String
        },        
        obfuscatedExternalAccountId: {
            type: String
        },
        transactionId: {
            type: String
        },
        quantity: {
            type: Number
        },
        developerPayload: {
            type: String
        },
        expired_day: {
            type: Date
        },
        cardCode: {
            type: String
        },
        cardName: {
            type: String
        },
        cardPoint: {
            type: String
        },
        checkFlg: {
            type: String
        },
        generalEvent: {
            type: String
        },
        payAuthCode: {
            type: String
        },
        payAuthQuota: {
            type: String
        },
        payDate: {
            type: String
        },
        payTime: {
            type: String
        },
        price: {
            type: Number
        },
        prtcCode: {
            type: Number
        },
        quotainterest: {
            type: String
        },
        resultCode: {
            type: String
        },
        resultMsg: {
            type: String
        },
        tid: {
            type: String
        },
        usePoint: {
            type: String
        },
        idUser: {
            type: Schema.Types.ObjectId,
            ref: 'UserSchema',
            index: true
        },
        goodName: {
            type: String
        },
        paymethod: {
            type: String
        },
        buyerName: {
            type: String
        },
        buyerEmail: {
            type: String
        },
        buyerTel: {
            type: String
        },
        cardQuota: {
            type: String
        },
        cardNumber: {
            type: String
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
        billKey: {
            type: String
        },
        detailCode: {
            type: String
        },
        payAuthCode: {
            type: String
        },
        cardNumberBill: {
            type: String
        },
        cancelDate: {
            type: String  
        },
        cancelTime: {
            type: String  
        },
        currency: {
            type: String  
        },
        payDevice: {
            type: String,
            default: null
        },
        accountBeDel: {
            type: Boolean,
            default: false
        },
        refund: {
            type: Boolean
        },
        PGrefund: {
            type: Date
        }
    },
    {
        timestamps: true,
        collection: 'payment',
    },
);

//add plugins auto increment id
PaymentSchema.plugin(AutoIncrement, { inc_field: 'paymentID' });

// add plugins soft delete
PaymentSchema.plugin(mongooseDelete, {
    overrideMethods: false,
    deletedAt: true,
});

PaymentSchema.plugin(mongoosePaginate);

PaymentSchema.virtual('userProgram', {
    ref: 'UserProgramSchema', // The model to use
    localField: 'idUser', // Find people where `localField`
    foreignField: 'userID', // is equal to `foreignField`
    // justOne: false,
    // options: { sort: { name: -1 }, limit: 5 } // Query options
});

logQuery.logDBTime(PaymentSchema);

PaymentSchema.paramLike = ['buyerEmail'];

module.exports = mongoose.model('PaymentSchema', PaymentSchema);
