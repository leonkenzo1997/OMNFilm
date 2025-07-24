const userModel = require('../Models/User/UserModel');
const moment = require('moment-timezone');
const programModel = require('../Models/Program/ProgramModel');
const rsModel = require('../Models/RS/RSModel');
const rsService = require('../Service/RsUser/RsFormula');
const McashSeed = require('../../app/Service/Cipher/McashSeed');

class profitJobs {
	async profitOne() {
		try {
			let mcashSeed = new McashSeed();
			let month = Number(moment().tz('Asia/Seoul').format('MM'));
			let year = Number(moment().tz('Asia/Seoul').format('YYYY'));

			if (month == 1) {
				month = 12;
				year = year - 1;
			} else {
				month--;
			}

			let programs = await programModel.find({
				deleted: false,
				['programView.' + [year] + '.' + [month]]: {
					$ne: null,
				},
			});

			if (!programs || !programs.length) return

			let idUsers = programs.map((item) => {
				return item.userID.toJSON();
			});

			idUsers = idUsers.filter(function (elem, pos) {
				return idUsers.indexOf(elem) == pos;
			});

			let programAll = await programModel.find({
				deleted: false,
				['programView.' + [year] + '.' + [month]]: {
					$ne: null,
				},
			});

			if (!programAll || !programAll.length) return

			// get total time all video for user follow month
			let total_all = {};
			Object.entries(programAll).forEach(([months, pro]) => {
				if (pro.programView[year][month]) {
					let datas = pro.programView[year][month];
					let basic = datas.basic > 0
						? Number(datas.basic)
						: 0;
					let standard = datas.standard > 0
						? Number(datas.standard)
						: 0;
					let premium = datas.premium > 0
						? Number(datas.premium)
						: 0;
					if (!rsService.isEmpty(total_all)) {
						total_all = {
							basic: total_all.basic + basic,
							standard: total_all.standard + standard,
							premium: total_all.premium + premium,
						};
					} else {
						total_all = {
							basic: basic,
							standard: standard,
							premium: premium,
						};
					}
				}
			});

			total_all = {
				basic: Number((total_all.basic / 60).toFixed(0)),
				standard: Number((total_all.standard / 60).toFixed(0)),
				premium: Number((total_all.premium / 60).toFixed(0))
			}

			// let profits_details = [];
			// let profits_details_old = [];

			Object.entries(idUsers).forEach(async ([num, user]) => {
				let programUser = await programModel.find({
					deleted: false,
					userID: user,
					['programView.' + [year] + '.' + [month]]: {
						$ne: null,
					},
				});

				let _user = await userModel.findOne({ _id: user }).lean();

				if (!_user) {
					return;
				}

				let data = {};
				Object.entries(programUser).forEach(([v, item]) => {
					data[item.id] = item.programView[year][month];
				});

				// get total time video for user follow month
				let total_videos = {
					basic: 0,
					standard: 0,
					premium: 0,
					total: 0,
				};

				let final_price = {};
				let final_prices = {};

				Object.entries(data).forEach(([months, viewData]) => {
					let basic = viewData.basic > 0
						? Number((viewData.basic / 60).toFixed(0))
						: 0;
					data[months].basic = basic;
					let standard = viewData.standard > 0
						? Number((viewData.standard / 60).toFixed(0))
						: 0;
					data[months].standard = standard;
					let premium = viewData.premium > 0
						? Number((viewData.premium / 60).toFixed(0))
						: 0;
					data[months].premium = premium;
					let total = basic + standard + premium;

					let view_rate = {
						basic:
							basic == 0
								? 0
								: Number(((basic / total_all.basic) * 100).toFixed(2)),
						standard:
							standard == 0
								? 0
								: Number(((standard / total_all.standard) * 100).toFixed(2)),
						premium:
							premium == 0
								? 0
								: Number(((premium / total_all.premium) * 100).toFixed(2)),
					};
	
					
					if (_user.userType == 3) {
						let rate_tax = {
							rsRate: _user.rsRate,
							tax: _user.taxRate,
						};
						final_price = rsService.formula(true, view_rate, rate_tax);
					} else {
						final_price = rsService.formula(false, view_rate);
					}

					if (!rsService.isEmpty(final_prices)) {
						final_prices.basic += final_price.basic;
						final_prices.standard += final_price.standard;
						final_prices.premium += final_price.premium;
						final_prices.total += final_price.total;
					} else {
						final_prices = final_price;
					}
				});

				final_price = final_prices;

				let rsOld = await rsModel.findOne({
					userID: user,
					deleted: false,
				}).sort({ created_at: -1 });

				let profits_detail = {
					isRS: _user.userType == 3 ? true : false,
					userID: user,
					date: month + '-' + year,
					confirmed: 0,
					payable: 0,
					residual: 0,
					forward: 0,
					able: false,
				};

				if (rsOld) {
					rsOld.payable = Number(
						mcashSeed.decodeString(rsOld.confirmed, process.env.KEYPROFIT).replace(/\0/g, '')
					);
					rsOld.residual = Number(
						mcashSeed.decodeString(rsOld.confirmed, process.env.KEYPROFIT).replace(/\0/g, '')
					);
					rsOld.confirmed = Number(
						mcashSeed.decodeString(rsOld.confirmed, process.env.KEYPROFIT).replace(/\0/g, '')
					);
					rsOld.forward = Number(
						mcashSeed.decodeString(rsOld.forward, process.env.KEYPROFIT).replace(/\0/g, '')
					);
					profits_detail = {
						isRs: _user.userType == 3 ? true : false,
						userID: user,
						date: month + '-' + year,
						confirmed: mcashSeed.encodeString(Number(final_price.total) + Number(rsOld.forward), process.env.KEYPROFIT),
						payable: mcashSeed.encodeString(0, process.env.KEYPROFIT),
						residual: mcashSeed.encodeString(Number(final_price.total) + Number(rsOld.forward), process.env.KEYPROFIT),
						forward: mcashSeed.encodeString(Number(final_price.total) + Number(rsOld.forward), process.env.KEYPROFIT),
						able: false,
					};
				} else {
					profits_detail = {
						isRs: _user.userType == 3 ? true : false,
						userID: user,
						date: month + '-' + year,
						confirmed: mcashSeed.encodeString(Number(final_price.total), process.env.KEYPROFIT),
						payable: mcashSeed.encodeString(0, process.env.KEYPROFIT),
						residual: mcashSeed.encodeString(Number(final_price.total), process.env.KEYPROFIT),
						forward: mcashSeed.encodeString(Number(final_price.total), process.env.KEYPROFIT),
						able: false,
					};
				}
				// profits_details.push(profits_detail);
				// Save profit user new
				await rsModel(profits_detail).save();

				if (Number(num) + 1 == idUsers.length) {
					// Save data profit new
					// await rsModel.insertMany(profits_details);

					let oldMonth = month;
					let oldYear = year;
					if (month == 1) {
						oldMonth = 12;
						oldYear--;
					} else {
						oldMonth--
					}
					let rsMonthBefore = await rsModel.find({
						deleted: false,
						date: oldMonth + '-' + oldYear
					});

					Object.entries(rsMonthBefore).forEach(async ([n, rsChild]) => {
						if (!idUsers.includes(rsChild.userID.toJSON())) {
							let userClone = await userModel.findOne({ _id: rsChild.userID.toJSON() }).lean();
							let recordOld = {
								isRS: userClone.userType == 3 ? true : false,
								userID: rsChild.userID,
								date: month + '-' + year,
								confirmed: rsChild.forward,
								payable: mcashSeed.encodeString(0, process.env.KEYPROFIT),
								residual: rsChild.forward,
								forward: rsChild.forward,
								able: false,
								ofMonth: oldMonth + '-' + oldYear
							}

							// Save profit user old
							await rsModel(recordOld).save();
							// profits_details_old.push(recordOld);
						}
						// if (Number(n) + 1 == rsMonthBefore.length) {
						// 	await rsModel.insertMany(profits_details_old);
						// }
					});
				}
			});
		} catch (error) {
			console.log(error.message);
		}
	}
}

module.exports = new profitJobs();
