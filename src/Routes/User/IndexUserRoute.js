const userRoute = require('./UserRoute');
const membershipRoute = require('./Membership/MembershipRoute');
const companyInformationRoute = require('./CompanyInformation/CompanyInformationRoute');
const privacyPolicyRoute = require('./PrivacyPolicy/PrivacyPolicyRoute');
const termsAndConditionsRoute = require('./TermsAndConditions/TermsAndConditionsRoute');
const videoManagePolicy = require('./VideoManagePolicy/VideoManagePolicyRoute');
const categoriesSetRoute = require('./CategoriesSet/CategoriesSetRoute');
const paymentRoute = require('./Payment/Payment');
const pushRoute = require('./PushNotification/PushRoute');
const recentVideoRoute = require('./RecentVideo/RecentVideoRoute');
const ageRoute = require('./Age/AgeRoute');
const convertRoute = require('./MediaConvert/MediaConvertRoute');
const parentProtectionRoute = require('./ParentProtection/ParentProtectionRoute');
const bankingInforRoute = require('./BankingInformation/BankingInformationRoute');

module.exports = (app) => {
	// membership route
	app.use('/user/membership', membershipRoute);

	// company-information route
	app.use('/user/company-information', companyInformationRoute);

	// privacy-policy route
	app.use('/user/privacy-policy', privacyPolicyRoute);

	// terms-and-conditions route
	app.use('/user/terms-and-conditions', termsAndConditionsRoute);

	// video-manage-policy route
	app.use('/user/video-manage-policy', videoManagePolicy);

	// video-manage-policy route
	app.use('/user/categories-set', categoriesSetRoute);

	// payment route
	app.use('/user/payment', paymentRoute);

	// push notication
	app.use('/user/push-notification', pushRoute);

	// recent video
	app.use('/user/recent-video', recentVideoRoute);

	// user router
	app.use('/user', userRoute);

	// age route
	app.use('/user/age', ageRoute);

	// media convert
	app.use('/user/media-convert', convertRoute);

	// parent protection
	app.use('/user/parent-protection', parentProtectionRoute);

	// parent protection
	app.use('/user/banking-information', bankingInforRoute);
};
