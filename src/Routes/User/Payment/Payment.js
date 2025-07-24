const express = require('express');
const router = express.Router();
const url = require('url');
const userModel = require('../../../app/Models/User/UserModel');
const paymentModel = require('../../../app/Models/Payment/PaymentModel');
const IniStdPayBill = require('../../../app/Service/Payment/INIStdPayBill');
const checkAuthorization = require('../../../app/Middlewares/Authentication/Authentication');
const paymentController = require('../../../app/Controllers/Online/Payment/PaymentController');
const moment = require('moment-timezone');
var buffer = require('buffer/').Buffer;
const axios = require('axios');
const qs = require('querystring');

let options = {
  mid: process.env.MID,
  signKey: process.env.SIGNKEY
}

const iniStdPayBill = new IniStdPayBill({
  mid: options.mid,
  signKey: options.signKey
});

const onRequest = options.onRequest; // 결제 요청 callback
const onSuccess = options.onSuccess; // 결제가 성공 callback
const onError = options.onError; // 결제가 실패 callback
const onCancel = options.onCancel; // 결제를 취소했을때 callback

router.get('/', (req, res) => {

  const protocol = req.protocol; // 'http' or 'https'
  const host = req.get('host'); // 'localhost:80'
  const pathname = req.originalUrl; // '/purchase'
  const key = buffer.from(req.param('key'), 'base64').toString('ascii');
  let data = key.split('&');
  let param = {};
  data.map((v) => {
    let temp = v.split('=');
    Object.assign(param, {
      [temp[0]]: temp[1]
    });
  });

  const requestUrl = url.format({
    protocol,
    host,
    pathname
  });

  try {
    const paymentParam = iniStdPayBill.getPaymentParams(requestUrl, param);
    if (onRequest) onRequest(paymentParam);
    paymentParam.url = protocol + '://' + host;
    res.render('payment', {
      data: paymentParam
    });
  } catch (e) {
    res.render('close', {
      data: []
    });
    // res.status(403).json({ error: { message: e.message } });
  }
});

router.post('/return', async (req, res, next) => {
  if (req.body.resultCode === '0000') {
    iniStdPayBill.getAuthRequest(req.body)
      .then(async (result) => {
        if (result.resultCode == '0000' && result.isSuccess) {
          req.payment = result; // req.payment 에 결제 정보 데이터 저장
          let user = await userModel.findOne({
            userEmail: result.buyerEmail
          });
          result.idUser = user._id;
          let existPayment = await paymentModel.find({
            idUser: user._id,
            resultCode: '0000'
          });
          if (existPayment.length > 0) {
            Object.entries(existPayment).forEach(async ([v, va]) => {
              await va.updateOne({
                deleted: true
              });
            });
          }

          result.expired_day = moment().add(30, 'days');
          let payment = await new paymentModel(result).save();

          await user.updateOne({
            memberShipStartDay: payment.createdAt,
            memberShipEndDay: payment.expired_day
          })

          if (onSuccess) return onSuccess(req, res, next); // 결제 성공 콜백이 설정되어있다면 호출
          res.render('close', {
            data: payment
          });
        } else {
          if (result.resultCode && !result.isSuccess) {
            req.payment = result; // req.payment 에 결제 정보 데이터 저장
            let user = await userModel.findOne({
              userEmail: result.buyerEmail
            });
            result.idUser = user._id;
            let payment = await new paymentModel(result).save();
            if (onSuccess) return onSuccess(req, res, next); // 결제 성공 콜백이 설정되어있다면 호출
            res.render('close', {
              data: payment
            });
          } else {
            res.status(200).json('Error payment');
          }
        }
      })
      .catch(err => {
        req.payment = err; // req.payment 에 결제 정보 데이터 저장
        if (onError) return onError(req, res, next); // 결제 실패 콜백이 설정되어있다면 호출

        res.status(403).json(err)
      });
  } else {
    req.payment = req.body; // req.payment 에 결제 정보 데이터 저장
    if (onError) return onError(req, res, next); // 결제 실패 콜백이 설정되어있다면 호출
    res.render('close', {
      data: req.body
    });
  }
});

router.get('/close', (req, res) => {
  // res.send('<script language="javascript" type="text/javascript" src="https://stdpay.inicis.com/stdjs/INIStdPay_close.js" charset="UTF-8"></script>');
  res.render('closePayment');
  if (onCancel) onCancel(req.query.oid); // 결제를 실패했을때 호출
});

router.post('/popup', (req, res) => {
  res.send('<script language="javascript" type="text/javascript" src="https://stdpay.inicis.com/stdjs/INIStdPay_popup.js" charset="UTF-8"></script>');
});

router.get('/check-payment', checkAuthorization, paymentController.checkPayment);

router.get('/get-info', checkAuthorization, paymentController.getInfo);

router.post('/verify-payment', paymentController.verify);

router.post('/formpay', checkAuthorization, paymentController.formpay);

router.post('/billing', checkAuthorization, paymentController.billing);

router.get('/bill-approval', checkAuthorization, paymentController.billingApproval);

router.get('/cancel-bill', checkAuthorization, paymentController.billingCancel);

router.get('/info-card-user', checkAuthorization, paymentController.infoCardUser);

router.post('/add-card-user', checkAuthorization, paymentController.addCardUser);

router.get('/history-card', checkAuthorization, paymentController.historyCard);

// Get korean banks
router.get('/korean-banks', checkAuthorization, paymentController.getKoreanBanks);

// Renew payment
router.post('/renew', checkAuthorization, paymentController.renewPay);

// Refund payment
router.get('/refund', checkAuthorization, paymentController.refundPay);

module.exports = router;
