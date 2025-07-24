const signatureUtil = require('./SignatureUtil');

const co = require('co');
const rp = require('request-promise');
const url = require('url');
const moment = require('moment-timezone');
const qs = require('querystring');

class INIStdPayBill {
	constructor(options) {
		if (!('mid' in options)) throw Error('mid 정보가 없습니다');
		if (!('signKey' in options)) throw Error('signKey 정보가 없습니다');

		// 결제에 꼭 필요로 하는 기본 옵션 정보
		this.baseOptions = Object.assign(
			{},
			{
				popupUrl: '',
				returnUrl: '',
				closeUrl: '',
				requestByJs: true,
				version: '1.0',
				currency: 'WON',
				acceptmethod: 'CARDPOINT:HPP(2):va_receipt:below1000:SKIN():KWPY_TYPE(0):KWPY_VAT(0):',
				payViewType: 'overlay',
				nointerest: '',
				quotabase: '',
				merchantData: '',
				escw_yn: '',
				ini_logoimage_url: '',
				gopaymethod: '',
			},
			options
		);

		this.paramFormPay = {
			type: 'Pay',
			paymethod: 'Card',
			timestamp: '',
			clientIp: '127.0.0.1',
			mid: '',
			url: process.env.URL,
			moid: '',
			goodName: '',
			price: '',
			currency: 'WON',
			buyerName: '',
			buyerEmail: '',
			buyerTel: '',
			quotaInterest: '',
			cardQuota: '00',
			cardNumber: '',
			cardExpire: '',
			regNo: '',
			cardPw: '',
			authentification: '00',
			cardPoint: '',
			language: '',
			hashData: '',
		};

		this.paramBilling = {
			type: 'Auth',
			paymethod: 'Card',
			timestamp: '',
			clientIp: '127.0.0.1',
			mid: '',
			url: process.env.URL,
			moid: '',
			goodName: '',
			buyerName: '',
			buyerEmail: '',
			buyerTel: '',
			price: '',
			cardNumber: '',
			cardExpire: '',
			regNo: '',
			cardPw: '',
			hashData: '',
		};
	}

	/**
	 * 결제시 필요로 하는 파라미터 값들을 반환한다
	 *
	 * @param requestUrl 결제 요청 주소 URL
	 * @param options 결제 옵션 정보
	 * @returns {*}
	 */
	getPaymentParams(requestUrl, options) {
		if (options.price == null) throw new Error('price 데이터가 없습니다');

		const paymentParam = Object.assign({}, this.baseOptions);

		const timestamp = new Date().getTime();
		const orderNumber = `${process.env.MID}_${timestamp}`;
		const price = options.price;

		const mKey = signatureUtil.makeHash(process.env.SIGNKEY, 'sha256');

		const sign = signatureUtil.makeSignature({
			oid: orderNumber,
			price: price,
			timestamp: timestamp,
		});

		// 결제 URL 을 requestUrl 기반으로 만들어 낸다
		if (requestUrl.charAt(requestUrl.length - 1) === '/') {
			requestUrl = requestUrl.substr(0, requestUrl.length - 2);
		}

		const requestUrlObj = url.parse(requestUrl);
		// const {pathname} = requestUrlObj;
		const pathname = '/user/payment';

		paymentParam.popupUrl = url.format(Object.assign({}, requestUrlObj, { pathname: `${pathname}/popup` }));
		paymentParam.returnUrl = url.format(Object.assign({}, requestUrlObj, { pathname: `${pathname}/return` }));
		paymentParam.closeUrl = url.format(
			Object.assign({}, requestUrlObj, { pathname: `${pathname}/close`, query: { oid: orderNumber } })
		);

		// 결제 파라미터 assign
		Object.assign(paymentParam, options, {
			oid: orderNumber,
			signature: sign,
			timestamp,
			price,
			mKey,
		});

		// signKey 항목은 데이터에서 지운다
		delete paymentParam.signKey;

		return paymentParam;
	}

