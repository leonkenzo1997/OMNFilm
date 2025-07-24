const sortMiddleware = async (request, response, next) => {
    response.locals._sort = {
        enabled: false,
        type: 'default',
    };

    const sort = response.locals._sort;
    const query = request.query;

    if (query.hasOwnProperty('_sort')) {
        Object.assign(sort, {
            enabled: true,
            type: query.type,
            column: query.column,
        });
    }

    next();
};

module.exports = sortMiddleware;
