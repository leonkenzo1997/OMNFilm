const sharp = require('sharp');
const areaCodeModel = require('../../Models/User/AreaCodeModel');
const fetch = require('node-fetch');
const jobConvert = require('../../Jobs/ConvertImageJobs');

class ConvertImage {
    async convert(request, response, next) {
        try {
            const img = await areaCodeModel.find({});
            await Object.entries(img).forEach(async ([v, val]) => {
                let url = val.flag;
                const rep = await fetch(url);

                const buffer = await rep.buffer();
                const data = await sharp(buffer)
                    .resize(100, 70)
                    .toBuffer()
                    .then((data) => {
                        return data;
                    })
                    .catch((err) => {});
                val.flagBase64 = data.toString('base64');
                await val.save();
            });
            return response.status(200).json({
                msg: 'Success!',
            });
        } catch (error) {
            return response.status(400).json({
                msg: error.message,
            });
        }
    }

    async jobsConvert(request, response, next) {
        const formData = request.body;
        const idParent = formData.idParent;
        const idChildren = formData.idChildren;

        try {
            // jobConvert.jobsConvert(idChildren, idParent);
            jobConvert.jobsConvertOriginal(idChildren, idParent);

            return response.status(200).json({
                msg: 'Success!',
            });
        } catch (error) {
            return response.status(400).json({
                msg: error.message,
            });
        }
    }
}

module.exports = new ConvertImage();
