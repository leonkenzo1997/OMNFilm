const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// library for soft delete
const mongooseDelete = require('mongoose-delete');
const AutoIncrement = require('mongoose-sequence')(mongoose);
const mongoosePaginate = require('mongoose-paginate-v2');
const constants = require('../../Constant/constants');
const logQuery = require('../../../app/Service/Logging/LogtimeDB');

const ProgramSchema = new Schema(
    {
        programID: {
            type: Number,
        },
        programName: {
            type: String,
            required: true,
        },
        slugName: {
            type: String,
            required: true,
            unique: true,
        },
        programTitle: {
            type: String,
            default: null,
        },
        programImagePoster: {
            type: String,
            default: null,
        },
        programImagePosterNoTitle: {
            type: String,
            default: null,
        },
        programOriginalPoster: {
            type: String,
            default: null,
        },
        programSubTitle: {
            type: String,
        },
        programImageTitle: {
            type: String,
            default: null,
        },
        programImageBracter: {
            type: String,
            default: null,
        },
        programSummary: {
            type: String,
        },
        programCategory: {
            categoryManageId: {
                type: Schema.Types.ObjectId,
                ref: 'CategoryManageSchema',
            },
            categoryArrayTag: [
                {
                    type: Schema.Types.ObjectId,
                    ref: 'TagSchema',
                },
            ],
        },
        programElement: [
            {
                elementName: {
                    type: String,
                    enum: ['violence', 'sexuality', 'language'],
                    default: 'violence',
                },
                elementValue: {
                    type: String,
                    enum: ['none', 'little', 'plenty'],
                    default: 'none',
                },
            },
        ],
        programParticipants: [
            {
                nameType: {
                    type: String,
                },
                dataType: [
                    {
                        type: String,
                    },
                ],
            },
        ],
        programThumbnail: {
            // field for preview of video
            thumbnailSetting: {
                type: Number,
                default: 0,
            },
            thumbnailImage: {
                type: String,
            },
        },
        // field for intro, outtro of video
        programVideoSetting: {
            // type second for time
            intro: {
                type: Number,
                default: 0,
            },
            // type for mobile
            preview: {
                type: Number,
                default: 0,
            },
            // type second for time
            outtro: {
                type: Number,
                default: 0,
            },
        },
        programTypeVideo: {
            type: String,
            enum: Object.values(constants.TYPE_VIDEO),
            default: constants.TYPE_VIDEO.SA,
        },
        programEpisodeSummary: {
            type: String,
        },
        programSeasonChild: {
            // Child = true || Parent = false
            type: Boolean,
            default: false,
        },
        programSeasonData: [
            // List season for parent
            {
                seasonName: {
                    type: String,
                    default: '',
                    require: true,
                },
                episode: [
                    {
                        type: Schema.Types.ObjectId,
                        ref: 'ProgramSchema',
                    },
                ],
                episodeDeleted: [
                    {
                        type: Schema.Types.ObjectId,
                        ref: 'ProgramSchema',
                    },
                ],
            },
        ],
        programChildrenSeasonData: {
            // Info of children
            parentID: {
                type: Schema.Types.ObjectId,
                ref: 'ProgramSchema',
            },
            seasonName: {
                type: String,
                default: '',
                require: true,
            },
            seasonID: {
                type: String,
                default: '',
            },
            episodeName: {
                type: String,
                default: '',
            },
            episodeSummary: {
                type: String,
                default: '',
            },
            linkVideo: {
                type: String,
                default: '',
            },
        },
        programMusicInfo: [
            {
                musicName: {
                    type: String,
                },
                musicArtist: {
                    type: String,
                },
            },
        ],
        userID: {
            type: Schema.Types.ObjectId,
            ref: 'UserSchema',
            index: true,
        },
        programCurrentStatus: {
            type: String,
            enum: Object.values(constants.PROGRAM_STATUS),
            default: 'upload',
        },
        programEditor: {
            type: Number,
            default: 0,
        },
        isEdit: {
            type: Boolean,
            default: false,
        },
        isEditRating: {
            type: Boolean,
            default: false,
        },
        programType: {
            type: String,
            enum: Object.values(constants.PROGRAM_TYPE),
            default: constants.PROGRAM_TYPE.UPLOAD,
        },
        programView: {
            type: Object,
        },
        programTotalView: {
            type: Number,
            default: 0,
        },
        programDisplay: {
            type: Boolean,
            default: false,
        },
        programProcess: {
            type: Number,
            default: 0,
        },
        status: {
            type: String,
            enum: ['approval', 'omn', 'instant', null],
            default: null,
        },
        linkVideo: {
            type: String,
            default: '',
        },
        linkVideoDRM: {
            type: Object,
        },
        flagDRM: {
            type: Boolean,
            default: false,
        },
        videoRank: {
            type: Number,
            enum: Object.values(constants.VIDEO_RANK),
            default: constants.VIDEO_RANK.ENTIRE,
        },
        like: {
            type: Number,
            default: 0,
        },
        unlike: {
            type: Number,
            default: 0,
        },
        isLike: {
            type: Boolean,
            default: false,
        },
        isUnlike: {
            type: Boolean,
            default: false,
        },
        isResultLetter: {
            type: Boolean,
            default: false,
        },
        // time get play video
        timePlay: {
            type: Date,
            default: '',
        },
        // time get play video
        timeTemp: {
            type: Date,
            default: '',
        },
        // if user upload/edit after 12AM then isPending = true
        // update isPending = false after 24h everyday
        isPending: {
            type: Boolean,
            default: true,
        },
        // id of program backup
        historyEditProgramID: {
            type: Schema.Types.ObjectId,
            ref: 'HistoryEditProgramSchema',
        },
        // video thumbnail of program
        videoThumbnail: {
            type: String,
            default: '',
        },
        //Date original
        originalDate: {
            type: Date,
            default: '',
        },
        previewUpload: {
            type: String,
            default: '',
        },
        participantsRates: [
            {
                // name: {
                //     type: String,
                //     default: '',
                // },
                userID: {
                    type: Schema.Types.ObjectId,
                    ref: 'UserSchema',
                },
                rate: {
                    type: Number,
                    default: 0,
                },
            },
        ],
        // This field for only original check complete data
        isComplete: {
            type: Boolean,
            default: false,
        },
        // date add video trailer
        programAddUploadTrailer: {
            type: Date,
            default: null,
        },
        // date remove video trailer
        programRemoveUploadTrailer: {
            type: Date,
            default: null,
        },
        remark: {
            type: String,
            default: '',
        },
        // save total time video
        totalTime: {
            type: Number,
            default: 0,
        },
        // the same field backgroundVideoTrailer in background model
        programVideoTrailer: {
            type: String,
            default: '',
        },
        // field contain url resize image of Poster normal
        programImagex1: {
            type: String,
            default: null,
        },
        // field contain url resize image of Poster x2
        programImagex2: {
            type: String,
            default: null,
        },
        // field contain url resize image title
        programImageTitleResize1: {
            type: String,
            default: null,
        },
        // field contain url resize image title x2
        programImageTitleResize2: {
            type: String,
            default: null,
        },
        programImagePosterResize: {
            type: String,
            default: null,
        },
        programOriginalPosterResizeX1: {
            type: String,
            default: null,
        },
        programOriginalPosterResizeX2: {
            type: String,
            default: null,
        },
        drmConvertError: {
            type: Boolean,
            default: false,
        },
        linkVideoConvert: {
            type: String,
            default: null,
        },
        verifyDenial: {
            type: Boolean,
            default: null,
        },
        // image poster no tititle resize 
        programImagePosterNoTitleResize: {
            type: String,
            default: null,
        },
        // image thumbnail episode or standalone
        programThumbnailResizeX1: {
            type: String,
            default: null,
        },
        programThumbnailResizeX2: {
            type: String,
            default: null,
        },
    },
    {
        timestamps: true,
        collection: 'program',
    }
);

// using hiding private data of categoryMange when relate data and send for the client
ProgramSchema.methods.toJSON = function () {
    const program = this;
    const programObject = program.toObject();
    delete programObject.__v;
    return programObject;
};

// custom query helpers
ProgramSchema.query.sortable = function (request) {
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
ProgramSchema.plugin(AutoIncrement, { inc_field: 'programID' });

// add plugins soft delete
ProgramSchema.plugin(mongooseDelete, {
    overrideMethods: false,
    deletedAt: true,
});

ProgramSchema.plugin(mongoosePaginate);

ProgramSchema.paramLike = [
    'programName',
    'programTitle',
    'programSubTitle',
    'programSummary',
];

logQuery.logDBTime(ProgramSchema);

module.exports = mongoose.model('ProgramSchema', ProgramSchema);
