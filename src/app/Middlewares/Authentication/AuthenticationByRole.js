const system = require('../../Constant/General/SystemConstant');
const logger = require('../../Constant/Logger/loggerConstant');

function authenticationByRole(roles = []) {
	if (!Array.isArray(roles)) {
		roles = [roles]
	}
	return (request, response, next) => {
		if (roles.length && !roles.includes(request.user && request.user.userType)) {
			return logger.status403(response, system.permission);
		}
		// authentication and authorization successful
		next()
	}
};

module.exports = authenticationByRole;
