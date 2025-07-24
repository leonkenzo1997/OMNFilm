const userModel = require('../Models/User/UserModel');
const moment = require('moment-timezone');
const paymentModel = require('../Models/Payment/PaymentModel');

class RemoveForeverAccountJob {
	async handle() {
		try {
            //remove account forever after 5 year
            let timeday = new Date().toUTCString();
            let userRemove = await userModel.find({
				deleted: true,
                deactivate: true,
				destructionDay: {
				    $lte: timeday
				}
			});

			if (!userRemove || !userRemove.length) return

			Object.entries(userRemove).forEach(async ([v, item]) => {
                await item.remove();
            });
		} catch (error) {
			console.log(error.message);
		}
	}
}

module.exports = new RemoveForeverAccountJob();
