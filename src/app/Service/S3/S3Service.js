const constants = require('../../Constant/constants');
const mediaConvert = require('../MediaConvert/MediaConvertService');

const s3Service = {
    deleteFileVideoS3: async function (fieldContainLinkVideo = '') {
        try {
            //delete file s3 folder input
            let dataLink = fieldContainLinkVideo.split(process.env.LINK_INPUT + '/');

            let Key = dataLink[1];
            let media = new mediaConvert();
            await media.deleteFileS3(Key);
        } catch (error) {
            console.log(error);
        }
    },

    deleteFileImageS3: async function (images = []) {
        try {
            if (typeof images === 'string') images = [images]

            await Promise.all(images.map(async image => {
                // NOT delete image default
                if (image === constants.DEFAULT_THUMNAIL) return

                //delete file s3 folder input
                let dataLink = image.split(process.env.LINK_INPUT_IMG + '/');
    
                let Key = dataLink[1];
                let media = new mediaConvert();
                await media.deleteFileImageS3(Key);
            }))
        } catch (error) {
            console.log(error);
        }
    },
};

module.exports = s3Service;
