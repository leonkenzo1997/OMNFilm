const formidable = require('formidable');
const convertImage = require('../../../Service/Images/ResizeOptimizeImages');

class UploadImagesController {

	// [POST] /offline/upload/create
	async uploadImages(request, response, next) {
        const form = new formidable.IncomingForm();
        form.parse(request, async function(err, fields, files) {
            if (err) {
              return response.status(400).json({ error: err.message });
            }
            //await convertImage.convertNew(files.images, 320, 180, 90);

            await convertImage.resizeOptimize(files.images, 1240, 2204, 90);
            
            const [firstFileName] = Object.keys(files);
        
            response.json({ filename: firstFileName });
        });
	}
}

module.exports = new UploadImagesController();
