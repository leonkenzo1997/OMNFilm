const xl = require("excel4node");
const moment = require("moment-timezone");

const common = {
    generateSlug: function (str) {
        if (!str) return '';
        str = str.toLowerCase();
        str = str.replace(/ /g, '-');
        str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, 'a');
        str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, 'e');
        str = str.replace(/ì|í|ị|ỉ|ĩ/g, 'i');
        str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, 'o');
        str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, 'u');
        str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, 'y');
        str = str.replace(/đ/g, 'd');
        str = str.replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, '');
        str = str.replace(/^-*|-*$|(-)-*/g, '$1');
        str = str + '-' + Date.now().toString().slice(-4);
        return str;
    },

    timestampToString: function (timestamp) {
        var date = new Date(timestamp);
        var str =
            ('0' + date.getDate()).slice(-2) + '/' + ('0' + (date.getMonth() + 1)).slice(-2) + '/' + date.getFullYear();
        return str;
    },

    getStringHourMinuteFromTimestamp: function (timestamp) {
        var date = new Date(timestamp);
        var hour = date.getHours() < 10 ? '0' + date.getHours() : date.getHours();
        var minute = date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes();
        var str = hour + ':' + minute;
        return str;
    },

    checkPendingProgram: function () {
        // const moment = require('moment-timezone')
        // const now = moment.tz("Asia/Seoul").format("YYYY-MM-DD HH:mm:ss")
        // const date = moment.tz("Asia/Seoul").format("YYYY-MM-DD") + ` ${process.env.TIME_PENDING_PROGRAM}`
        // return now > date
        return true
    },

    exportExcel: function (data, headers, paramField, name = '', response, width = 20, titleExcel = null) {
        const result = data;
        // File name
        let titleName = name.split(' ').join('-').toLowerCase();
        const title = titleName + '-' + moment().format('yyyy-MM-DD');
        const fileName = title + ".xlsx";
        const wb = new xl.Workbook();
        const ws = wb.addWorksheet("Sheet 1");

        if (paramField.includes('id')) {
            headers.shift();
        }

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

        const TOTAL_COLUMNS = headers.length;
        ws.cell(1, 1, 1, TOTAL_COLUMNS, true)
            .string(titleExcel || name)
            .style(boldCenterStyle)
            .style(styleString)
            .style({
                font: {
                    size: 20
                }
            });
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
            })
            .style(border);
        for (let i = 1; i <= TOTAL_COLUMNS; i++) {
            switch (i) {
                case 1:
                    ws.column(i).setWidth(5);
                    break;
                default:
                    ws.column(i).setWidth(width);
                    break;
            }
        }

        headers.forEach((header, i) => {
            ws.cell(3, i + 1)
                .string(header)
                .style(boldCenterStyle)
                .style(styleString)
                .style({
                    fill: {
                        bgColor: '#dfdedb',
                        fgColor: '#dfdedb'
                    }
                });
        });

        let rowCount = 4;
        let index = 0;
        result.forEach((item, i) => {
            i = 0;
            if (paramField.includes('id')) {

            } else {
                ws.cell(rowCount, ++i)
                    .number(++index)
                    .style(styleNumber);
            }
            paramField.forEach((row) => {
                if (typeof item[row] !== 'undefined') {
                    if (typeof item[row] === 'Number' || typeof item[row] === 'number') {
                        ws.cell(rowCount, ++i)
                            .number(Number(item[row]) || 0)
                            .style(styleNumber);
                    } else if (typeof item[row] === 'object' || typeof item[row] === 'Object') {
                        if (item[row] instanceof Date) {
                            ws.cell(rowCount, ++i)
                                .string(moment(item[row]).format('yyyy-MM-DD'))
                                .style(styleString);
                        } else {
                            if (item[row] === null) {
                                ws.cell(rowCount, ++i)
                                    .string('')
                                    .style(styleString);
                            } else {
                                ws.cell(rowCount, ++i)
                                    .string(item[row])
                                    .style(styleString);
                            }
                        }
                    } else if (typeof item[row] === 'boolean' || typeof item[row] === 'Boolean') {
                        ws.cell(rowCount, ++i)
                            .bool(item[row])
                            .style(styleString);
                    } else {
                        ws.cell(rowCount, ++i)
                            .string(item[row])
                            .style(styleString);
                    }
                } else {
                    ws.cell(rowCount, ++i)
                        .string('')
                        .style(styleString);
                }
            });
            rowCount++;
        });

        response.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        response.setHeader("Content-Disposition", "attachment; filename=" + fileName);
        wb.write(fileName, response);
    }
};

module.exports = common;