	getAuthRequest(body) {
		return co(function* () {
			const { mid, authToken, authUrl, netCancelUrl } = body;

			const timestamp = new Date().getTime();
			const charset = 'UTF-8'; // 리턴형식[UTF-8,EUC-KR](가맹점 수정후 고정)
			const format = 'JSON'; // 리턴형식[XML,JSON,NVP](가맹점 수정후 고정)

			// signature 데이터 생성 (알파벳 순으로 정렬후 NVP 방식으로 나열해 hash)
			const signature = signatureUtil.makeSignature({ authToken, timestamp });

			// API 요청 전문 생성
			const authMap = { mid, authToken, timestamp, signature, charset, format };

			// 이니시스에 결제 인증 요청
			const response = yield rp({ method: 'POST', uri: authUrl, form: authMap, json: true });
			const secureMap = { mid, tstamp: timestamp, MOID: response.MOID, TotPrice: response.TotPrice };

			// signature 데이터 생성
			const secureSignature = signatureUtil.makeSignatureAuth(secureMap);

			// 결제 인증 데이터 체크
			// if (response.resultCode === '0000' && secureSignature == response.authSignature) {
			if (response.resultCode === '0000') {
				response.isSuccess = true;
				return response; // 결제 성공
			} else {
				response.isSuccess = false;

				//결제보안키가 다른 경우. 망취소
				if (secureSignature != response.authSignature && response.resultCode === '0000') {
					return yield rp({ method: 'POST', uri: netCancelUrl, form: authMap, json: true }); // 망취소 결과리턴
				} else {
					return response; // 결제 실패정보 반환
				}
			}
		});
	}

	getPaymentFormPay(options, user) {
		if (user.price == null) throw new Error('price 데이터가 없습니다');
		// if (options.price == null) throw new Error('price 데이터가 없습니다');

		const paymentParam = Object.assign({}, this.paramFormPay);

		if (options.card) {
			paymentParam.cardExpire = signatureUtil.encrypt(process.env.INIAPIKEY, process.env.IV, options.cardExpire);
			paymentParam.regNo = signatureUtil.encrypt(process.env.INIAPIKEY, process.env.IV, options.regNo);
			paymentParam.cardPw = signatureUtil.encrypt(process.env.INIAPIKEY, process.env.IV, options.cardPw);
			paymentParam.cardNumber = signatureUtil.encrypt(process.env.INIAPIKEY, process.env.IV, options.cardNumber);
		} else {
			paymentParam.cardExpire = options.cardExpire;
			paymentParam.regNo = options.regNo;
			paymentParam.cardPw = options.cardPw;
			paymentParam.cardNumber = options.cardNumber;
		}
		paymentParam.authentification = '00';
		paymentParam.language = 'eng';
		paymentParam.timestamp = moment().format('YYYYMMDDhhmmss');
		paymentParam.mid = process.env.MID;
		paymentParam.moid = paymentParam.timestamp;
		// paymentParam.price = options.price;
		paymentParam.price = user.price;
		paymentParam.goodName = user.goodName;
		paymentParam.currency = user.currency;
		paymentParam.buyerName = user.buyerName;
		paymentParam.buyerEmail = user.buyerEmail;
		paymentParam.buyerTel = options.buyerTel ?? '';
		paymentParam.quotaInterest = options.quotaInterest ?? '';
		paymentParam.cardQuota = options.cardQuota;
		paymentParam.cardPoint = options.cardPoint;
		paymentParam.hashData =
			process.env.INIAPIKEY +
			paymentParam.type +
			paymentParam.paymethod +
			paymentParam.timestamp +
			paymentParam.clientIp +
			paymentParam.mid +
			paymentParam.moid +
			paymentParam.price +
			paymentParam.cardNumber;
		paymentParam.hashData = signatureUtil.makeHash(paymentParam.hashData, 'sha512');

		return paymentParam;
	}

	getPaymentBilling(options, user) {
		if (options.price == null) throw new Error('price 데이터가 없습니다');

		const paymentParam = Object.assign({}, this.paramBilling);

		paymentParam.timestamp = moment().format('YYYYMMDDhhmmss');
		paymentParam.mid = process.env.MID;
		paymentParam.moid = paymentParam.timestamp;
		paymentParam.price = options.price;
		paymentParam.goodName = options.goodName;
		paymentParam.buyerName = options.buyerName;
		paymentParam.buyerEmail = options.buyerEmail;
		paymentParam.buyerTel = options.buyerTel;
		paymentParam.cardExpire = options.cardExpire;
		paymentParam.regNo = options.regNo;
		paymentParam.cardPw = options.cardPw;
		paymentParam.cardNumber = options.cardNumber;
		paymentParam.hashData =
			process.env.INIAPIKEY +
			paymentParam.type +
			paymentParam.paymethod +
			paymentParam.timestamp +
			paymentParam.clientIp +
			paymentParam.mid +
			paymentParam.moid +
			paymentParam.price +
			paymentParam.cardNumber;
		paymentParam.hashData = signatureUtil.makeHash(paymentParam.hashData, 'sha512');

		return paymentParam;
	}

