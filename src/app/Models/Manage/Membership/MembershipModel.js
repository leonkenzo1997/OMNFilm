const mongoose = require('mongoose');
const Schema = mongoose.Schema;

//library for validator data
const validator = require('validator');

// library for soft delete
const mongooseDelete = require('mongoose-delete');
const AutoIncrement = require('mongoose-sequence')(mongoose);
const logQuery = require('../../../../app/Service/Logging/LogtimeDB');
const constants = require('../../../Constant/constants');

const MembershipSchema = new Schema(
    {
        membershipID: {
            type: Number,
        },
        packageName: {
            type: String,
            enum: Object.values(constants.MEMBER_SHIP),
            default: constants.MEMBER_SHIP.BASIC,
        },
        fee: {
            type: Number,
            required: 0,
            validate(value) {
                if (value < 0) {
                    throw new Error('fee is positive number');
                }
            },
        },
        fhd: {
            type: Boolean,
            default: false,
        },
        hd: {
            type: Boolean,
            default: false,
        },
        preview: {
            type: Boolean,
            default: false,
        },
        unlimitedPreviewVideo: {
            type: Boolean,
            default: false,
        },
        deactivate: {
            type: Boolean,
            default: false,
        },
        membershipDescription: {
            type: String,
        },
        package_ios: {
            type: String
        },
    },
    {
        timestamps: true,
        collection: 'membership',
    },
);

// custom query helpers
MembershipSchema.query.sortable = function (request) {
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
MembershipSchema.plugin(AutoIncrement, { inc_field: 'membershipID' });

// add plugins soft delete
MembershipSchema.plugin(mongooseDelete, {
    overrideMethods: 'all',
    deletedAt: true,
});

logQuery.logDBTime(MembershipSchema);

const membershipModel = mongoose.model('MembershipSchema', MembershipSchema);
module.exports = membershipModel;