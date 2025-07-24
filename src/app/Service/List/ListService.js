const listModel = require('../../Models/List/ListModel');

const list = {
	findById: async (id) => {
		const listData = await listModel.findById({ _id: id });
		return listData;
	},
};

module.exports = list;
