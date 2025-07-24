const system = require('../../../Constant/General/SystemConstant');
const logger = require('../../../Constant/Logger/loggerConstant');
const mediaConvert = require('../../../Service/MediaConvert/MediaConvertService');
const moment = require('moment-timezone');
const programModel = require('../../../Models/Program/ProgramModel');

class MediaConvertController {
    // [GET] /user/media-convert/
    async index(request, response, next) {
        const errors = [];
        let dataPost = request.body;
        try {
            let program = await programModel.findOne({
                _id: dataPost.id
            });

            if (program && !program.flagDRM && !program.linkVideoDRM) {
                let name = 'omn-' + moment().format('yyyyMMDD') + '_' + moment().unix();
                let videoUrl = 's3://omn-video-input/' + dataPost.Key;
                let month_year = moment().format('MM_YYYY');
                let day = Number(moment().format('DD'));
                let params = {
                    folder: 's3://' + process.env.OUTPUT_CONVERT + '/' + month_year + '/' + day + '/',
                    // folder: 's3://' + process.env.OUTPUT_CONVERT + '/' + process.env.FOLDER_CONVERT + '/',
                    name: name,
                    videoUrl: videoUrl
                    // videoUrl: 's3://omn-video-input/Challenger/11_12_2020/1080p_OMN universe 3rd.mp4'
                }

                let media = new mediaConvert(params);
                let data = await media.createJob();
                data = {
                    jobID: data,
                    folder: month_year + '/' + day + '/',
                    name: name
                }
                if (program) {
                    await program.updateOne({
                        linkVideoDRM: data,
                        flagDRM: false
                    });
                    return dataPost.notReturn || logger.status200(response, system.success, 'Create media convert success!');
                } else {
                    return dataPost.notReturn || logger.status201(response, system.error, "Not save program " + data);
                }
            } else {
                return dataPost.notReturn || logger.status201(response, system.error, "Video is convert");
            }
        } catch (error) {
            errors.push(error.message);
            return dataPost.notReturn || logger.status500(response, error, errors);
        }
    }

    async getVideo(request, response, next) {
        let params = request.params;
        const errors = [];
        try {
            if (params.id) {
                let program = await programModel.findOne({
                    _id: params.id
                });
                if (program) {
                    if (!program.flagDRM) {
                        if (program.linkVideoDRM && program.linkVideoDRM.jobID) {
                            let media = new mediaConvert();
                            let data = await media.getStatus(program.linkVideoDRM.jobID);
                            let link = 'https://' + process.env.OUTPUT_CONVERT +
                                '.s3.' + process.env.REGION_CONVERT + '.amazonaws.com/' +
                                program.linkVideoDRM.folder;

                            if (data.Job.Status == 'COMPLETE') {
                                if (program.programVideoTrailer) {
                                    program.linkVideoDRM = {
                                        'mpd': link + 'background/' + program.linkVideoDRM.name + '.mpd'
                                    }
                                } else {
                                    program.linkVideoDRM = {
                                        'mpd': link + program.linkVideoDRM.name + '.mpd',
                                        'm3u8': link + program.linkVideoDRM.name + '.m3u8',
                                        'moblie_mpd': link + 'mobile/' + program.linkVideoDRM.name + '.mpd',
                                        'moblie_m3u8': link + 'mobile/' + program.linkVideoDRM.name + '.m3u8'
                                    }
                                }
 
                                program.flagDRM = true;
                                program.programProcess = 100;
                                await program.save();
                                return response.status(200).json({
                                    status: true,
                                    data: program
                                });
                            } else if (data.Job.Status == 'PROGRESSING') {
                                if (data.Job.JobPercentComplete) {
                                    return response.status(200).json({
                                        status: true,
                                        msg: "Video convert in progressing " + data.Job.JobPercentComplete + "%!",
                                        percent: data.Job.JobPercentComplete
                                    });
                                } else {
                                    return response.status(200).json({
                                        status: true,
                                        msg: "Video convert in progressing 0%!",
                                        percent: 0
                                    });
                                }
                            } else if (data.Job.Status == 'CANCELED') {
                                return response.status(200).json({
                                    status: true,
                                    msg: "Video convert canceled!"
                                });
                            } else {
                                return response.status(200).json({
                                    status: true,
                                    msg: "Get status error!"
                                });
                            }
                        } else {
                            return response.status(200).json({
                                status: true,
                                msg: "Unconverted video! Link video is null",
                                convert: false
                            });
                        }
                    } else {
                        return response.status(200).json({
                            status: true,
                            data: program
                        });
                    }
                } else {
                    return response.status(201).json({
                        status: true,
                        msg: 'Video not exist!'
                    });
                }
            }
        } catch (error) {
            errors.push(error.message);
            return logger.status500(response, error, errors);
        }

    }

