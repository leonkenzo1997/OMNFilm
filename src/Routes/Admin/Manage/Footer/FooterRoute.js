const express = require('express');
const router = express.Router();

const privacyPolicyRoute = require('../Footer/PrivacyPolicy/PrivacyPolicyRoute');
const companyInformationRoute = require('../Footer/CompanyInformation/CompanyInformationRoute');
const termsAndConditionsRoute = require('../Footer/TermsAndConditions/TermsAndConditionsRoute');
const videoManagePolicyRoute = require('../Footer/VideoManagePolicy/VideoManagePolicyRoute');

// api privacy-policy route
router.use('/privacy-policy', privacyPolicyRoute);

//api company-information route
router.use('/company-information', companyInformationRoute);

//api terms-and-conditions route
router.use('/terms-and-conditions', termsAndConditionsRoute);

//api video manage policy route
router.use('/video-manage-policy', videoManagePolicyRoute);

module.exports = router;
