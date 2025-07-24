// const mongoose = require('mongoose');
// const Schema = mongoose.Schema;
// const mongooseDelete = require('mongoose-delete');
// const AutoIncrement = require('mongoose-sequence')(mongoose);
// const mongoosePaginate = require('mongoose-paginate-v2');

// const BractersModelSchema = new Schema(
//     {
//         bractersID: {
//             type: Number,
//         },
//         bractersName: {
//             type: String,
//             required: true,
//         },
//         bractersCategoriesList: [
//             {
//                 type: Schema.Types.ObjectId,
//                 ref: 'CategoriesSetSchema',
//             },
//         ],
//     },
//     {
//         timestamps: true,
//         collection: 'bracters',
//     },
// );

// //add plugins auto increment id
// BractersModelSchema.plugin(AutoIncrement, { inc_field: 'bractersID' });

// // add plugins soft delete
// BractersModelSchema.plugin(mongooseDelete, {
//     overrideMethods: 'all',
//     deletedAt: true,
// });

// BractersModelSchema.plugin(mongoosePaginate);

// BractersModelSchema.paramLike = [];

// module.exports = mongoose.model('BractersModelSchema', BractersModelSchema);
