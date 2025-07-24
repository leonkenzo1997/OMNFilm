const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const mongooseDelete = require('mongoose-delete');

const KoreanBankSchema = new Schema(
    {
        code: {
            type: String,
            index: true,
            unique: true
        },
        name: {
            type: String,
            default: ''
        },
        note: {
            type: String,
            default: ''
        }
    },
    {
        timestamps: true,
        collection: 'korean_bank',
    },
);

// add plugins soft delete
KoreanBankSchema.plugin(mongooseDelete, {
    overrideMethods: false,
    deletedAt: true,
});

module.exports = mongoose.model('KoreanBankSchema', KoreanBankSchema);
