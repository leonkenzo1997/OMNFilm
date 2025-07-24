const USER_TYPE = {
    USER: 0,
    ADMIN: 1,
    EMPLOYEE: 2,
    RS: 3,
    SUPPERADMIN: 4,
};

const ACCESS_USER = ['User Normal', 'Admin', 'Employee', 'RS User', 'Supper Admin'];

const USER_VIDEO_SETTING = {
    HD: 0,
    FULL_HD: 1,
};

const NODE_ENV = {
    PRODUCTION: 'production',
    DEV: 'dev',
};

const PROGRAM_STATUS = {
    EDIT: 'edit',
    APPROVAL: 'approval',
    DENIAL: 'denial',
    OMN: 'omn',
    REVIEW: 'review',
    UPLOAD: 'upload',
    DELETE: 'delete',
    INSTANT: 'instant',
};

const PROGRAM_TYPE = {
    CHALLENGER: 'challenger',
    UPLOAD: 'upload',
    PRODUCTION_SUPPORT: 'production support',
    SEFT_PRODUCTION: 'self production',
    SAMPLE: 'sample',
    PRODUCTION_SUPPORT_SAMPLE: 'production support sample',
    PROGRAM_ORIGINAL: 'original',
};

const TYPE_DEVICE = {
    IOS: 'ios',
    ANDROID: 'android',
    WEB: 'web',
};

const LIST_TYPE = {
    NO_LOOP: 'no loop',
    GENRE: 'genre',
    SPECIFIC: 'specific',
};

const TYPE_VIDEO = {
    SA: 'stand alone',
    SS: 'season',
    SP: 'sample',
};

const TYPE_EPISODE = {
    PARENT: 'parent',
    CHILDREN: 'children',
    SINGLE: 'single',
};

// type call api get history
const HISTORY_TYPE = {
    DELETE: 'delete',
    NOT_DELETE: 'not-delete',
};

// status for history
const HISTORY_STATUS = {
    EDIT: 'edit',
    APPROVAL: 'approval',
    DENIAL: 'denial',
    OMN: 'omn',
    REVIEW: 'review',
    UPLOAD: 'upload',
    DELETE: 'delete',
    INSTANT: 'instant',
    EDIT_REVERT_DATA: 'edit-revert',
};
const TYPE_PROGRAM_HISTORY = {
    CHALLENGER: 1,
    CHALLENGER_PROGRAM: 2,
    UPLOAD: 3,
    UPLOAD_PROGRAM: 4,
    ORIGINAL: 5,
};

const VIDEO_RANK = {
    ENTIRE: 0,
    YEARS_OLD_12: 1,
    YEARS_OLD_15: 2,
    YEARS_OLD_19: 3,
};

const PROGRAM_TYPE_ONLINE_SHOW = [
    PROGRAM_TYPE.UPLOAD,
    PROGRAM_TYPE.PRODUCTION_SUPPORT,
    PROGRAM_TYPE.PROGRAM_ORIGINAL,
];

const TYPE_BACKGROUND = {
    VIDEO: 0,
    POSTER: 1,
    BACKUP: 2,
};

const TYPE_PARENT_PROTECTION = {
    AGE_NULL: 0,
    AGE_12: 1,
    AGE_15: 2,
    AGE_18: 3,
};

const PAYMENT_PROBLEM = {
    ERROR: 0,
    UNAUTHEN: 1,
    APPROVAL_FAIL: 2,
};

const MEMBER_SHIP = {
    PREMIUM: 'premium',
    STANDARD: 'standard',
    BASIC: 'basic',
};

// Notification
const TYPE_SEND_NOTIFICATION = {
    PREMIUM: 'premium',
    STANDARD: 'standard',
    BASIC: 'basic',
    ALL: 'all',
    DIRECT_INPUT: 'direct_input',
};

const CATEGORY_NOTIFICATION = {
    ALL: 0,
    ACCOUNT: 1,
    MEMBERSHIP: 2,
    PAYMENT: 3,
    OTHER: 4,
    PROGRAM: 5,
};

const MESSAGES_NOTIFICATION = {
    OTHER_MESSAGES: 'notification_other_messages',
    ONLINE: 'new_notification_online',
    OFFLINE: 'new_notification_offline',
    STATUS_EPISODE_OFFLINE: 'status_episode_offline',
};

