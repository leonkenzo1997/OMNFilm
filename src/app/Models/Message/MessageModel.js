const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const mongooseDelete = require('mongoose-delete');
const mongoosePaginate = require('mongoose-paginate-v2');
const constants = require('../../Constant/constants')

const MessageSchema = new Schema(
    {
        sender: {
            type: Schema.Types.ObjectId,
            ref: 'UserSchema'
        },
        receiver: {
            type: Schema.Types.ObjectId,
            ref: 'UserSchema'
        },
        receiverEmail: {
            type: String,
            default: ''
        },
        title: {
            type: String,
            default: ''
        },
        content: {
            type: String,
            default: ''
        },
        status: {
            type: String
        },
        isPending: {
            type: Boolean,
            default: false
        },
        type: {
            type: String,
            enum: Object.values(constants.MESSAGE_TYPE)
        },
        category: {
            type: String,
            enum: Object.values(constants.MESSAGE_CATEGORY)
        },
        display: {
            type: Number,
            enum: Object.values(constants.DISPLAY_NOTIFICATION)
        },
        isSchedule: {
            type: Boolean,
            default: false
        },
        schedule: {
            type: Number,
        },
        createdTime: {
			type: Number,
			default: Date.now
		}
    },
    {
        timestamps: true,
        collection: 'message',
    },
);

// custom query helpers
MessageSchema.query.sortable = function (request) {
    const query = request.query;
    const sort = query.hasOwnProperty('_sort');

    if (sort) {
        const isValidType = ['asc', 'desc'].includes(query.type);
        return this.sort({
            [query.column]: isValidType ? query.type : 'desc',
        });
    }

    return this;
};

MessageSchema.plugin(mongoosePaginate);

// add plugins soft delete
MessageSchema.plugin(mongooseDelete, {
    overrideMethods: 'all',
    deletedAt: true,
});

MessageSchema.methods.toJSON = function () {
	const message = this;
	const messageObject = message.toObject();
    delete messageObject.__v;
	return messageObject;
};

MessageSchema.paramLike = ['receiverEmail', 'title'];

module.exports = mongoose.model('MessageSchema', MessageSchema);
