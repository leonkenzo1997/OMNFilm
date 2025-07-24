const rsModel = require('../../../Models/RS/RSModel');
const system = require('../../../Constant/General/SystemConstant');
const businessQuery = require('../../../Business/QueryModel');
const logger = require('../../../Constant/Logger/loggerConstant');
const McashSeed = require('../../../../app/Service/Cipher/McashSeed');
const xl = require("excel4node");
const common = require('../../../Service/common')
const UserPaymentModel = require('../../../Models/Payment/UserPaymentModel')

const constants = require('../../../Constant/constants')

class ProfitPaymentController {
    // [GET] /admin/proramEdit/
    async index(request, response, next) {
        const errors = [];
        let mcashSeed = new McashSeed();
        try {
            const relation = [
                {
                    path: 'userID',
                    select: 'userEmail bankingInfor userType',
                    populate: {
                        path: 'koreanBank'
                    }
                }
            ];
            
            request.query.request = true;
            let data = await businessQuery.handle(rsModel, request, relation);
            let dataClone = [];


            await Promise.all(data.docs.map(async rs => {
                rs = rs.toJSON();
                let state = 'request';
                if (rs.request){
                    if (rs.hasConfirm) {
                        if (rs.able) {
                            state = 'approved';
                        } else {
                            state = 'cancelled';
                        }
                    }
                }
                rs.confirmed = Number(mcashSeed.decodeString(rs.confirmed, process.env.KEYPROFIT).replace(/\0/g, ''));
                rs.payable = Number(mcashSeed.decodeString(rs.payable, process.env.KEYPROFIT).replace(/\0/g, ''));
                rs.residual = Number(mcashSeed.decodeString(rs.residual, process.env.KEYPROFIT).replace(/\0/g, ''));
                rs.forward = Number(mcashSeed.decodeString(rs.forward, process.env.KEYPROFIT).replace(/\0/g, ''));
                rs.status = state;
                dataClone.push(rs);
            }))
            data.docs = dataClone;
            return request.exportExcel ? data : logger.status200(response, system.success, '', data);
        } catch (error) {
            errors.push(error.message);
            return logger.status500(response, error, errors);
        }
    }

    // [GET] /admin/profit-payment/export?createdAt=2021-01-19
    async exportExcel(request, response, next) {
		const result = request.data;
        // File name
        const title = request.query.createdAt
        const fileName = title + ".xlsx";

        const wb = new xl.Workbook();
        const ws = wb.addWorksheet("Sheet 1");

        const boldCenterStyle = wb.createStyle({
            font: {
                bold: true,
                color: "#000000",
            },
            alignment: {
                horizontal: "center",
            },
        });

        const border = {
            border: {
                left: {
                    style: "thin",
                    color: "#000000",
                },
                right: {
                    style: "thin",
                    color: "#000000",
                },
                top: {
                    style: "thin",
                    color: "#000000",
                },
                bottom: {
                    style: "thin",
                    color: "#000000",
                },
                outline: false,
            },
        };
        const stringFormat = {
            alignment: {
                horizontal: "center",
            },
        };
        const numberFormat = {
            numberFormat: "#,##0; -#,##0; 0",
		};
        const bgStyle = {
            fill: {
                type: "pattern",
                patternType: "solid",
                bgColor: "ffffff",
                fgColor: "ffffff",
            },
            font: {
                color: "#000000",
            },
        };

        const styleString = wb.createStyle(Object.assign(stringFormat, bgStyle, border));
        const styleNumber = wb.createStyle(Object.assign(numberFormat, bgStyle, border));
		
        const headers = [
            "STT",
            "Bank code",
            "User role",
            "Bank account number",
            "Price that user requested",
            "User name"
        ];

        const TOTAL_COLUMNS = headers.length;
        ws.cell(1, 1, 1, TOTAL_COLUMNS, true)
            .string(title)
            .style(boldCenterStyle);
        ws.cell(2, 1, 2, TOTAL_COLUMNS, true)
            .string(
                common.timestampToString(Date.now()) +
                " - " +
                common.getStringHourMinuteFromTimestamp(Date.now())
            )
            .style({
                alignment: {
                    horizontal: "right",
                },
                font: {
                    color: "#000000",
                },
            });
        for (let i = 1; i <= TOTAL_COLUMNS; i++) {
            switch (i) {
                case 1:
                    ws.column(i).setWidth(5);
                    break;
                default:
                    ws.column(i).setWidth(35);
                    break;
            }
        }

        headers.forEach((header, i) => {
            ws.cell(3, i + 1)
                .string(header)
                .style(boldCenterStyle);
        });

        let rowCount = 4;
        let index = 0;
        result.forEach((item, i) => {
            i = 0;
            const bank = item.userID && item.userID.bankingInfor && item.userID.bankingInfor.koreanBank
            const bankingInfor = item.userID && item.userID.bankingInfor
            const userType = item.userID && item.userID.userType

            let role = Object.entries(constants.USER_TYPE).find(item => item[1] === userType)
            role = role ? role[0] : ''

            ws.cell(rowCount, ++i)
                .number(++index)
                .style(styleNumber);
            ws.cell(rowCount, ++i)
                .string(bank && bank.code || "")
                .style(styleString);
            ws.cell(rowCount, ++i)
                .string(role || "")
                .style(styleString);
            ws.cell(rowCount, ++i)
                .string(bankingInfor && bankingInfor.accountNumber || "")
                .style(styleString);
            ws.cell(rowCount, ++i)
                .number(Number(item.payable) || 0)
                .style(styleNumber);
            ws.cell(rowCount++, ++i)
                .string(item.userID && item.userID.userEmail || "")
                .style(styleString);
        });

        response.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        response.setHeader("Content-Disposition", "attachment; filename=" + fileName);
        wb.write(fileName, response);
    }

    // [GET] /admin/profit-payment/id
    async detail(request, response, next) {
		const paramsData = request.params;
		const errors = [];
        let mcashSeed = new McashSeed();
		try {
            let data = await rsModel.findOne({
                _id: paramsData.id
            })					
            .populate({
                path: 'userID',
                select: 'userEmail bankingInfor userType',
                populate: {
                    path: 'koreanBank'
                }
            }).lean();

            data.confirmed = Number(mcashSeed.decodeString(data.confirmed, process.env.KEYPROFIT).replace(/\0/g, ''));
            data.payable = Number(mcashSeed.decodeString(data.payable, process.env.KEYPROFIT).replace(/\0/g, ''));
            data.residual = Number(mcashSeed.decodeString(data.residual, process.env.KEYPROFIT).replace(/\0/g, ''));
            data.forward = Number(mcashSeed.decodeString(data.forward, process.env.KEYPROFIT).replace(/\0/g, ''));

            let state = 'request';
            if (data.request){
                if (data.hasConfirm) {
                    if (data.able) {
                        state = 'approved';
                    } else {
                        state = 'cancelled';
                    }
                }
            }

            data.status = state;

			return logger.status200(response, system.success, '', data);
		} catch (error) {
			errors.push(error.message);
			return logger.status400(response, error, errors, system.error);
		}
    }
}

module.exports = new ProfitPaymentController();
