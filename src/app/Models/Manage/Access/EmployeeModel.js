const mongoose = require('mongoose');
const Schema = mongoose.Schema;

//library for validator data
const validator = require('validator');

// library for soft delete
const mongooseDelete = require('mongoose-delete');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const EmployeeSchema = new Schema(
    {
        employeeID: {
            type: Number,
        },
        employeeName: {
            type: String,
        },
    },
    {
        timestamps: true,
        collection: 'employee',
    },
);

// custom query helpers
EmployeeSchema.query.sortable = function (request) {
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
EmployeeSchema.plugin(AutoIncrement, { inc_field: 'employeeID' });

// add plugins soft delete
EmployeeSchema.plugin(mongooseDelete, {
    overrideMethods: 'all',
    deletedAt: true,
});

const EmployeeModel = mongoose.model('EmployeeSchema', EmployeeSchema);
module.exports = EmployeeModel;
