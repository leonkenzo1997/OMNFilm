const Jimp = require('jimp');
const fs = require('fs');
const JPEG = require('jpeg-js');
const uploadS3 = require('../S3/UploadS3Service');
const moment = require('moment-timezone');
var dirFiles = 'src/files';

if (!fs.existsSync(dirFiles)) {
	fs.mkdirSync(dirFiles);
}

class ResizeOptimizeImages {
	
	constructor() {     
		Jimp.decoders['image/jpeg'] = (data) => JPEG.decode(data, { maxMemoryUsageInMB: 1024 });
	}

	async resizeOptimize(images, width, height = Jimp.AUTO, quality) {
		const image = await Jimp.read(images.path);
		let imageResize = image;
		let url = {
			imgRoot: '',
			imgResize: '',
		}

		if (image) {
			let extension = 
				process.env.CONFIG_CONVERT == undefined || process.env.CONFIG_CONVERT == ''
				? image.getExtension()
				: process.env.CONFIG_CONVERT;
			//only convert not change size
			await image.resize(image.bitmap.width, image.bitmap.height);

			if(extension == 'png') {
				await image.quality(70);
			} else {
				await image.quality(quality);
			}

			let name = images.name + '.' + extension;
			await image.writeAsync(dirFiles + '/' + name);
			// upload s3 and delete file
		    url.imgRoot = await uploadS3.uploadFile(dirFiles + '/' + name, extension);
			
			//convert and change size 16:9
			// width = image.bitmap.width;
			// height = (image.bitmap.width / 16) * 9;

			await imageResize.resize(width, height);
			if(extension == 'png') {
				await imageResize.quality(70);
			} else {
				await imageResize.quality(quality);
			}

			let nameResize = images.name + width + 'x' + height + '.' + extension;
			await imageResize.writeAsync(dirFiles + '/' + nameResize);
			
			// upload s3 and delete file
		    url.imgResize = await uploadS3.uploadFile(dirFiles + '/' + nameResize, extension, width + 'x' + height);
			return url;
		}
	}

	async resizeOptimizeUrl(url, width = 0, height = Jimp.AUTO, quality = 90) {
		url = decodeURI(url);
		const image = await Jimp.read(url);
		const imagex2 = image;
		if (image) {
			let extension = 
				process.env.CONFIG_CONVERT == undefined || process.env.CONFIG_CONVERT == ''
				? image.getExtension()
				: process.env.CONFIG_CONVERT;

			if (extension == 'jpeg') 
				extension = 'jpg';
			let linkCut = url.split(process.env.LINK_OUTPUT_IMG)[1];
			let getName = linkCut.split('/');
			let namex2 = '';
			let name = ''
			let folder = '';
			getName.forEach((element, i) => {
				if (i == (getName.length - 1))
					name = element;
				else
					folder += element + '/';
			});

			name = name.split('.' + extension)[0];
			namex2 = name;
			
			if (width == 0 ) {
				name += moment().unix() + '.' + extension;
				await image.resize(image.bitmap.width, image.bitmap.height);
			} else {
				name += moment().unix() + '.' + width + 'x' + height + '.' + extension;
				await image.resize(width, height);
			}

			await image.quality(quality);
			await image.writeAsync(dirFiles + '/' + name);

			// upload s3 and delete file
			let urlImage = await uploadS3.uploadFileUrl(dirFiles + '/' + name, folder, name);

			if (width == 0 ) {
				namex2 += moment().unix() + '.' + extension;
				await imagex2.resize(image.bitmap.width, image.bitmap.height);
			} else {
				namex2 += moment().unix() + '.' + width * 2 + 'x' + height * 2 + '.' + extension;
				await imagex2.resize(width * 2, height * 2);
			}

			await imagex2.quality(quality);
			await imagex2.writeAsync(dirFiles + '/' + namex2);

			// upload s3 and delete file
			let urlImagex2 = await uploadS3.uploadFileUrl(dirFiles + '/' + namex2, folder, namex2);
		    
			return {
				url1 : urlImage,
				url2 : urlImagex2
			};
		}
	}

	async resizeOneUrl(url, width = 0, height = Jimp.AUTO, quality = 90) {
		url = decodeURI(url);
		const image = await Jimp.read(url);
		if (image) {
			let extension = 
				process.env.CONFIG_CONVERT == undefined || process.env.CONFIG_CONVERT == ''
				? image.getExtension()
				: process.env.CONFIG_CONVERT;

			if (extension == 'jpeg') 
				extension = 'jpg';
			let linkCut = url.split(process.env.LINK_OUTPUT_IMG)[1];
			let getName = linkCut.split('/');
			let name = ''
			let folder = '';
			getName.forEach((element, i) => {
				if (i == (getName.length - 1))
					name = element;
				else
					folder += element + '/';
			});

			name = name.split('.' + extension)[0];
			
			if (width == 0 ) {
				name += moment().unix() + '.' + extension;
				await image.resize(image.bitmap.width, image.bitmap.height);
			} else {
				name += moment().unix() + '.' + width + 'x' + height + '.' + extension;
				await image.resize(width, height);
			}

			await image.quality(quality);
			await image.writeAsync(dirFiles + '/' + name);

			// upload s3 and delete file
			let urlImage = await uploadS3.uploadFileUrl(dirFiles + '/' + name, folder, name);
		    
			return {
				url1 : urlImage
			};
		}
	}
}

 module.exports = new ResizeOptimizeImages();
