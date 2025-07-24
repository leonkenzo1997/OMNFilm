const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// library for soft delete
const mongooseDelete = require('mongoose-delete');
const AutoIncrement = require('mongoose-sequence')(mongoose);
const mongoosePaginate = require('mongoose-paginate-v2');
const constants = require('../../Constant/constants');
const logQuery = require('../../../app/Service/Logging/LogtimeDB');

const ProgramEditSchema = new Schema(
	{
		programIDEdit: {
			type: Number,
		},
		programEditor: {
			type: Number,
			default: 0,
		},
		programName: {
			type: String,
			required: true,
		},
		programTitle: {
			type: String,
			default: null,
		},
		programImageTitle: {
			type: String,
			default: null,
		},
		programSubTitle: {
			type: String,
		},
		programImageBracter: {
			type: String,
			default: '',
		},
		programImagePoster: {
			type: String,
			default: null,
		},
		programImagePosterNoTitle: {
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
		programElement: [
			{
				elementName: {
					type: String,
					enum: ['violence', 'sexuality', 'language'],
					default: 'violence',
				},
				elementValue: {
					type: String,
					enum: ['none', 'a little', 'plenty'],
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
		programDisplay: {
			type: Boolean,
			default: false,
		},
		programEpisodeSummary: {
			type: String,
		},
		// programSeasonData: [
		// 	{
		// 		seasonName: {
		// 			type: Number,
		// 		},
		// 		seasonEpisode: [
		// 			{
		// 				episodeName: {
		// 					type: Number,
		// 				},
		// 				episodeSummary: {
		// 					type: String,
		// 				},
		// 				linkVideo: {
		// 					type: String,
		// 				},
		// 			},
		// 		],
		// 	},
		// ],
		// programChildrenSeasonData: {
		// 	seasonName: {
		// 		type: String,
		// 	},
		// 	seasonEpisode: [
		// 		{
		// 			episodeName: {
		// 				type: String,
		// 			},
		// 			episodeSummary: {
		// 				type: String,
		// 			},
		// 			linkVideo: {
		// 				type: String,
		// 			},
		// 		},
		// 	],
		// },
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
		},
		programCurrentStatus: {
			type: String,
			enum: Object.values(constants.PROGRAM_STATUS),
			default: constants.PROGRAM_STATUS.UPLOAD,
		},
		programType: {
			type: String,
			enum: Object.values(constants.PROGRAM_TYPE),
			default: constants.PROGRAM_TYPE.UPLOAD,
		},
		programView: {
			type: Object,
		},
		programID: {
			type: Schema.Types.ObjectId,
		},
		programTotalView: {
			type: Number,
			default: 0,
		},
		programProcess: {
			type: Number,
			default: 1,
		},
		// this is old status when change status of program transfer to program edit
		status: {
			type: String,
			enum: ['approval', 'omn', 'instant', null],
			default: null,
		},
		isResultLetter: {
			type: Boolean,
			default: false,
		},
		videoRank: {
			type: Number,
			enum: Object.values(constants.VIDEO_RANK),
			default: constants.VIDEO_RANK.ENTIRE,
		},
		linkVideoDRM: {
			type: Object,
		},
		flagDRM: {
			type: Boolean,
			default: false,
		},
		timePlay: {
			type: Date,
			default: '',
		},
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
		// id data backup of program
		historyEditProgramID: {
			type: Schema.Types.ObjectId,
			ref: 'HistoryEditProgramSchema',
		},
		// video thumbnail of program
		videoThumbnail: {
			type: String,
			default: '',
		},
		verifyDenial: {
            type: Boolean,
            default: null,
        },
	},
	{
		timestamps: true,
		collection: 'program_edit',
	}
);

ProgramEditSchema.methods.toJSON = function () {
	const programEdit = this;
	const programEditObject = programEdit.toObject();
	delete programEditObject.__v;
	return programEditObject;
};

ProgramEditSchema.query.sortable = function (request) {
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
ProgramEditSchema.plugin(AutoIncrement, { inc_field: 'programIDEdit' });

// add plugins soft delete
ProgramEditSchema.plugin(mongooseDelete, {
	overrideMethods: false,
	deletedAt: true,
});

ProgramEditSchema.plugin(mongoosePaginate);

ProgramEditSchema.paramLike = ['programName', 'programTitle', 'programSubTitle', 'programSummary'];

logQuery.logDBTime(ProgramEditSchema);

module.exports = mongoose.model('ProgramEditSchema', ProgramEditSchema);
