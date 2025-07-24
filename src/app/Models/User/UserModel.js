const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const keyToken = process.env.KEY_GENERATE_TOKEN;
const salt = process.env.SALT;

// library for soft delete
const mongooseDelete = require('mongoose-delete');
const AutoIncrement = require('mongoose-sequence')(mongoose);
const mongoosePaginate = require('mongoose-paginate-v2');

const CONSTANT = require('../../Constant/constants');
const McashSeed = require('../../Service/Cipher/McashSeed');
const KEY_MCASHSEED = process.env.KEYPROFIT;
const MembershipModel = require('../../Models/Manage/Membership/MembershipModel');
const logQuery = require('../../../app/Service/Logging/LogtimeDB');

const UserSchema = new Schema(
    {
        userID: {
            type: Number,
        },
        userName: {
            type: String,
            default: '',
        },
        userEmail: {
            type: String,
            unique: true,
            required: true,
            trim: true,
            sparse: true,
            lowercase: true,
            validate(value) {
                if (!validator.isEmail(value)) {
                    throw new Error('Email is valid');
                }
            },
        },
        userPassword: {
            type: String,
            required: true,
        },
        userType: {
            type: Number,
            default: 0,
        },
        userPhoneNumber: {
            type: Object,
            default: {},
        },
        userGender: {
            type: String,
            enum: ['male', 'female'],
            default: 'male',
        },
        userDOB: {
            type: Date,
            default: null,
        },
        userMembership: {
            type: Schema.Types.ObjectId,
            ref: 'MembershipSchema',
            default: null,
        },
        userToken: [
            {
                token: {
                    type: String,
                    required: true,
                },
                deviceToken: {
                    type: String,
                    default: null,
                },
                typeDevice: {
                    type: String,
                    enum: [
                        CONSTANT.TYPE_DEVICE.ANDROID,
                        CONSTANT.TYPE_DEVICE.IOS,
                        CONSTANT.TYPE_DEVICE.WEB,
                    ],
                    default: CONSTANT.TYPE_DEVICE.WEB,
                    require: true,
                },
            },
        ],
        userCategoriesSet: [
            {
                type: Schema.Types.ObjectId,
                ref: 'CategoriesSetSchema',
            },
        ],
        mylist: [
            {
                type: Schema.Types.ObjectId,
                ref: 'ProgramSchema',
            },
        ],
        userPinCode: {
            type: String,
        },
        isPinCode: {
            type: Boolean,
            default: false,
        },
        usingPinCode: {
            type: Boolean,
            default: false,
        },
        videoPlaying: {
            type: Object,
        },
        userDeparment: [
            {
                type: Schema.Types.ObjectId,
                ref: 'DepartmentSchema',
            },
        ],
        userTeam: {
            type: Schema.Types.ObjectId,
            ref: 'TeamSchema',
        },
        userEmployee: {
            type: Schema.Types.ObjectId,
            ref: 'EmployeeSchema',
        },
        userUsage: {
            type: Boolean,
            default: false,
        },
        memberShipStartDay: {
            type: Date,
        },
        memberShipEndDay: {
            type: Date,
        },
        nameSocial: {
            type: String,
        },
        signDateSocial: {
            type: String,
        },
        commidSocial: {
            type: String,
        },
        noSocial: {
            type: String,
        },
        socialNo: {
            type: String,
        },
        foreigner: {
            type: String,
        },
        confirmAge: {
            type: Boolean,
            default: false,
        },
        parentProtection: {
            type: Schema.Types.ObjectId,
            ref: 'ParentProtectionSchema',
        },
        isAddingBankingInfor: {
            type: Boolean,
            default: false,
        },
        bankingInfor: {
            koreanBank: {
                type: Schema.Types.ObjectId,
                ref: 'KoreanBankSchema',
            },
            accountName: {
                type: String,
            },
            accountNumber: {
                type: String,
            },
        },
        rsRate: {
            type: Number,
            default: null,
        },
        taxRate: {
            type: Number,
            default: null,
        },
        meno: {
            type: String,
            default: null,
        },
        companyName: {
            type: String,
            default: null,
        },
        hasService: {
            type: Date,
        },
        // check to receive news or new program when user had deactive account
        hasReceiveNews: {
            type: Boolean,
            default: true,
        },
        // type quality video
        userSettingVideo: {
            type: Number,
            default: CONSTANT.USER_VIDEO_SETTING.HD,
            enum: Object.values(CONSTANT.USER_VIDEO_SETTING),
        },
        employeeNumber: {
            type: String,
        },
        holdDay: {
            type: Date,
            default: null,
        },
        appealDay: {
            type: Date,
            default: null,
        },
        deactivate: {
            type: Boolean,
            default: false,
        },
        deactivateDay: {
            type: Date,
            default: null,
        },
        destructionDay: {
            type: Date,
            default: null,
        },
        reasonDel: {
            type: String,
            default: null,
        },
    },
    {
        timestamps: true,
        collection: 'users',
    }
);

