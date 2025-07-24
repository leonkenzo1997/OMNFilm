const programModel = require('../Models/Program/ProgramModel');
const historyEditProgramModel = require('../Models/Program/HistoryEditProgramModel');
const mediaConvert = require('../Service/MediaConvert/MediaConvertService');
const _ = require('lodash');

class MediaConvertJob {
    async handle() {
        let media = new mediaConvert();
        try {
            let programConvert = await programModel.find({
                deleted: false,
                flagDRM: false,
                drmConvertError: false,
                ['linkVideoDRM.jobID']: { $ne: null },
            });

            if (!programConvert || !programConvert.length) return

            Object.entries(programConvert).forEach(async ([v, program]) => {
                if (program.linkVideoDRM && program.linkVideoDRM.jobID) {
                    let dataUpdate = {};
                    let data = await media.getStatus(program.linkVideoDRM.jobID, program);
                    let link =
                        'https://' +
                        process.env.OUTPUT_CONVERT +
                        '.s3.' +
                        process.env.REGION_CONVERT +
                        '.amazonaws.com/' +
                        program.linkVideoDRM.folder;

                    if (data.Job.Status == 'COMPLETE') {
                        if (program.programVideoTrailer) {
                            program.linkVideoDRM = {
                                'mpd': link + 'background/' + program.linkVideoDRM.name + '.mpd'
                            }

                            program.flagDRM = true;
                            await program.save();
    
                            dataUpdate = {
                                linkVideoDRM: {
                                    'mpd': link + 'background/' + program.linkVideoDRM.name + '.mpd'
                                },
                                flagDRM: true,
                                programProcess: 100
                            }
                        } else {
                            program.linkVideoDRM = {
                                'mpd': link + program.linkVideoDRM.name + '.mpd',
                                'm3u8': link + program.linkVideoDRM.name + '.m3u8',
                                'moblie_mpd': link + 'mobile/' + program.linkVideoDRM.name + '.mpd',
                                'moblie_m3u8': link + 'mobile/' + program.linkVideoDRM.name + '.m3u8'
                            }

                            program.flagDRM = true;
                            await program.save();
    
                            dataUpdate = {
                                linkVideoDRM: {
                                    'mpd': link + program.linkVideoDRM.name + '.mpd',
                                    'm3u8': link + program.linkVideoDRM.name + '.m3u8',
                                    'moblie_mpd': link + 'mobile/' + program.linkVideoDRM.name + '.mpd',
                                    'moblie_m3u8': link + 'mobile/' + program.linkVideoDRM.name + '.m3u8'
                                },
                                flagDRM: true,
                                programProcess: 100
                            }
                        }
                    } else if (data.Job.Status == 'PROGRESSING') {
                        if (data.Job.JobPercentComplete) {
                            dataUpdate = {
                                programProcess: data.Job.JobPercentComplete
                            }
                        } else {
                            dataUpdate = {
                                programProcess: 0
                            }
                        }
                    } else if (data.Job.Status == 'CANCELED') {
                        program.flagDRM = true;
                        program.drmConvertError = true;
                        await program.save();
                        dataUpdate = {
                            flagDRM: true
                        }
                    } else if (data.Job.Status == 'ERROR') {
                        program.flagDRM = true;
                        program.drmConvertError = true;
                        await program.save();
                        dataUpdate = {
                            flagDRM: true
                        }
                    }

                    if (!_.isEmpty(dataUpdate)) {
                        await historyEditProgramModel.updateOne(
                            { _id: program.historyEditProgramID },
                            {
                                $set: dataUpdate,
                            }
                        );
                    }
                }
            });
        } catch (error) {
            console.log(error.message);
        }
    }
}

module.exports = new MediaConvertJob();