const DISPLAY_NOTIFICATION = {
    OFFLINE: 0,
    ONLINE: 1,
};
// End notification

const RESOLUTION = {
    HD: '720p',
    FHD: '1080p',
};

const DATA_ADMIN = { _id: '5f8fbbfff125ce0d9132220b', email: 'admin@brickmate.kr' };

const DATA_SUPER_ADMIN = {
    ID: '60ab180f2964980d70e4550d',
    EMAIL: 'superadmin@brickmate.kr',
};

const DEFAULT_THUMNAIL =
    'https://omn-image-input.s3.ap-northeast-2.amazonaws.com/Upload/Poster/03_2021/08/screenshot_1615189157.png';

const BACKGROUND_TYPE = {
    AVAILABLE: 'available',
    REMOVED: 'removed',
    EXPIRED: 'expired',
};

const USERFEEDBACK_TYPE = {
    WI: 'Wrong Information on Contents',
    PP: 'Playback Problems',
    SP: 'Sound Problems',
    NP: 'Network Problems',
};

const USER_REASON = {
    1: 'Macro',
    2: 'Repeated View',
    3: 'Unfair Profit',
};

const MESSAGE_CATEGORY = {
    PROGRAM: 'program',
    PROFIT: 'profit',
    ACCOUNT: 'account',
    OTHER: 'other',
    PAYMENT: 'payment',
    MEMBERSHIP: 'membership',
    ORIGINAL: 'original',
};

const MESSAGE_TYPE = {
    MANUAL: 'manual',
    AUTO: 'auto',
};

const MESSAGE_TITLE = {
    UPLOAD_REQUEST: 'UPLOAD REQUEST',
    PROFIT_REQUEST: 'PROFIT_REQUEST',
    PROFIT_PAID_COMPLETE: 'PROFIT PAID COMPLETE',
    PROFIT_REQUEST_CANCEL: 'PROFIT REQUEST CANCEL',
    EDIT_REQUEST_CONFIRM: 'EDIT REQUEST CONFIRM',
    EDIT_CONFIRMED: 'EDIT CONFIRMED',
    EDIT_REJECTED: 'EDIT REJECTED',
    UPLOAD_REJECT_01: '업로드 기준 미적합',
    UPLOAD_REJECT_02: '음원 저작권 반려',
    UPLOAD_REJECT_03: '영상 저작권 반려',
    UPLOAD_REJECT_04:
        '기입 내용 오류 (줄거리 및 정보 불일치, 인트로&아웃트로 설정 오류 등)',
    UPLOAD_APPROVE_01: '승인 템플릿',
};

const NOTIFICATION_BODY_TYPE = {
    MESSAGE_FROM_ADMIN: 'message_from_admin',
    ORIGINAL_APPROVE: 'original_approve',
    PROGRAM_UPLOAD: 'program_upload',
    PAYMENT_PROBLEM: 'payment_problem',
    PROFIT: 'profit',
    PARTICIPANTS_RATE: 'participants_rate'

}

const LANGUAGE = {
    KR: 'kr',
    EN: 'en'
}

module.exports = {
    USER_TYPE,
    NODE_ENV,
    PROGRAM_STATUS,
    PROGRAM_TYPE,
    TYPE_DEVICE,
    LIST_TYPE,
    TYPE_VIDEO,
    TYPE_EPISODE,
    HISTORY_TYPE,
    HISTORY_STATUS,
    PROGRAM_TYPE_ONLINE_SHOW,
    TYPE_PROGRAM_HISTORY,
    VIDEO_RANK,
    TYPE_BACKGROUND,
    DISPLAY_NOTIFICATION,
    TYPE_PARENT_PROTECTION,
    PAYMENT_PROBLEM,
    MEMBER_SHIP,
    TYPE_SEND_NOTIFICATION,
    CATEGORY_NOTIFICATION,
    MESSAGES_NOTIFICATION,
    RESOLUTION,
    DEFAULT_THUMNAIL,
    BACKGROUND_TYPE,
    USER_VIDEO_SETTING,
    ACCESS_USER,
    USERFEEDBACK_TYPE,
    USER_REASON,
    MESSAGE_CATEGORY,
    MESSAGE_TYPE,
    DATA_ADMIN,
    DATA_SUPER_ADMIN,
    MESSAGE_TITLE,
    NOTIFICATION_BODY_TYPE,
    LANGUAGE
};
