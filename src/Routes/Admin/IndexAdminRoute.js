const express = require('express');

const homeSetRoute = require('./HomeSet/HomSetRoute');
const categoriesSetRoute = require('./CategoriesSet/CategoriesSetRoute');
const uploadRoute = require('./Upload/UploadRoute');
const listRoute = require('./List/ListRoute');
const challengerRoute = require('./Challenger/ChallengerRoute');
const challengerProgramRoute = require('./Challenger/ChallengerProgramRoute');
const manageRoute = require('./Manage/ManageRoute');
const adminRoute = require('./Admin/AdminRoute');
const programEditRoute = require('./ProgramEdit/ProgramEditRoute');
// const bractersRoute = require('./Bracters/BractersRoute');
const bractersRoute = require('./Bracters/BractersRouteV2');
const messagesRoute = require('./Messages/MessagesRoute');
const uploadProgramRoute = require('./Upload/UploadProgramRoute');

const imagesRoute = require('./Images/ImagesRoute');
const productionSupportRoute = require('./ProductionSupport/ProductionSupportRoute');
const programSampleRoute = require('./ProgramSample/ProgramSampleRoute');
const backgroundRoute = require('./Background/BackgroundRoute');
const parentProtection = require('./ParentProtection/ParentProtectionRoute');
const productionSupportSampleRoute = require('./ProductionSupportSample/ProductionSupportSampleRoute');
const ProfitPaymentRoute = require('./ProfitPayment/ProfitPaymentRoute');
const programOriginalRoute = require('./ProgramOriginal/ProgramOriginalRoute');
const CRMRoute = require('./CRM/CRMRoute');
const surveyRoute = require('./Survey/SurveyRoute');
const surveyProgramRoute = require('./Survey/SurveyProgramRoute');
const surveyProgramEditRoute = require('./Survey/SurveyProgramEditRoute');
const userManagerRoute = require('./UserManager/UserAccontRoute');
const abusingRoute = require('./Abusing/AbusingRoute');
const userManagementRoute = require('./UserManager/UserManagementRoute');

module.exports = (app) => {
    // homeset router
    app.use('/admin/homeset', homeSetRoute);

    // categories set router
    app.use('/admin/categoriesset', categoriesSetRoute);

    // upload router
    app.use('/admin/upload', uploadRoute);

    // list router
    app.use('/admin/list', listRoute);

    //challenge router
    app.use('/admin/challenger', challengerRoute);

    //challenger program router
    app.use('/admin/challenger-program', challengerProgramRoute);

    //upload program router
    app.use('/admin/upload-program', uploadProgramRoute);

    //manage  router
    app.use('/admin/manage', manageRoute);

    //admin router
    app.use('/admin', adminRoute);

    //admin router program edit
    // app.use('/admin/program-edit', programEditRoute);

    //admin router bracters
    app.use('/admin/bracters', bractersRoute);

    //admin router messages
    app.use('/admin/messages', messagesRoute);

    //convert image area code -> base64
    app.use('/admin/images', imagesRoute);

    //admin router production support
    app.use('/admin/production-support', productionSupportRoute);

    //admin router program sample
    app.use('/admin/program-sample', programSampleRoute);

    //admin router background app
    app.use('/admin/background', backgroundRoute);

    //admin router parent protection app
    app.use('/admin/parent-protection', parentProtection);

    //admin router production support sample
    app.use('/admin/production-support-sample', productionSupportSampleRoute);

    //admin router profit payment
    app.use('/admin/profit-payment', ProfitPaymentRoute);

    // admin router program original
    app.use('/admin/program-original', programOriginalRoute);

    // admin router CRM
    app.use('/admin/crm', CRMRoute);

    // admin router survey
    app.use('/admin/survey', surveyRoute);

    // admin router survey program
    app.use('/admin/survey-program', surveyProgramRoute);

    // admin router survey program
    // app.use('/admin/survey-program-edit', surveyProgramEditRoute);

    // user manager admin
    app.use('/admin/user-manager', userManagerRoute);

    // abusing route
    app.use('/admin/abusing', abusingRoute);

    // user management route
    app.use('/admin/user-management', userManagementRoute);
};
