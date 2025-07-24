const mongoose = require('mongoose');
const Schema = mongoose.Schema;

//library for validator data
const validator = require('validator');

// library for soft delete
const mongooseDelete = require('mongoose-delete');
const mongoosePaginate = require('mongoose-paginate-v2');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const CONSTANT = require('../../Constant/constants');
const logQuery = require('../../../app/Service/Logging/LogtimeDB');

const UserPushNotificationSchema = new Schema(
	{
		userPushNotificationID: {
			type: Number,
		},
		senderID: {
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
		title: {
			type: String,
			default: '',
		},
		body: {
			type: Object,
			default: {},
		},
		isRead: {
			type: Boolean,
			default: false,
		},
		display: {
			type: Number,
			default: CONSTANT.DISPLAY_NOTIFICATION.OFFLINE,
		},
		// This field use for schedule
		isPending: {
			type: Boolean,
			default: false,
		},
		// This field use only for tab omner
		seen: {
			type: Boolean,
			default: false,
		},
		historyID: {
			type: Schema.Types.ObjectId,
			ref: 'HistoryProgramSchema',
		},
		createdTime: {
			type: Number,
			default: Date.now
		}
	},
	{
		timestamps: true,
		collection: 'push_notification',
	}
);

// custom query helpers
UserPushNotificationSchema.query.sortable = function (request) {
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

// using hiding private data of user when relate data and send for the client
UserPushNotificationSchema.methods.toJSON = function () {
	const userPushNotification = this;
	const object = userPushNotification.toObject();
	delete object.__v;
	return object;
};

//add plugins auto increment id
UserPushNotificationSchema.plugin(AutoIncrement, { inc_field: 'userPushNotificationID' });

// add plugins soft delete
UserPushNotificationSchema.plugin(mongooseDelete, {
	overrideMethods: 'all',
	deletedAt: true,
});

UserPushNotificationSchema.plugin(mongoosePaginate);

UserPushNotificationSchema.paramLike = ['title'];

logQuery.logDBTime(UserPushNotificationSchema);

const UserPushNotificationModel = mongoose.model(
	'UserPushNotificationSchema',
	UserPushNotificationSchema
);
module.exports = UserPushNotificationModel;
