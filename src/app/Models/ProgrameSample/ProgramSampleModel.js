const { object } = require('joi');
const { constant } = require('lodash');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// library for soft delete
const mongooseDelete = require('mongoose-delete');
const AutoIncrement = require('mongoose-sequence')(mongoose);
const mongoosePaginate = require('mongoose-paginate-v2');
const constants = require('../../Constant/constants');

const ProgramSampleSchema = new Schema(
	{
		programName: {
			type: String,
			required: true,
		},
		slugName: {
			type: String,
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
			default: constants.TYPE_VIDEO.SS,
		},
		programEpisodeSummary: {
			type: String,
		},
		programSeasonChild: {
			// IF type = parent THEN = false
			type: Boolean,
			default: true,
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
						ref: 'ProgramSampleSchema',
					},
				],
			},
		],
		programChildrenSeasonData: {
			// Info of children
			parentID: {
				type: Schema.Types.ObjectId,
				ref: 'ProgramSampleSchema',
			},
			seasonName: {
				type: String,
				default: '',
				require: true,
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
			default: constants.PROGRAM_STATUS.UPLOAD,
		},
		programEditor: {
			type: Number,
			default: 0,
		},
		isEdit: {
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
		videoRank: {
			type: String,
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
		timePlay: {
			type: Date,
			default: '',
		},
		timeTemp: {
			type: Date,
			default: '',
		},
		// save total time video
		totalTime: {
			type: Number,
			default: 0
		}
	},
	{
		timestamps: true,
		collection: 'program_sample',
	}
);

// custom query helpers
ProgramSampleSchema.query.sortable = function (request) {
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
// ProgramSampleSchema.plugin(AutoIncrement, { inc_field: 'programID' });

// add plugins soft delete
ProgramSampleSchema.plugin(mongooseDelete, {
	overrideMethods: false,
	deletedAt: true,
});

ProgramSampleSchema.plugin(mongoosePaginate);

ProgramSampleSchema.paramLike = ['programName', 'programTitle', 'programSubTitle', 'programSummary'];

module.exports = mongoose.model('ProgramSampleSchema', ProgramSampleSchema);
