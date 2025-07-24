const programModel = require('../app/Models/Program/ProgramModel');
const constants = require('../app/Constant/constants')
const AWS = require('aws-sdk');

AWS.config.update({
    accessKeyId: process.env.ACCESSKEY_ID,
    secretAccessKey: process.env.SECRET_ACCESSKEY,
    region: process.env.REGION_CONVERT
});
const s3 = new AWS.S3();

async function script() {
    console.log('START')
    const programs = await programModel.find({})

    await Promise.all(programs.map(async (program, i) => {

        const images = {
            'programChildrenSeasonData.linkVideo': program?.programChildrenSeasonData?.linkVideo,
            programImagePoster: program?.programImagePoster,
            programImagePosterNoTitle: program?.programImagePosterNoTitle,
            programOriginalPoster: program?.programOriginalPoster,
            programImageTitle: program?.programImageTitle,
            programImageBracter: program?.programImageBracter,
            linkVideo: program?.linkVideo,
            videoThumbnail: program?.videoThumbnail,
            programImagex1: program?.programImagex1,
            programImagex2: program?.programImagex2,
            programImageTitleResize1: program?.programImageTitleResize1,
            programImageTitleResize2: program?.programImageTitleResize2,
            programImagePosterResize: program?.programImagePosterResize,
            programOriginalPosterResizeX1: program?.programOriginalPosterResizeX1,
            programOriginalPosterResizeX2: program?.programOriginalPosterResizeX2
        }

        const arrayImage = await Promise.all(Object.values(images).map(async image => {
            if (!image) {
                image = constants.DEFAULT_THUMNAIL
            } else {
                const dataLink = image.split('.s3.ap-northeast-2.amazonaws.com/');
                const Key = dataLink[1];

                const data = dataLink[0].split('https://')

                if (Key && data[1]) {
                    const params = {
                        Bucket: data[1],
                        Key
                    }

                    const checkExist = await s3.headObject(params).promise().then(response => {
                        return
                    }).catch(err => {
                        return err.code
                    });

                    if (checkExist && checkExist === 'NotFound') {
                        image = constants.DEFAULT_THUMNAIL
                    }
                }
            }
            return image
        }))

        const transpose = (r, a) => a.map((v, i) => [...(r[i] || []), v])
        keys = Object.keys(images)
        values = arrayImage
        const result = Object.fromEntries([keys, values].reduce(transpose, []));

        await programModel.updateOne({ _id: program._id }, { $set: result })
        console.log(i)
    }))

    console.log('DONE')
}

script()