const system = require('../Constant/General/SystemConstant');
const logger = require('../Constant/Logger/loggerConstant');

function permissionMenu(menuCode = '') {
	return (request, response, next) => {
		let check = false;
		let user = request.user.toObject();
		if (menuCode != '') {
			if (user.userDeparment) {
				user.userDeparment.forEach(element => {
					if (element.departmentCode == menuCode){
						check = true;
					}
				});
			}
		} else {
			check = true;
		}

		if (user.userType == 4) {
			check = true;
		}

		if (!check) {
			return logger.status403(response, system.permission);
		}
		next()
	}
};

module.exports = permissionMenu;
