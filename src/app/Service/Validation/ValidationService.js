const validation = {
	checkFieldTypeArray: function (field) {
		const isArray = Array.isArray(field);
		return isArray;
	},
	checkFieldTypeString: function (field) {
		const isString = typeof field === 'string';
		return isString;
	},
	checkFieldTypeNumber: function (field) {
		const isNumber = typeof field === 'number';
		return isNumber;
	},
};

module.exports = validation;
