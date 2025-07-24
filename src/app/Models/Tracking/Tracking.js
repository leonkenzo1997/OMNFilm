const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const mongooseDelete = require('mongoose-delete');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const TrackingSchema = new Schema(
    {
        trackingID: {
            type: Number,
            index: true
        },
        header: {
            type: String
        },
        content: {
            type: Object
        }
    },
    {
        timestamps: true,
        collection: 'tracking',
    },
);

//add plugins auto increment id
TrackingSchema.plugin(AutoIncrement, { inc_field: 'trackingID' });

// add plugins soft delete
TrackingSchema.plugin(mongooseDelete, {
    overrideMethods: 'all',
    deletedAt: true,
});

module.exports = mongoose.model('TrackingSchema', TrackingSchema);
