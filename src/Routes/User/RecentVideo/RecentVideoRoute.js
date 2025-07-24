const express = require('express');
const RecentVideoRouter = express.Router();

const RecentVideoController = require('../../../app/Controllers/User/RecentVideo/RecentVideoController');
const checkAuthorization = require('../../../app/Middlewares/Authentication/Authentication');

// api create recent video
RecentVideoRouter.post('/', checkAuthorization, RecentVideoController.create);

// api get list recent video
RecentVideoRouter.get('/', checkAuthorization, RecentVideoController.index);

module.exports = RecentVideoRouter;
