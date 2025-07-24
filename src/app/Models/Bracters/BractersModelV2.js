const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const mongooseDelete = require('mongoose-delete');
const mongoosePaginate = require('mongoose-paginate-v2');

const BractersModelSchema = new Schema(
    {
        categoryID: {
            type: Schema.Types.ObjectId,
            ref: 'CategoriesSetSchema',
        },
        limitProgramShow: {
            type: Number,
            default: 0
        },
        listPrograms: [
            {
                programID: {
                    type: Schema.Types.ObjectId,
                    ref: 'ProgramSchema',
                },
                createdAt: {
                    type: Date,
                    default: Date.now
                }
            }
        ],
    },
    {
        timestamps: true,
        collection: 'bracters_v2',
    },
);

// add plugins soft delete
BractersModelSchema.plugin(mongooseDelete, {
    overrideMethods: 'all',
    deletedAt: true,
});

BractersModelSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('BractersModelSchema', BractersModelSchema);
