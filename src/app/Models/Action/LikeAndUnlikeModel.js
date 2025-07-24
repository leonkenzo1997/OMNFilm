const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// library for soft delete
const mongooseDelete = require('mongoose-delete');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const LikeAndUnlikeSchema = new Schema(
	{
		likeAndUnlikeID: {
			type: Number,
		},
		type: {
            type: String,
            enum: ['like', 'unlike']
		},
		userId: {
			type: Schema.Types.ObjectId,
		},
		programId: {
			type: Schema.Types.ObjectId,
		},
	},
	{
		timestamps: true,
		collection: 'like_and_unlike',
	}
);

// using hiding private data of like when relate data and send for the client
LikeAndUnlikeSchema.methods.toJSON = function () {
	const like = this;
	const likeObject = like.toObject();
	delete likeObject.__v;
	return likeObject;
};

// custom query helpers
LikeAndUnlikeSchema.query.sortable = function (request) {
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

//add plugins auto increment id
LikeAndUnlikeSchema.plugin(AutoIncrement, { inc_field: 'likeAndUnlikeID' });

// add plugins soft delete
LikeAndUnlikeSchema.plugin(mongooseDelete, {
	overrideMethods: 'all',
	deletedAt: true,
});

LikeAndUnlikeSchema.index({ userId: 1, programId: 1 });

const likeModel = mongoose.model('LikeAndUnlikeSchema', LikeAndUnlikeSchema);
module.exports = likeModel;
