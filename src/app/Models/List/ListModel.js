const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// library for soft delete
const mongooseDelete = require("mongoose-delete");
const AutoIncrement = require("mongoose-sequence")(mongoose);
const mongoosePaginate = require("mongoose-paginate-v2");
const constants = require("../../Constant/constants");

const ListSchema = new Schema(
    {
        listID: {
            type: Number,
        },
        listName: {
            type: String,
            required: true,
        },
        slugName: {
            type: String,
            required: true,
            unique: true,
        },
        listType: {
            type: String,
            // enum: ['no loop', 'genre', 'specific'],
            enum: Object.values(constants.LIST_TYPE),
            default: "genre",
        },
        listGroup1: {
            type: String,
            enum: ["movie", "tv"],
            default: "movie",
        },
        listGroup2: {
            type: String,
            enum: ["interested", "random"],
            default: "random",
        },
        listProgramCount: {
            type: Number,
            default: 0,
            validate(value) {
                if (value < 0) {
                    throw new Error("List list count is positive number");
                }
            },
        },
        listProgramList: [
            {
                type: Schema.Types.ObjectId,
                ref: "ProgramSchema",
            },
        ],
        listChildren: [
            {
                type: Schema.Types.ObjectId,
                ref: "ListSchema",
            },
        ],
        listIsAssign: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
        collection: "lists",
    }
);

// custom query helpers
ListSchema.query.sortable = function (request) {
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

ListSchema.set("toJSON", {
    transform: function (doc, ret) {
        let isArray = Array.isArray(ret.listProgramList);
        if (isArray) {
            ret.listProgramCount = ret.listProgramList.length;
        }
    },
});

ListSchema.set("toObject", {
    transform: function (doc, ret) {
        let isArray = Array.isArray(ret.listProgramList);
        if (isArray) {
            ret.listProgramCount = ret.listProgramList.length;
        }
    },
});

//add plugins auto increment id
ListSchema.plugin(AutoIncrement, { inc_field: "listID" });

// add plugins soft delete
ListSchema.plugin(mongooseDelete, {
    overrideMethods: "all",
    deletedAt: true,
});

ListSchema.plugin(mongoosePaginate);

ListSchema.paramLike = ["listName"];

module.exports = mongoose.model("ListSchema", ListSchema);