// create relationship with object virtual. but it will not save in db
// it will relate data with 2 table. in here, it will relate between user and challenger
UserSchema.virtual('challengerList', {
    ref: 'ProgramSchema', // table challenger
    localField: '_id', // _id of user
    foreignField: 'userID', // field contain id of user in challenger model
});

// create relationship with object virtual. but it will not save in db
// it will relate data with 2 table. in here, it will relate between user and upload
UserSchema.virtual('uploadList', {
    ref: 'UploadSchema', // table challenger
    localField: '_id', // _id of user
    foreignField: 'userID', // field contain id of user in upload model
});

// custom query helpers
UserSchema.query.sortable = function (request) {
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

// using hiding private data of user when relate data and send for the client
UserSchema.methods.toJSON = function () {
    const user = this;
    const userObject = user.toObject();
    const MCashSeed = new McashSeed();

    delete userObject.userPassword; // remove pass word
    delete userObject.userToken; // remove token
    delete userObject.userPinCode;
    delete userObject.__v;
    delete userObject.nameSocial;
    delete userObject.noSocial;
    delete userObject.commidSocial;
    delete userObject.foreigner;

    if (!userObject.isAddingBankingInfor) {
        delete userObject.bankingInfor;
    } else {
        userObject.bankingInfor.accountNumber =
            userObject.bankingInfor.accountNumber &&
            MCashSeed.decodeString(
                userObject.bankingInfor.accountNumber,
                KEY_MCASHSEED
            ).replace(/\0/g, '');
    }

    return userObject;
};

// function generate authentication token for user when user login
UserSchema.methods.generateAuthenticationToken = async function (session, data) {
    const user = this;

    const token = jwt.sign({ _id: user._id.toString() }, keyToken, {
        expiresIn: process.env.JWT_EXPIRES_IN,
    });
    if (!data.hasOwnProperty('deviceToken')) {
        data.deviceToken = '';
    }
    if (!data.hasOwnProperty('typeDevice')) {
        data.typeDevice = CONSTANT.TYPE_DEVICE.WEB;
    }
    let deviceTokenList = user.userToken;
    let tokenOld = [];
    if (user.userType === CONSTANT.USER_TYPE.USER) {
        const memberShip = await MembershipModel.findById(user.userMembership);

        if (!memberShip || memberShip.packageName !== CONSTANT.MEMBER_SHIP.PREMIUM) {
            tokenOld = deviceTokenList;
            deviceTokenList = [];
        }
    }

    if (user.userType === CONSTANT.USER_TYPE.ADMIN) {
        if (deviceTokenList.length >= 5) {
            //alert socket
            sockets.emit('device_logout', { token: deviceTokenList[0].token });
            deviceTokenList.shift();
        }
    } else {
        if (deviceTokenList.length >= 2) {
            //alert socket
            sockets.emit('device_logout', { token: deviceTokenList[0].token });
            deviceTokenList.shift();
        } else {
            if (tokenOld.length > 0) {
                sockets.emit('device_logout', { token: tokenOld[0].token });
            }
        }
    }
    user.userToken = deviceTokenList.concat({
        token: token,
        deviceToken: data.deviceToken,
        typeDevice: data.typeDevice,
    });

    if (session) {
        await user.save({ session: session });
    } else {
        await user.save();
    }

    return token;
};

// handle check email and password
UserSchema.statics.findByCredentials = async (email, password, error) => {
    const user = await userModel
        .findOne({
            userEmail: email.userEmail,
        })
        .populate({
            path: 'userDeparment',
            select: ['departmentName', 'departmentCode'],
        });

    const result = {
        errors: error.errors,
        data: user,
        password: false,
    };

    if (!user) {
        result.errors.push(
            'Email or Password is wrong. Unable to login. Please enter email and password again!!!'
        );
        return result;
    }

    const isMatch = await bcrypt.compare(password.userPassword, user.userPassword);
    result.password = isMatch;

    if (!isMatch) {
        result.errors.push(
            'Email or Password is wrong. Unable to login. Please enter email and password again!!!'
        );
        return result;
    }

    return result;
};

// Hash the plain text password before saving
UserSchema.pre('save', async function (next) {
    const user = this;
    const MCashSeed = new McashSeed();
    if (user.isModified('userPassword')) {
        user.userPassword = await bcrypt.hash(user.userPassword, +salt);
    }

    if (user.isModified('userPinCode')) {
        user.userPinCode = await bcrypt.hash(user.userPinCode, +salt);
    }

    if (user.isModified('bankingInfor')) {
        user.bankingInfor.accountNumber = MCashSeed.encodeString(
            user.bankingInfor.accountNumber,
            KEY_MCASHSEED
        ).replace(/\0/g, '');
    }

    next();
});

//add plugins auto increment id
UserSchema.plugin(AutoIncrement, { inc_field: 'userID' });

// add plugins soft delete
UserSchema.plugin(mongooseDelete, {
    overrideMethods: true,
    deletedAt: true,
    use$neOperator: false,
});

// handle check email and password
UserSchema.statics.findByIdPass = async (id, password, error) => {
    let user = await userModel.findOne({
        _id: id,
    });

    let result = {
        errors: error.errors,
        user: user,
        password: false,
    };

    if (!user) {
        result.errors.push(
            'Email or Password is wrong. Unable to login. Please enter email and password again!!!'
        );
        return result;
    }

    const isMatch = await bcrypt.compare(password, user.userPassword);
    result.password = isMatch;

    if (!isMatch) {
        result.errors.push(
            'Email or Password is wrong. Unable to login. Please enter email and password again!!!'
        );
        return result;
    }

    return result;
};

// handle check email and password
UserSchema.statics.createPass = async (password) => {
    return await bcrypt.hash(password, +salt);
};

UserSchema.plugin(mongoosePaginate);

UserSchema.paramLike = ['userEmail', 'userName'];

UserSchema.virtual('user-program', {
    ref: 'UserProgramSchema', // table challenger
    localField: '_id', // _id of user
    foreignField: 'userID', // field contain id of user in upload model
    justOne: true,
});

UserSchema.virtual('count-program', {
    ref: 'ProgramSchema',
    localField: '_id',
    foreignField: 'userID',
});

UserSchema.virtual('user-payment', {
    ref: 'PaymentSchema', // table challenger
    localField: '_id', // _id of user
    foreignField: 'idUser', // field contain id of user in challenger model
    match: { deleted: false },
    justOne: true,
});

logQuery.logDBTime(UserSchema);

const userModel = mongoose.model('UserSchema', UserSchema);

module.exports = userModel;
