const system = require('../../Constant/General/SystemConstant');
const uploadConstant = require('../../Constant/Upload/UploadConstant');
const logger = require('../../Constant/Logger/loggerConstant');
const constants = require('../../Constant/constants');
const _ = require('lodash');

const validation = async (request, response, next) => {
	const formData = request.body;
	const params = request.params;
	const errors = [];
	const programTypeVideo = formData.programTypeVideo;
	try {
		let fieldsValidate;
		if (programTypeVideo === constants.TYPE_VIDEO.SS) {
			// validate keys
			if (params.id) {
				fieldsValidate = uploadConstant.fieldsUpload;
			} else {
				fieldsValidate = uploadConstant.fieldsCreate;
			}
		} else {
			// validate keys
			if (params.id) {
				fieldsValidate = uploadConstant.fieldsUploadStandAlone
			} else {
				fieldsValidate = uploadConstant.fieldsCreateStandAlone
			}
		}

		const fieldsSelect = Object.fromEntries(Object.entries(formData).filter(item => fieldsValidate.includes(item[0])))
		const keyData = Object.keys(fieldsSelect)
		const valueData = Object.values(fieldsSelect);

		const isValidKeys = keyData.every((item) => {
			return fieldsValidate.includes(item);
		});

		// validate values
		const isValidValues = valueData.some((item) => {
			if (typeof item !== 'number') _.isEmpty(item)
		});

		if (!isValidKeys) {
			const fields = (keyData.filter(item => !fieldsValidate.includes(item))).join(', ')
			return logger.status400(response, system.invalidField + fields, system.error);
		}
		if (isValidValues) {
			return logger.status400(response, system.errorValue, system.error);
		}
		next();
	} catch (error) {
		errors.push(error.message);
		return logger.status400(response, error, errors, system.error);
	}
};

module.exports = validation;
