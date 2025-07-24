const system = {
  success: true,
  error: false,
  errorField: "Field invalid!!!",
  invalidField: "Field invalid at: ",
  errorValue: "Value invalid!!!",
  logoutAll: "Logout all successfully!!!",
  logout: "Logout successfully!!!",
  login: "login successfully",
  registerAdmin: "Register successfully Admin",
  registerUser: "Register successfully account",
  errorAuthentication: "Please authenticate",
  errorEmail: "Email is invalid!!!",
  approval: "Approval success",
  denied: "Denied success",
  permission: "Permission denied",
  deleted: "Deleted success",
  review: "review success",
  isMatchPassword: "Current password is wrong. Please input again!!!",
  checkNewPassword:
    "New password and confirm password do not match. Please input again!!!",
  checkNewPinCode:
    "New pin code and confirm pin code do not match. Please input again!!!",
  changePassword: "Change successfully password !!!",
  changePhoneNumber: "Change successfully phone number",
  invalidPhoneNumber: "Your phone number is invalid. Please input again !!!",
  invalidAreaCode: "Your area code is invalid. Please input again!!!",
  notFoundAreaCode: function (id) {
    return "Not found _id: " + id + " in area code";
  },
  notFoundProgram: function (id) {
    return "Not found _id: " + id + " in program";
  },
  missingIdAreaCode: "ID is required. Please input id of area-code!!!",
  deletePhoneNumber: "Delete phone number successful!!!!",
  tokenExpired: "Token Expired !",
  resetPasswordSuccess: "Reset password successfully!!!",
  resetPasswordFail: "Reset password fail!!!",
  resetPinCodeSuccess: "Reset pin code successfully!!!",
  resetPinCodeFail: "Reset pin code fail!!!",
  otpInvalid: "OTP is invalid. Please input again!!!",
  otpValid: "OTP is valid",
  connect: "Not connect database",
  sendOTPSuccess: "email is sent successful for user",
  sendOTPError: "email can not send for user",
  errorUUID: "Your UUID is invalid. Please input again!!!",
  errorDeactive: "Your request is wrong. Please Deactive plan again!!!",
  missingFieldHasReceiveNews: "missing field hasReceiveNews",
  successDeactive: "Deactive plan successfully!!!",
  limitPinCode: "Pin code have limited 4 positive numbers",
  invalidPinCode: "Your pin code is invalid. Please input again!!!",
  validPinCode: "Your pin code is valid. You can use it!!!",
  addLike: function (id) {
    return "Program _id: " + id + " have been increased one like";
  },
  likeProgram: function (id) {
    return "You liked for program _id: " + id;
  },
  addUnlike: function (id) {
    return "Program _id: " + id + " have been increased one unlike";
  },
  unlikeProgram: function (id) {
    return "You unliked for program _id: " + id;
  },
  removeLike: function (id) {
    return "You removed like for program _id: " + id;
  },
  removeUnlike: function (id) {
    return "You removed unlike for program _id: " + id;
  },
  decreaseLikeProgram: function (id) {
    return "Program _id: " + id + " have decreased one like";
  },
  decreaseUnlikeProgram: function (id) {
    return "Program _id: " + id + " have decreased one unlike";
  },
  notFound: function (id) {
    return "Not found _id: " + id + " in system";
  },
  notSave: "Could not be saved",
  statusInvalid: "Status invalid",
  addSuccessHistory: "Add history success",
  missingField: "Missing field: ",
  notFoundSeasonID: "Season id not found",
  listSurveyLimit:
    "List survey is limit. Please remove other survey and add new survey again!!!",
  addSuccessSurvey: function (id) {
    return "Adding survey " + id + " success";
  },
  updateSuccessSurvey: function (id) {
    return "Update survey" + id + " success!!!";
  },
  updateParentProtectionSuccess: "update Parent Protection Successful!!!",
  confirmPassword: "password is correct!!!",
  membershipInvalid: "Membership invalid!!!",
  addDataSuccess: "add data success",
  notFoundSurvey: "Survey id not found",
  notPermissionCreateSurvey: "Program parent can't create survey",
  updateVideoSetting: "update video setting successful",
  unpermissionUpdateVideoSetting: function (packageName) {
    return (
      "your membership is " +
      packageName +
      ". You don't have permission to change video setting. Please update your membership up Premium package !!!"
    );
  },
  createUser: "Create successfully account",
};

module.exports = system;
