const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// library for soft delete
const mongooseDelete = require('mongoose-delete');
const AutoIncrement = require('mongoose-sequence')(mongoose);
const mongoosePaginate = require('mongoose-paginate-v2');
const constants = require('../../Constant/constants');

const ParentProtectionSchema = new Schema(
	{
		name: {
			type: Schema.Types.String,
			default: '',
		},
		description: {
			type: Schema.Types.String,
			default: '',
		},
		type: {
			type: Schema.Types.Number,
			enum: Object.values(constants.TYPE_PARENT_PROTECTION),
			default: constants.TYPE_PARENT_PROTECTION.AGE_18,
		},
		parentProtectionID: {
			type: Schema.Types.Number,
		},
	},
	{
		timestamps: true,
		collection: 'parent_protection',
	}
);

ParentProtectionSchema.query.sortable = function (request) {
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
// ParentProtectionSchema.plugin(AutoIncrement, { inc_field: 'programID' });

// add plugins soft delete
ParentProtectionSchema.plugin(mongooseDelete, {
	overrideMethods: false,
	deletedAt: true,
});

ParentProtectionSchema.plugin(mongoosePaginate);

ParentProtectionSchema.plugin(AutoIncrement, {
	inc_field: 'parentProtectionID',
});

module.exports = mongoose.model('ParentProtectionSchema', ParentProtectionSchema);
