const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// library for soft delete
const mongooseDelete = require('mongoose-delete');
const AutoIncrement = require('mongoose-sequence')(mongoose);
const logQuery = require('../../../app/Service/Logging/LogtimeDB');

const UserRoleSchema = new Schema(
    {
        userRoleID: {
            type: Number
        },
        code: {
            type: String
        },
        titleRole: {
            type: String
        }
    },
    {
        timestamps: true,
        collection: 'user_role',
    },
);

//add plugins auto increment id
UserRoleSchema.plugin(AutoIncrement, { inc_field: 'userRoleID' });

// add plugins soft delete
UserRoleSchema.plugin(mongooseDelete, {
    overrideMethods: 'all',
    deletedAt: true,
});

logQuery.logDBTime(UserRoleSchema);

const UserRoleModel = mongoose.model('UserRoleSchema', UserRoleSchema);
module.exports = UserRoleModel;
