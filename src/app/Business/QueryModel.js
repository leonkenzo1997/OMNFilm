const queryBusiness = {
	handle(model, request, relation, selects) {
		let paginate = this.getPaginate(request);
		let select = this.getSelect(model, request);

		if (relation) {
			paginate.populate = relation;
		}

		if (selects) {
			paginate.select = selects;
		}

		return model.paginate(select, paginate);
	},

	getPaginate: function (request) {
		let param = request.query;
		let page = param.page;
		let limit = param.limit;
		let sort = param.sort;
		let paginate = {};
		if (page && limit) {
			paginate = { page: page, limit: limit };
		} else if (page) {
			paginate = { page: page };
		} else if (limit) {
			paginate = { limit: limit };
		}
		if (sort) {
			sort = sort.split(',');
			if (sort) {
				paginate.sort = { [sort[0]]: sort[1] };
			}
		} else {
			paginate.sort = { createdAt: -1 };
		}

		return paginate;
	},

	getSelect: function (model, req) {
		let select = {};
		let from,
			to = null;
		let dateCreateUpdate = ['createdAt', 'updatedAt'];
		let dateFromTo = ['fromDate', 'toDate'];

		for (var propName in req.query) {
			if (req.query.hasOwnProperty(propName)) {
				if (propName != 'limit' && propName != 'page' && propName != 'sort') {
					if (model.schema.paramLike && model.schema.paramLike.includes(propName)) {
						select[propName] = new RegExp(req.query[propName], 'i');
					} else {
						if (dateCreateUpdate.includes(propName)) {
							if (!req.query[propName].$lte) {
								select[propName] = {
									// $gte : new Date(req.query[propName] + ' 00:00:00'),
									// $lte : new Date(req.query[propName] + ' 23:59:59')
									$gte: new Date(req.query[propName] + ' 00:00:00').toUTCString(),
									$lte: new Date(req.query[propName] + ' 23:59:59').toUTCString(),
								};
							} else {
								select[propName] = req.query[propName];
							}
						} else {
							if (dateFromTo.includes(propName)) {
								if (propName == 'fromDate') {
									from = new Date(req.query[propName] + ' 00:00:00').toUTCString();
								}
								if (propName == 'toDate') {
									to = new Date(req.query[propName] + ' 23:59:59').toUTCString();
								}
							} else {
								select[propName] = req.query[propName];
							}
						}
					}
				}
			}
		}

		if (from && to) {
			select['createdAt'] = {
				$gte: from,
				$lte: to,
			};
		}

		return select;
	}
};

module.exports = queryBusiness;
