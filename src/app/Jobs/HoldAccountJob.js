const userModel = require('../Models/User/UserModel');
const moment = require('moment-timezone');
const paymentModel = require('../Models/Payment/PaymentModel');

class HoldAccountJob {
	async handle() {
		try {
            //remove account when user hold 7 day
            let day = moment().tz('Asia/Seoul').add(-7, 'days').format('yyyyMMDD');
            let timeday = moment().tz('Asia/Seoul').format('HHmmss');
            let payment = await paymentModel.find({
				deleted: true,
                accountBeDel: false,
				cancelDate: {
				    $lte: day
				}
			});

            if (!payment || !payment.length) return

			Object.entries(payment).forEach(async ([v, item]) => {
                if (item.cancelDate == day) {
                    if (item.cancelTime <= timeday) {
                        let userDel = await userModel.findOne({ _id: item.idUser });
                        if (userDel && userDel.deactivate) {
                            await userDel.updateOne({
                                deleted: true,
                                deletedAt: new Date(moment()),
                                destructionDay: new Date(moment().add(5, 'years'))}
                            );
                        }
                    }
                } else {
                    let userDel = await userModel.findOne({ _id: item.idUser });
                    if (userDel && userDel?.deactivate) {
                    await userDel.updateOne({
                            deleted: true,
                            deletedAt: new Date(moment()),
                            destructionDay: new Date(moment().add(5, 'years'))}
                        );
                    }
                }
                item.accountBeDel = true;
                await item.save();
            });
		} catch (error) {
			console.log(error.message);
		}
	}
}

module.exports = new HoldAccountJob();
