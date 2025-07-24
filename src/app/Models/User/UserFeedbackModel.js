const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// library for soft delete
const mongooseDelete = require('mongoose-delete');
const AutoIncrement = require('mongoose-sequence')(mongoose);
const logQuery = require('../../../app/Service/Logging/LogtimeDB');
const mongoosePaginate = require("mongoose-paginate-v2");

const UserFeedbackSchema = new Schema(
    {
        userFeedbackID: {
            type: Number
        },
        watched: {
            type: String
        },
        feedbackType: {
            type: Object
        },
        feedbackMessage: {
            type: String
        },
        remark: {
            type: String
        },
        feedbackStatus: {
            type: Boolean,
            default: null
        },
        userID: {
			type: Schema.Types.ObjectId,
			ref: 'UserSchema'
        },
        userEmail: {
            type: String
        }
    },
    {
        timestamps: true,
        collection: 'user_feedback'
    },
);

//add plugins auto increment id
UserFeedbackSchema.plugin(AutoIncrement, { inc_field: 'userFeedbackID' });

// add plugins soft delete
UserFeedbackSchema.plugin(mongooseDelete, {
    overrideMethods: 'all',
    deletedAt: true,
});

UserFeedbackSchema.plugin(mongoosePaginate);

logQuery.logDBTime(UserFeedbackSchema);

UserFeedbackSchema.paramLike = ["userEmail"];

const UserFeedbackModel = mongoose.model('UserFeedbackSchema', UserFeedbackSchema);
module.exports = UserFeedbackModel;