    async deleteFile(request, response, next) {
        let programID = request.params.id;

        if (programID) {
            let program = await programModel.findOne({
                _id: programID
            });

            if (program) {
                //delete file s3 folder input
                let dataLink = program.linkVideo.split(process.env.LINK_INPUT + '/');
                let Key = dataLink[1];
                let media = new mediaConvert();
                await media.deleteFileS3(Key);

                //delete file s3 folder output
                if (program.linkVideoDRM.mpd) {
                    let dataLinkDRM = program.linkVideoDRM.mpd.split(process.env.LINK_OUTPUT + '/');
                    let path = dataLinkDRM[1].split('/');
                    let length = path.length;
                    let name = '';
                    let folder = '';
                    for (var i = 0; i < length; i++) {
                        if (i == length - 1) {
                            name = path[i].replace('.mpd', '');
                        } else {
                            if (i + 1 == length - 1) {
                                folder += path[i];
                            } else {
                                folder += path[i] + '/';
                            }
                        }
                    }
    
                    await media.deleteFileConvert(name, folder);
                }
            }
            return response.status(200).json({
                status: true,
                msg: "Delete video success"
            });
        } else {
            return response.status(201).json({
                status: false,
                msg: "Video not exist"
            });
        }
    }

    // [GET] /user/media-convert/background
    async backgroundVideo(request, response, next) {
        const errors = [];
        let id = request.params.id;
        try {
            if (id) {
                let program = await programModel.findOne({
                    _id: id
                });
    
                if (program) {
    
                    let linkCut = program.programVideoTrailer.split(process.env.LINK_INPUT_VIDEO)[1];
                    let name = 'omn-' + moment().format('yyyyMMDD') + '_' + moment().unix();
                    let videoUrl = 's3://omn-video-input/' + linkCut;
                    let month_year = moment().format('MM_YYYY');
                    let day = Number(moment().format('DD'));
                    let params = {
                        folder: 's3://' + process.env.OUTPUT_CONVERT + '/' + month_year + '/',
                        // folder: 's3://' + process.env.OUTPUT_CONVERT + '/' + process.env.FOLDER_CONVERT + '/',
                        name: name,
                        videoUrl: videoUrl
                        // videoUrl: 's3://omn-video-input/Challenger/11_12_2020/1080p_OMN universe 3rd.mp4'
                    }
    
                    let media = new mediaConvert(params);
                    let data = await media.createBackground();
                    data = {
                        jobID: data,
                        folder: month_year + '/',
                        name: name
                    }
                    if (program) {
                        await program.updateOne({
                            linkVideoDRM: data,
                            drmConvertError: false,
                            flagDRM: false
                        });
                        return id.notReturn || logger.status200(response, system.success, 'Create media convert success!');
                    } else {
                        return id.notReturn || logger.status201(response, system.error, "Not save program " + data);
                    }
                } else {
                    return id.notReturn || logger.status201(response, system.error, "Video is convert");
                }
            } else {
                return response.status(400).json({
                    status: false,
                    msg: 'ID is null'
                });
            }
        } catch (error) {
            errors.push(error.message);
            return dataPost.notReturn || logger.status500(response, error, errors);
        }
    }
}

module.exports = new MediaConvertController();
