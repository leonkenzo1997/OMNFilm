const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// library for soft delete
const mongooseDelete = require('mongoose-delete');
const AutoIncrement = require('mongoose-sequence')(mongoose);
const mongoosePaginate = require('mongoose-paginate-v2');
const constants = require('../../Constant/constants');

const BackgroundSchema = new Schema(
	{
		startAt: {
			type: Schema.Types.Number,
			required: true,
		},
		endAt: {
			type: Schema.Types.Number,
			required: true,
		},
		program: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'ProgramSchema',
		},
		status: {
			type: Schema.Types.String,
			enum: ['available', 'removed', 'expired'],
			default: 'available',
		},
		type: {
			type: Schema.Types.Number,
			enum: Object.values(constants.TYPE_BACKGROUND),
			default: constants.TYPE_BACKGROUND.VIDEO,
			required: true,
		},
	},
	{
		timestamps: true,
		collection: 'background',
	}
);

BackgroundSchema.set('toJSON', {
	transform: function (doc, ret) {
		ret.startAt = `${
			Math.floor(ret.startAt / 3600) > 9
				? Math.floor(ret.startAt / 3600)
				: '0' + Math.floor(ret.startAt / 3600).toString()
		}:${
			Math.floor(ret.startAt % 3600) / 60 > 9
				? Math.floor(ret.startAt % 3600) / 60
				: '0' + Math.floor((ret.startAt % 3600) / 60).toString()
		}`;

		ret.endAt = `${
			Math.floor(ret.endAt / 3600) > 9
				? Math.floor(ret.endAt / 3600)
				: '0' + Math.floor(ret.endAt / 3600).toString()
		}:${
			Math.floor(ret.endAt % 3600) / 60 > 9
				? Math.floor(ret.endAt % 3600) / 60
				: '0' + Math.floor((ret.endAt % 3600) / 60).toString()
		}`;
		// ret.endAt = ret.endAt.toUTCString();
		delete ret.type;
		delete ret.status;
		delete ret.__v;
	},
});

BackgroundSchema.set('toObject', {
	transform: function (doc, ret) {
		ret.startAt = `${
			Math.floor(ret.startAt / 3600) > 9
				? Math.floor(ret.startAt / 3600)
				: '0' + Math.floor(ret.startAt / 3600).toString()
		}:${
			Math.floor(ret.startAt % 3600) / 60 > 9
				? Math.floor(ret.startAt % 3600) / 60
				: '0' + Math.floor((ret.startAt % 3600) / 60).toString()
		}`;

		ret.endAt = `${
			Math.floor(ret.endAt / 3600) > 9
				? Math.floor(ret.endAt / 3600)
				: '0' + Math.floor(ret.endAt / 3600).toString()
		}:${
			Math.floor(ret.endAt % 3600) / 60 > 9
				? Math.floor(ret.endAt % 3600) / 60
				: '0' + Math.floor((ret.endAt % 3600) / 60).toString()
		}`;
		// ret.endAt = ret.endAt.toUTCString();
		delete ret.type;
		delete ret.status;
		delete ret.__v;
	},
});

BackgroundSchema.plugin(mongooseDelete, {
	overrideMethods: false,
	deletedAt: true,
});

BackgroundSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('BackgroundSchema', BackgroundSchema);
