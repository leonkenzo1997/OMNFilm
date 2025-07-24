const express = require('express');
const router = express.Router();
const moment = require('moment-timezone');
const McashSeed = require('../../../app/Service/Cipher/McashSeed');
const substr = require("locutus/php/strings/substr");
const signatureUtil = require('../../../app/Service/Payment/SignatureUtil');
const userModel = require('../../../app/Models/User/UserModel');
const mongoose = require('mongoose');
const checkAuthorization = require('../../../app/Middlewares/Authentication/Authentication');
var buffer = require('buffer/').Buffer;
const iconv = require('iconv-lite');
const ageVerify = require('../../../app/Controllers/Online/Age/AgeVerifyController');
var ejs = require('ejs');
var fs = require('fs');
var dir = 'src/views';

router.get('/form', checkAuthorization, (request, response) => {
    let buff = new buffer(request.user.id);
    let userId = buff.toString('base64');
    let tradeid = moment().format('yyyyMMDD') + moment().unix();
    let data = {
        CASH_GB: "CI",
        PAY_MODE: "10", //define pay mode if it is test or real( 00 :test, 10 : real transactions   )
        Siteurl: "www.brickmate.kr", //merchant URL 가맹점도메인
        Tradeid: tradeid, //merchant Transaction ID
        CI_SVCID: process.env.CI_SVCID, //service ID
        CI_Mode: "61", // 61: send SMS, 67:do not send SMS
        Okurl: 'https' + '://' + process.env.API_BE + "/user/age/age-verified?key=" + userId, //success URL : Payment Completion Notification Page
        // Okurl: "https://www.mrpizza.co.kr/include/auth/kg_ok_web", //success URL : Payment Completion Notification Page
        Notiurl: "ci_notiurl.php", //success URL : Payment Completion Notification Page
        Cryptyn: "Y", //using encryption or not (default : Y)
        Keygb: "1", //encryption Key (1 or 2 : Use after registering as an affiliated store manager)
        Callback: "", //SMS,LMS Outgoing number
        Smstext: "", //SMS body text
        Lmstitle: "", //LMS title
        Lmstext: "", //LMS body text
        SUB_CPID: "", //SUB agency identify code
        DI_CODE: "", //DI website code (12byte)
        CI_FIXCOMMID: "", //fixed when using ISP(mobile telecom)
        Closeurl: "", //redirect URL after click cancel
        MSTR: "", //Merchant callback variable
        LOGO_YN: "N", //using merchant LOGO or not  (When using the affiliate store logo, set to 'Y', and the affiliate store logo image must be present in Mobilians in advance.)
        CALL_TYPE: "SELF"
    }

    let link = 'https://auth.mobilians.co.kr/goCashMain.mcash?';
    link += 'CASH_GB=' + data.CASH_GB + '&CI_SVCID=' + data.CI_SVCID + '&PAY_MODE=' + data.PAY_MODE;
    link += '&Okurl=' + data.Okurl + '&Cryptyn=' + data.Cryptyn + '&Keygb=' + data.Keygb;
    link += '&Siteurl=' + data.Siteurl + '&Tradeid=' + data.Tradeid + '&CI_Mode=' + data.CI_Mode;

    // let template = fs.readFileSync(dir +'/age.ejs', 'utf8').toString();
    // let html = ejs.render(template, { data: data }).replace(/\r\n\t|\r|\t|\n/g, '');
    response.status(200).json({
        status: true,
        data: link
    });
});

