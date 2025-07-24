'use strict';

var jwt = require('jwt-simple');
var request = require('request');

var GET_TOKEN = 'https://accounts.google.com/o/oauth2/token';
var SCOPE = 'https://www.googleapis.com/auth/androidpublisher';

module.exports = {
	token: getToken,
	formatCard: formatNumberCard,
};

function getToken(cb) {
	var now = Math.floor(Date.now() / 1000);
	var token = jwt.encode(
		{
			iss: process.env.CLIENT_EMAIL_GOOGLE,
			scope: SCOPE,
			aud: GET_TOKEN,
			exp: now + 3600,
			iat: now,
		},
		process.env.PRIVATE_KEY_GOOGLE.replace(new RegExp('\\\\n', 'g'), '\n'),
		'RS256'
	);
	var params = {
		method: 'POST',
		url: GET_TOKEN,
		body: 'grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=' + token,
		headers: {
			'content-type': 'application/x-www-form-urlencoded',
		},
		json: true,
	};
	request(params, function (error, res, body) {
		if (error) {
			return cb(error);
		}
		if (res.statusCode > 399) {
			return cb(new Error('Failed to get token: ' + body));
		}
		cb(null, body.access_token);
	});
}

function formatNumberCard(str) {
	let length = str.length;
	let result = '';
	for (var i = 0; i < length; i++) {
		if (i > 5 && i < 15) {
			result += '*';
		} else {
			result += str[i];
		}
	}
	return result;
}
