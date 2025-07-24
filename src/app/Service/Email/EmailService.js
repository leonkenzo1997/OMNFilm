'use strict';
const nodemailer = require('nodemailer');
const fs = require('fs');

const email = process.env.USER_EMAIL;
const password = process.env.USER_PASSWORD;

const emailConstant = require('../../Constant/Email/EmailConstant');
const constants = require('../../Constant/constants');
const path = require('path');

const sendEmail = {
	sendEmailForgotPassword: async function (from, to, data, footerMail) {
		let result = {
			status: true,
			msg: '',
		};
		let templateEmail = `
				<h1> 비밀번호 초기화를 위한 OTP 코드: </h1>
				<h1 style = "color:red" > ${data} </h1>
				<h3> OTP코드는 5분동안 유효합니다 !!!</h3>
			`;
		// create reusable transporter object using the default SMTP transport
		let transporter = nodemailer.createTransport({
			host: 'smtp.gmail.com',
			port: 587,
			secure: false,
			requireTLS: true, // true for 465, false for other ports
			auth: {
				user: email,
				pass: password,
			},
		});
		let mailOptions = {
			from: from || email,
			to: to,
			subject: emailConstant.SUBJECT_FORGOT_PASSWORD,
			html: templateEmail,
		};
		await transporter.sendMail(mailOptions, function (error, info) {
			if (error) {
				result.status = false;
				result.msg = error;
			} else {
				result.status = true;
				result.msg = 'Email sent: ' + info.response;
			}
		});
		return result;
	},

	sendEmailResetPinCode: async function (from, to, data, footerMail) {
		let result = {
			status: true,
			msg: '',
		};
		let templateEmail = `
				<h1> CODE OTP FOR RESET PINCODE: </h1>
				<h1 style = "color:red" > ${data} </h1>
				<h3> Code OTP have the value in 5 minutes. After 5 minutes, Code OTP is invalid !!!</h3>
			`;
		// create reusable transporter object using the default SMTP transport
		let transporter = nodemailer.createTransport({
			host: 'smtp.gmail.com',
			port: 587,
			secure: false,
			requireTLS: true, // true for 465, false for other ports
			auth: {
				user: email,
				pass: password,
			},
		});
		let mailOptions = {
			from: from || email,
			to: to,
			subject: emailConstant.SUBJECT_RESET_PINCODE,
			html: templateEmail,
		};
		await transporter.sendMail(mailOptions, function (error, info) {
			if (error) {
				result.status = false;
				result.msg = error;
			} else {
				result.status = true;
				result.msg = 'Email sent: ' + info.response;
			}
		});
		return result;
	},

	sendEmailChangeStatusProgram: async function (from = email, to = '', data = {}) {
		const transporter = nodemailer.createTransport({
			host: 'smtp.gmail.com',
			port: 587,
			secure: false,
			requireTLS: true, // true for 465, false for other ports
			auth: {
				user: email,
				pass: password,
			},
		});

		const filePath = path.join(__dirname, '../../../template/emailProgram.html');
		fs.readFile(filePath, { encoding: 'utf-8' }, async (err, template) => {
			if (err) {
				console.log(err);
				return;
			}

			template = template.replace(
				/STATUS_CHANGE/g,
				(data.programCurrentStatus && data.programCurrentStatus.toUpperCase()) || ''
			);
			template = template.replace(/FILM_NAME/g, data.programTitle || '');
			template = template.replace(/MESSAGE/g, data.message || '');

			const subject = data.subject || 'OMN - Notification';

			const mailOptions = {
				from,
				to,
				subject: subject,
				html: template,
			};
			transporter.sendMail(mailOptions, function (error, info) {
				if (error) {
					console.log(error);
				} else {
					console.log('Email sent to: ', to);
				}
			});
		});
	},

	sendEmailOriginalParticipant: function (to = '') {
		const transporter = nodemailer.createTransport({
			host: 'smtp.gmail.com',
			port: 587,
			secure: false,
			requireTLS: true,
			auth: {
				user: email,
				pass: password,
			},
		});

		const filePath = path.join(__dirname, '../../../template/emailDefault.html');
		fs.readFile(filePath, { encoding: 'utf-8' }, (err, template) => {
			if (err) {
				console.log(err);
				return;
			}

			template = template.replace(/MESSAGE/g, "Congratulations! You've been selected as a participant for an OMN Originals program!");

			const mailOptions = {
				from: email,
				to,
				subject: 'OMN - Notification',
				html: template,
			};
			transporter.sendMail(mailOptions, function (error, info) {
				if (error) {
					console.log(error);
				} else {
					console.log('Email sent to: ', to);
				}
			});
		});
	},

	sendEmailNormal: function (to = '', body = '', title = '', template = '') {
		const transporter = nodemailer.createTransport({
			host: 'smtp.gmail.com',
			port: 587,
			secure: false,
			requireTLS: true,
			auth: {
				user: email,
				pass: password,
			},
		});
		let filePath = path.join(__dirname, '../../../template/emailDefault.html');
		if (template != '') {
			filePath = path.join(__dirname, '../../../template/' + template + '.html');
		}

		fs.readFile(filePath, { encoding: 'utf-8' }, (err, temp) => {
			if (err) {
				console.log(err);
				return;
			}

			// body = body.split('/n').join('</br>');
			temp = temp.replace(/MESSAGE/g, body);

			const mailOptions = {
				from: email,
				to,
				subject: title,
				html: temp,
			};
			transporter.sendMail(mailOptions, function (error, info) {
				if (error) {
					console.log(error);
				} else {
					console.log('Email sent to: ', to);
				}
			});
		});
	},
};

module.exports = sendEmail;
