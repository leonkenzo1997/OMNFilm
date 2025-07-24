const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const mongooseDelete = require('mongoose-delete');
const AutoIncrement = require('mongoose-sequence')(mongoose);
const logQuery = require('../../../app/Service/Logging/LogtimeDB');
const mongoosePaginate = require("mongoose-paginate-v2");

const Abusingchema = new Schema(
    {
        abusingID: {
            type: Number
        },
        userID: {
            type: Schema.Types.ObjectId,
			ref: 'UserSchema'
        },
        userEmail: {
            type: String
        },
        userName: {
            type: String
        },
        timeFlowWeek: {
            type: String,
            index: true
        },
        info: {
            type: Object
        },
        detail: [{
            type: Schema.Types.ObjectId,
            ref: 'ProgramSchema'
        }]
    },
    {
        timestamps: true,
        collection: 'abusing',
    },
);

//add plugins auto increment id
Abusingchema.plugin(AutoIncrement, { inc_field: 'abusingID' });

// add plugins soft delete
Abusingchema.plugin(mongooseDelete, {
    overrideMethods: 'all',
    deletedAt: true,
});

logQuery.logDBTime(Abusingchema);

Abusingchema.plugin(mongoosePaginate);

Abusingchema.paramLike = ["userEmail"];

const AbusingModel = mongoose.model('Abusingchema', Abusingchema);

module.exports = AbusingModel;
