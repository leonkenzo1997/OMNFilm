const express = require('express');
const router = express.Router();

const membershipRoute = require('./Membership/MembershipRoute');
const footerRoute = require('./Footer/FooterRoute');
const accessRoute = require('./Access/AccessRoute');
const categoryManageRoute = require('./CategoryManage/CategoryManageRoute');
const EmployeeRoute = require('./Employee/EmployeeRoute');
const tagRoute = require('./Tag/TagRoute');
const revenusSharingRoute = require('./RevenusSharing/RevenusSharingRoute');
const surveyRoute = require('./Survey/SurveyRoute');
const deactiveRoute = require('./DeactiveManage/DeactiveRoute');

// api footer route
router.use('/category-manage', categoryManageRoute);

// api employee route
router.use('/employee', EmployeeRoute);

// api access route
router.use('/access', accessRoute);

// api membership route
router.use('/membership', membershipRoute);

// api footer route
router.use('/footer', footerRoute);

// api tag route
router.use('/tag', tagRoute);

// api footer route
router.use('/revenus-sharing', revenusSharingRoute);

// api footer route
router.use('/survey', surveyRoute);

// api footer route
router.use('/deactive', deactiveRoute);

module.exports = router;
