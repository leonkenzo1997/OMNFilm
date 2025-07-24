const express = require('express');
const accessRouter = express.Router();

const deptRoute = require('./Dept/DeptRoute');
const teamRoute = require('./Team/TeamRoute');
const employeeRoute = require('./Employee/EmployeeRoute');

// api privacy-policy route
accessRouter.use('/dept', deptRoute);

//api company-information route
accessRouter.use('/team', teamRoute);

//api terms-and-conditions route
accessRouter.use('/employee', employeeRoute);

module.exports = accessRouter;
