const AWS = require('aws-sdk');
const fs = require('fs');
const moment = require('moment-timezone');

class UploadS3Service {
    constructor() {
        // this.s3 = new AWS.S3({
        //     accessKeyId: process.env.AWS_ACCESS_KEY,
        //     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
        // });
    }

    async uploadFile(fileName, extensionFile, wh = '') {
        let name = 'omn-image-' + moment().unix() + '.' + extensionFile;
        if (wh != '') {
            name =
                'omn-image-' + moment().unix() + '.' + w + 'x' + h + '.' + extensionFile;
        }

        let month_year = moment().format('MM_YYYY');
        let day = Number(moment().format('DD'));

        let fileContent = fs.readFileSync(fileName);
        const params = {
            Bucket: 'omn-image-input',
            Key: month_year + '/' + day + '/' + name,
            Body: fileContent,
            ACL: 'public-read',
        };

        let s3 = new AWS.S3({
            accessKeyId: process.env.ACCESSKEY_ID,
            secretAccessKey: process.env.SECRET_ACCESS_KEY,
        });

        s3.upload(params, function (s3Err, data) {
            if (s3Err) throw s3Err;
            //check file exist
            fs.access(fileName, fs.F_OK, (err) => {
                if (err) {
                    console.error(err);
                    return;
                }

                //delete file
                fs.unlinkSync(fileName);
            });
        });

        return process.env.LINK_OUTPUT_IMG + month_year + '/' + day + '/' + name;
    }

    async uploadFileUrl(fileName, folder, name) {
        // let name = 'omn-image-' + moment().unix() + '.' + extensionFile;
        // if (wh != '') {
        //     name = 'omn-image-' + moment().unix() + '.' + w + 'x' + h + '.' + extensionFile;
        // }

        // let month_year = moment().format('MM_YYYY');
        // let day = Number(moment().format('DD'));
        name = decodeURI(name);

        let fileContent = fs.readFileSync(fileName);
        const params = {
            Bucket: 'omn-image-input',
            Key: folder + name,
            Body: fileContent,
            ACL: 'public-read',
        };

        let s3 = new AWS.S3({
            accessKeyId: process.env.ACCESSKEY_ID,
            secretAccessKey: process.env.SECRET_ACCESSKEY,
            region: process.env.REGION_CONVERT,
        });

        s3.upload(params, function (s3Err, data) {
            if (s3Err) throw s3Err;
            //check file exist
            fs.access(fileName, fs.F_OK, (err) => {
                if (err) {
                    console.error(err);
                    return;
                }

                //delete file
                fs.unlinkSync(fileName);
            });
        });
        return process.env.LINK_OUTPUT_IMG + folder + name;
    }
}

module.exports = new UploadS3Service();