router.post('/age-verified', async (req, res) => {

    let data = req.body;
    let id = buffer.from(req.param('key'), 'base64').toString('ascii');
    let session = await mongoose.startSession();
    session.startTransaction();
    try {
        // let data = {
        //     Ci: 'c395bb5eb8c8f429f3b99fbf47574c41f25657a6cc4066822c7e4a0a90140c3a540bcd6bc02642b2c09eff4b4cdc23c6e89463a9d5a2ebb8efc19985987e3621a3669527eb0fde5cb517dce4a654406179c4c8a2102d538b2819a3535fe37659',
        //     CI_Mode: '61',
        //     Commid: 'fff4b5de36cb4394d9165a47164e80a1',
        //     CryptCi: '',
        //     CryptDi: '',
        //     Cryptyn: 'Y',
        //     Di: '1670c0a7bb39064d8bc70ba4363abfcb0aab584e946962ccb38bd15d3fe5c7633fbfb58a7987a4d4932de3193d73592da79a2112e266da0899224adbb72bc84c',
        //     DI_Code: '',
        //     Foreigner: '4793549044e44a11e6486dd5e00dbcbc',
        //     Keygb: '1',
        //     Mac: 'c9e534a9118536f6fb34ad32fa9880bb693a61dd6ab24973f9b143461f507649',
        //     Mobilid: '202101062802885',
        //     Mrchid: '20123009',
        //     MSTR: '',
        //     Name: 'bc087a3d153dcc8361b73958d8fc73d4',
        //     Name2: '%C3%D6%BC%F8%BF%EB',
        //     No: '09a5d934c9149ac334029f430f2bfc5e',
        //     Okurl: 'http://localhost:3000/user/age/ok',
        //     onlyBirth: '',
        //     Resultcd: '0000',
        //     Resultmsg: '%C1%A4%BB%F3%C3%B3%B8%AE%B5%C7%BE%FA%BD%C0%B4%CF%B4%D9.',
        //     Safeguard: '',
        //     Sex: '74212b5bc3926263b054983ff96491c1',
        //     Signdate: '20210106152027',
        //     Socialno: '027bd84cd4000aaf258040c6146fe50b',
        //     SUB_CPID: '',
        //     Svcid: '201230096108',
        //     Tradeid: '202101061609913884',
        // }

        if (data.Resultcd == '0000') {
            let mcashSeed = new McashSeed();
            data.No = mcashSeed.cipher(data.No, process.env.USERKEY).replace(/\0/g, '');
            data.Sex = mcashSeed.cipher(data.Sex, process.env.USERKEY).replace(/\0/g, '');
            data.Socialno = mcashSeed.cipher(data.Socialno, process.env.USERKEY).replace(/\0/g, '');
            data.Name = mcashSeed.cipher(data.Name, process.env.USERKEY);
            data.Foreigner = mcashSeed.cipher(data.Foreigner, process.env.USERKEY).replace(/\0/g, '');
            data.Commid = mcashSeed.cipher(data.Commid, process.env.USERKEY).replace(/\0/g, '');
            data.Ci = mcashSeed.cipher(data.Ci, process.env.USERKEY).replace(/\0/g, '');
            data.Di = mcashSeed.cipher(data.Di, process.env.USERKEY).replace(/\0/g, '');

            let $key = data.Signdate + data.Di + data.Ci + data.Mobilid + substr(data.Svcid, 0, 8) + substr(data.Svcid, 0, 8);
            data.sha = signatureUtil.makeHash($key, 'sha256');
            let $result = "정상 데이터";

            if (data.Mac != data.sha) {
                $result = "데이터가 위·변조되었습니다.";
            }

            data.Name = iconv.decode(Buffer.from(data.Name, "binary"), 'euc-kr').replace(/\0/g, '');

            let dataSave = {
                userGender: data.Sex == 'M' ? 'male' : 'female',
                nameSocial: data.Name,
                signDateSocial: data.Signdate,
                commidSocial: data.Commid,
                noSocial: data.No,
                socialNo: data.Socialno,
                foreigner: data.Foreigner,
                confirmAge: true
            }

            //save info confirm user
            // let userId = '5fe595ee7b73602724015c5c';
            let user = await userModel.findOne({ _id: id });
            await user.updateOne(dataSave).session(session);
            await session.commitTransaction();
            session.endSession();
            res.render('close', { data: [] });
            // res.render('okUrl', { data: data });
        }

    } catch (error) {
        session.endSession();
        res.render('close', { data: [] });
    }
});

router.get('/check', checkAuthorization, ageVerify.check);

module.exports = router;
