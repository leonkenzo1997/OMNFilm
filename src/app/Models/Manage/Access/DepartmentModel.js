const mongoose = require('mongoose');
const Schema = mongoose.Schema;

//library for validator data
const validator = require('validator');

// library for soft delete
const mongooseDelete = require('mongoose-delete');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const DepartmentSchema = new Schema(
    {
        departmentID: {
            type: Number
        },
        departmentCode: {
            type: String
        },
        departmentName: {
            type: String
        },
    },
    {
        timestamps: true,
        collection: 'department',
    },
);

// custom query helpers
DepartmentSchema.query.sortable = function (request) {
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
DepartmentSchema.plugin(AutoIncrement, { inc_field: 'departmentID' });

// add plugins soft delete
DepartmentSchema.plugin(mongooseDelete, {
    overrideMethods: 'all',
    deletedAt: true,
});

const DeptModel = mongoose.model('DepartmentSchema', DepartmentSchema);
module.exports = DeptModel;
