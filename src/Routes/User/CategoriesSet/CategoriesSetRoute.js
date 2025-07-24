const express = require('express');
const categoriesSetRoute = express.Router();

const categoriesSetController = require('../../../app/Controllers/User/CategoriesSet/CategoriesSetController');

// api get list get survey
categoriesSetRoute.get('/', categoriesSetController.index);

module.exports = categoriesSetRoute;