	getPaymentBillApproval(options) {
		let paymentParam = Object.assign({}, this.paramBilling);
		paymentParam.timestamp = moment().format('YYYYMMDDhhmmss');
		paymentParam.mid = process.env.MID;
		paymentParam.moid = paymentParam.timestamp;
		paymentParam.price = options.price;
		paymentParam.goodName = options.goodName;
		paymentParam.buyerName = options.buyerName;
		paymentParam.buyerEmail = options.buyerEmail;
		paymentParam.buyerTel = options.buyerTel;
		paymentParam.type = 'Billing';
		paymentParam.billKey = options.billKey;
		paymentParam.paymethod = options.paymethod;
		paymentParam.regNo = options.regNo;
		paymentParam.cardPw = options.cardPw;
		paymentParam.hashData =
			process.env.INIAPIKEY +
			paymentParam.type +
			paymentParam.paymethod +
			paymentParam.timestamp +
			paymentParam.clientIp +
			paymentParam.mid +
			paymentParam.moid +
			paymentParam.price +
			paymentParam.billKey;
		paymentParam.hashData = signatureUtil.makeHash(paymentParam.hashData, 'sha512');

		return paymentParam;
	}

	getPaymentBillCancel(options) {
		if (options.tid == null) throw new Error('tid 데이터가 없습니다');

		let paymentParam = {};
		paymentParam.type = 'Refund';
		paymentParam.paymethod = options.paymethod;
		paymentParam.timestamp = moment().format('YYYYMMDDhhmmss');
		paymentParam.mid = process.env.MID;
		paymentParam.clientIp = '13.209.212.38';
		paymentParam.tid = options.tid;
		paymentParam.msg = options.msg;

		paymentParam.hashData =
			process.env.INIAPIKEY +
			paymentParam.type +
			paymentParam.paymethod +
			paymentParam.timestamp +
			paymentParam.clientIp +
			paymentParam.mid +
			paymentParam.tid;
		paymentParam.hashData = signatureUtil.makeHash(paymentParam.hashData, 'sha512');

		return paymentParam;
	}

	getPaymentCard(options) {
		let paymentParam = {};
		paymentParam.cardExpire = signatureUtil.encrypt(process.env.INIAPIKEY, process.env.IV, options.cardExpire);
		paymentParam.regNo = signatureUtil.encrypt(process.env.INIAPIKEY, process.env.IV, options.regNo);
		paymentParam.cardPw = signatureUtil.encrypt(process.env.INIAPIKEY, process.env.IV, options.cardPw);
		paymentParam.cardNumber = signatureUtil.encrypt(process.env.INIAPIKEY, process.env.IV, options.cardNumber);
		paymentParam.cardQuota = options.cardQuota;
		paymentParam.buyerTel = options.buyerTel;
		return paymentParam;
	}

	getPaymentRenew(options) {
		if (options.price == null) throw new Error('price 데이터가 없습니다');
		// if (options.price == null) throw new Error('price 데이터가 없습니다');

		const paymentParam = Object.assign({}, this.paramFormPay);

		if (options.use && options.use == true) {
			paymentParam.cardExpire = signatureUtil.encrypt(process.env.INIAPIKEY, process.env.IV, options.cardExpire);
			paymentParam.regNo = signatureUtil.encrypt(process.env.INIAPIKEY, process.env.IV, options.regNo);
			paymentParam.cardPw = signatureUtil.encrypt(process.env.INIAPIKEY, process.env.IV, options.cardPw);
			paymentParam.cardNumber = signatureUtil.encrypt(process.env.INIAPIKEY, process.env.IV, options.cardNumber);
		} else {
			paymentParam.cardExpire = options.cardExpire;
			paymentParam.regNo = options.regNo;
			paymentParam.cardPw = options.cardPw;
			paymentParam.cardNumber = options.cardNumber;
		}
		paymentParam.authentification = '00';
		paymentParam.language = 'eng';
		paymentParam.timestamp = moment().format('YYYYMMDDhhmmss');
		paymentParam.mid = process.env.MID;
		paymentParam.moid = paymentParam.timestamp;
		// paymentParam.price = options.price;
		paymentParam.price = options.price;
		paymentParam.goodName = options.goodName;
		paymentParam.currency = options.currency;
		paymentParam.buyerName = options.buyerName;
		paymentParam.buyerEmail = options.buyerEmail;
		paymentParam.buyerTel = options.buyerTel ?? '';
		paymentParam.quotaInterest = options.quotaInterest ?? '';
		paymentParam.cardQuota = options.cardQuota;
		paymentParam.cardPoint = options.cardPoint;
		paymentParam.hashData =
			process.env.INIAPIKEY +
			paymentParam.type +
			paymentParam.paymethod +
			paymentParam.timestamp +
			paymentParam.clientIp +
			paymentParam.mid +
			paymentParam.moid +
			paymentParam.price +
			paymentParam.cardNumber;
		paymentParam.hashData = signatureUtil.makeHash(paymentParam.hashData, 'sha512');

		return paymentParam;
	}
}

module.exports = INIStdPayBill;
