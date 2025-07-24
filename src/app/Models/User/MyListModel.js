const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// library for soft delete
const mongooseDelete = require('mongoose-delete');

const MyListSchema = new Schema(
    {
        userID: {
			type: Schema.Types.ObjectId,
			ref: 'UserSchema'
        },
        programs: [{
            type: Schema.Types.ObjectId,
			ref: 'ProgramSchema'
        }],
    },
    {
        timestamps: true,
        collection: 'my_list',
    },
);

// custom query helpers
MyListSchema.query.sortable = function (request) {
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

// add plugins soft delete
MyListSchema.plugin(mongooseDelete, {
    overrideMethods: 'all',
    deletedAt: true,
});

const MyListModel = mongoose.model('MyListSchema', MyListSchema);
module.exports = MyListModel;
