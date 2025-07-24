const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// library for soft delete
const mongooseDelete = require("mongoose-delete");
const AutoIncrement = require("mongoose-sequence")(mongoose);
const mongoosePaginate = require("mongoose-paginate-v2");

const BackgroundPosterSettingSchema = new Schema(
  {
    backgroundPosterSettingID: {
      type: Number,
    },
    backgroundPosterSettingName: {
      type: String,
      required: true,
      trim: true,
    },
    backgroundPosterSettingCategory: {
      type: String,
      required: true,
      trim: true,
    },
    backgroundPosterSettingVideoList: [
      {
        videoID: {
          type: Schema.Types.ObjectId,
          ref: "BackgroundVideoSchema",
        },
        videoStart: {
          type: Number,
        },
        videoEnd: {
          type: Number,
        },
      },
    ],
    backgroundPosterSettingMon: {
      type: Boolean,
      default: false,
    },
    backgroundPosterSettingTue: {
      type: Boolean,
      default: false,
    },
    backgroundPosterSettingWed: {
      type: Boolean,
      default: false,
    },
    backgroundPosterSettingThu: {
      type: Boolean,
      default: false,
    },
    backgroundPosterSettingFri: {
      type: Boolean,
      default: false,
    },
    backgroundPosterSettingSat: {
      type: Boolean,
      default: false,
    },
    backgroundPosterSettingSun: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    collection: "background_poster_setting",
  }
);

// custom query helpers
BackgroundPosterSettingSchema.query.sortable = function (request) {
  let query = request.query;
  let sort = query.hasOwnProperty("_sort"); // hasOwnProperty return true or false

  if (sort) {
    const isValidType = ["asc", "desc"].includes(query.type);
    return this.sort({
      [query.column]: isValidType ? query.type : "desc",
    });
  }

  return this;
};

//add plugins auto increment id
BackgroundPosterSettingSchema.plugin(AutoIncrement, {
  inc_field: "backgroundPosterSettingID",
});

// add plugins soft delete
BackgroundPosterSettingSchema.plugin(mongooseDelete, {
  overrideMethods: "all",
  deletedAt: true,
});

BackgroundPosterSettingSchema.plugin(mongoosePaginate);

BackgroundPosterSettingSchema.paramLike = ["backgroundPosterSettingName"];

module.exports = mongoose.model(
  "BackgroundPosterSettingSchema",
  BackgroundPosterSettingSchema
);
