const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// library for soft delete
const mongooseDelete = require("mongoose-delete");
const AutoIncrement = require("mongoose-sequence")(mongoose);
const mongoosePaginate = require("mongoose-paginate-v2");

const BackgroundVideoSettingSchema = new Schema(
  {
    backgroundVideoSettingID: {
      type: Number,
    },
    backgroundVideoSettingName: {
      type: String,
      required: true,
      trim: true,
    },
    backgroundVideoSettingCategory: {
      type: String,
      required: true,
      trim: true,
    },
    backgroundVideoSettingVideoList: [
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
    backgroundVideoSettingMon: {
      type: Boolean,
      default: false,
    },
    backgroundVideoSettingTue: {
      type: Boolean,
      default: false,
    },
    backgroundVideoSettingWed: {
      type: Boolean,
      default: false,
    },
    backgroundVideoSettingThu: {
      type: Boolean,
      default: false,
    },
    backgroundVideoSettingFri: {
      type: Boolean,
      default: false,
    },
    backgroundVideoSettingSat: {
      type: Boolean,
      default: false,
    },
    backgroundVideoSettingSun: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    collection: "background_video_setting",
  }
);

// custom query helpers
BackgroundVideoSettingSchema.query.sortable = function (request) {
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
BackgroundVideoSettingSchema.plugin(AutoIncrement, {
  inc_field: "backgroundVideoSettingID",
});

// add plugins soft delete
BackgroundVideoSettingSchema.plugin(mongooseDelete, {
  overrideMethods: "all",
  deletedAt: true,
});

BackgroundVideoSettingSchema.plugin(mongoosePaginate);

BackgroundVideoSettingSchema.paramLike = ["backgroundVideoSettingName"];

module.exports = mongoose.model(
  "BackgroundVideoSettingSchema",
  BackgroundVideoSettingSchema
);
