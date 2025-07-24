const programModel = require('../Models/Program/ProgramModel');
const historyEditProgramModel = require('../Models/Program/HistoryEditProgramModel');
const imgResize = require('../Service/Images/ResizeOptimizeImages');

const CONSTANTS = require('../Constant/constants');

class ConvertImageJobs {
    async handle() {
        try {
            let programList = await programModel.find({
                deleted: false,
                programDisplay: true,
            });

            Object.entries(programList).forEach(async ([v, program]) => {
                let urlArray = '';
                if (program.programImagePoster) {
                    // https://omn-image-input.s3.ap-northeast-2.amazonaws.com/Upload/Poster/08_2021/28/1._Poster_with_title_RS_610b9aeec4309700fc9e0cad_1630088569.png

                    if (program.programType == CONSTANTS.PROGRAM_TYPE.PROGRAM_ORIGINAL) {
                        //453x752
                        urlArray = await imgResize.resizeOptimizeUrl(
                            program.programImagePoster,
                            453,
                            752,
                            70
                        );
                    } else {
                        urlArray = await imgResize.resizeOptimizeUrl(
                            program.programImagePoster,
                            448,
                            252,
                            70
                        );
                    }

                    program.programImagex1 = urlArray.url1;
                    program.programImagex2 = urlArray.url2;
                }

                if (program.programImageTitle) {
                    urlArray = await imgResize.resizeOptimizeUrl(
                        program.programImageTitle,
                        688,
                        387,
                        70
                    );

                    program.programImageTitleResize1 = urlArray.url1;
                    program.programImageTitleResize2 = urlArray.url2;
                }

                await program.save();
            });
        } catch (error) {
            console.log(error.message);
        }
    }

    async jobsConvertOriginal(idChildren, idParent) {
        try {
            let programImageTitleResize = '';
            let programImage = '';
            let programImagePosterResize = '';
            let programImagePosterNoTitleResize = '';
            let programOriginalPosterResize = '';

            let programThumbnailParentResize = '';
            let programThumbnailChildrenResize = '';

            let programChildren = null;
            let programParent = null;

            let dataBackupChildren = null;
            let dataBackupParent = null;

            if (idChildren) {
                programChildren = await programModel.findById({
                    deleted: false,
                    _id: idChildren,
                });
            }

            if (idParent) {
                programParent = await programModel.findById({
                    deleted: false,
                    _id: idParent,
                });
            }

            if (programParent) {
                // resize image of original poster (vertical image)
                if (programParent.programOriginalPoster) {
                    programOriginalPosterResize = await imgResize.resizeOptimizeUrl(
                        programParent.programOriginalPoster,
                        453,
                        752,
                        90
                    );

                    programParent.programOriginalPosterResizeX1 =
                        programOriginalPosterResize.url1;
                    programParent.programOriginalPosterResizeX2 =
                        programOriginalPosterResize.url2;
                }

                // resize image of original poster (horizontal figure)

                if (programParent.programImageTitle) {
                    programImageTitleResize = await imgResize.resizeOptimizeUrl(
                        programParent.programImageTitle,
                        688,
                        387,
                        90
                    );

                    programParent.programImageTitleResize1 = programImageTitleResize.url1;
                    programParent.programImageTitleResize2 = programImageTitleResize.url2;
                }

                // resize poster have title
                if (programParent.programImagePoster) {
                    programImage = await imgResize.resizeOptimizeUrl(
                        programParent.programImagePoster,
                        448,
                        252,
                        90
                    );

                    programParent.programImagex1 = programImage.url1;
                    programParent.programImagex2 = programImage.url2;

                    programImagePosterResize = await imgResize.resizeOneUrl(
                        programParent.programImagePoster,
                        1920,
                        1080,
                        90
                    );

                    programParent.programImagePosterResize =
                        programImagePosterResize.url1;
                }

                // resize poster no title
                if (programParent.programImagePosterNoTitle) {
                    programImagePosterNoTitleResize = await imgResize.resizeOneUrl(
                        programParent.programImagePosterNoTitle,
                        1920,
                        1080,
                        90
                    );

                    programParent.programImagePosterNoTitleResize =
                        programImagePosterNoTitleResize.url1;
                }

                if (programParent.programTypeVideo === CONSTANTS.TYPE_VIDEO.SS) {
                    // resize thumbnail for program season
                    programThumbnailParentResize = await imgResize.resizeOptimizeUrl(
                        programParent.programThumbnail.thumbnailImage,
                        448,
                        252,
                        90
                    );

                    programParent.programThumbnailResizeX1 =
                        programThumbnailParentResize.url1;
                    programParent.programThumbnailResizeX2 =
                        programThumbnailParentResize.url2;
                }

                if (programParent.programTypeVideo === CONSTANTS.TYPE_VIDEO.SA) {
                    dataBackupParent = await historyEditProgramModel.findOne({
                        deleted: false,
                        programID: programParent._id,
                    });

                    // resize thumbnail for program stand alone
                    programThumbnailParentResize = await imgResize.resizeOptimizeUrl(
                        programParent.videoThumbnail,
                        448,
                        252,
                        90
                    );

                    programParent.programThumbnailResizeX1 =
                        programThumbnailParentResize.url1;
                    programParent.programThumbnailResizeX2 =
                        programThumbnailParentResize.url2;

                    dataBackupParent.programImageTitleResize1 =
                        programImageTitleResize.url1;

                    dataBackupParent.programImageTitleResize2 =
                        programImageTitleResize.url2;

                    dataBackupParent.programOriginalPosterResizeX1 =
                        programOriginalPosterResize.url1;

                    dataBackupParent.programOriginalPosterResizeX2 =
                        programOriginalPosterResize.url2;

                    dataBackupParent.programImagex1 = programImage.url1;
                    dataBackupParent.programImagex2 = programImage.url2;

                    dataBackupParent.programImagePosterResize =
                        programImagePosterResize.url1;

                    dataBackupParent.programImagePosterNoTitleResize =
                        programImagePosterNoTitleResize.url1;

                    dataBackupParent.programThumbnailResizeX1 =
                        programThumbnailParentResize.url1;
                    dataBackupParent.programThumbnailResizeX2 =
                        programThumbnailParentResize.url2;

                    await dataBackupParent.save();
                }
                await programParent.save();
            }

            if (programChildren) {
                dataBackupChildren = await historyEditProgramModel.findOne({
                    deleted: false,
                    _id: programChildren.historyEditProgramID,
                });

                // must take programThumbnail.thumbnailImage field to convert thumbnail image of episode
                if (programChildren.programThumbnail) {
                    programThumbnailChildrenResize = await imgResize.resizeOptimizeUrl(
                        programChildren.programThumbnail.thumbnailImage,
                        448,
                        252,
                        90
                    );
                } else {
                    // if not have programThumbnail.thumbnailImage field, can take videoThumbnail of parent
                    programThumbnailChildrenResize = await imgResize.resizeOptimizeUrl(
                        programChildren.videoThumbnail,
                        448,
                        252,
                        90
                    );
                }

                programChildren.programThumbnailResizeX1 =
                    programThumbnailChildrenResize.url1;
                programChildren.programThumbnailResizeX2 =
                    programThumbnailChildrenResize.url2;

                // update url for children program (episode)
                programChildren.programImagex1 = programImage.url1;
                programChildren.programImagex2 = programImage.url2;

                programChildren.programOriginalPosterResizeX1 =
                    programOriginalPosterResize.url1;

                programChildren.programOriginalPosterResizeX2 =
                    programOriginalPosterResize.url2;

                programChildren.programImageTitleResize1 = programImageTitleResize.url1;
                programChildren.programImageTitleResize2 = programImageTitleResize.url2;

                programChildren.programImagePosterResize = programImagePosterResize.url1;

                programChildren.programImagePosterNoTitleResize =
                    programImagePosterNoTitleResize.url1;

                // update url for back up data of episode
                dataBackupChildren.programImagex1 = programImage.url1;
                dataBackupChildren.programImagex2 = programImage.url2;

                dataBackupChildren.programImageTitleResize1 =
                    programImageTitleResize.url1;
                dataBackupChildren.programImageTitleResize2 =
                    programImageTitleResize.url2;

                dataBackupChildren.programOriginalPosterResizeX1 =
                    programOriginalPosterResize.url1;

                dataBackupChildren.programOriginalPosterResizeX2 =
                    programOriginalPosterResize.url2;

                dataBackupChildren.programImagePosterResize =
                    programImagePosterNoTitleResize.url1;

                dataBackupChildren.programImagePosterNoTitleResize =
                    programImagePosterNoTitleResize.url1;

                dataBackupChildren.programThumbnailResizeX1 =
                    programThumbnailChildrenResize.url1;
                dataBackupChildren.programThumbnailResizeX2 =
                    programThumbnailChildrenResize.url2;

                await programChildren.save();
                await dataBackupChildren.save();
            }
        } catch (error) {
            console.log(error.message);
        }
    }

    async jobsConvert(idChildren, idParent) {
        try {
            let programImageTitleResize = '';
            let programImage = '';

            let programImagePosterNoTitleResize = '';
            let programImagePosterResize = '';

            let programThumbnailChildrenResize = '';
            let programThumbnailParentResize = '';

            let programChildren = null;
            let programParent = null;

            let dataBackupChildren = null;
            let dataBackupParent = null;

            if (idChildren) {
                programChildren = await programModel.findById({
                    deleted: false,
                    _id: idChildren,
                });
            }

            if (idParent) {
                programParent = await programModel.findById({
                    deleted: false,
                    _id: idParent,
                });
            }

            if (programParent) {
                if (programParent.programImageTitle) {
                    programImageTitleResize = await imgResize.resizeOptimizeUrl(
                        programParent.programImageTitle,
                        688,
                        387,
                        90
                    );

                    programParent.programImageTitleResize1 = programImageTitleResize.url1;
                    programParent.programImageTitleResize2 = programImageTitleResize.url2;
                }
                // resize image of poster

                //453x752
                if (programParent.programImagePoster) {
                    programImage = await imgResize.resizeOptimizeUrl(
                        programParent.programImagePoster,
                        448,
                        252,
                        90
                    );

                    programParent.programImagex1 = programImage.url1;
                    programParent.programImagex2 = programImage.url2;

                    programImagePosterResize = await imgResize.resizeOneUrl(
                        programParent.programImagePoster,
                        1920,
                        1080,
                        90
                    );

                    programParent.programImagePosterResize =
                        programImagePosterResize.url1;
                }

                // resize poster no title
                if (programParent.programImagePosterNoTitle) {
                    programImagePosterNoTitleResize = await imgResize.resizeOneUrl(
                        programParent.programImagePosterNoTitle,
                        1920,
                        1080,
                        90
                    );

                    programParent.programImagePosterNoTitleResize =
                        programImagePosterNoTitleResize.url1;
                }

                if (programParent.programTypeVideo === CONSTANTS.TYPE_VIDEO.SS) {
                    // resize thumbnail for program season
                    programThumbnailParentResize = await imgResize.resizeOptimizeUrl(
                        programParent.programThumbnail.thumbnailImage,
                        448,
                        252,
                        90
                    );

                    programParent.programThumbnailResizeX1 =
                        programThumbnailParentResize.url1;
                    programParent.programThumbnailResizeX2 =
                        programThumbnailParentResize.url2;
                }

                if (programParent.programTypeVideo === CONSTANTS.TYPE_VIDEO.SA) {
                    dataBackupParent = await historyEditProgramModel.findOne({
                        deleted: false,
                        programID: programParent._id,
                    });

                    // resize thumbnail for program stand alone
                    programThumbnailParentResize = await imgResize.resizeOptimizeUrl(
                        programParent.videoThumbnail,
                        448,
                        252,
                        90
                    );

                    programParent.programThumbnailResizeX1 =
                        programThumbnailParentResize.url1;
                    programParent.programThumbnailResizeX2 =
                        programThumbnailParentResize.url2;

                    dataBackupParent.programImageTitleResize1 =
                        programImageTitleResize.url1;

                    dataBackupParent.programImageTitleResize2 =
                        programImageTitleResize.url2;

                    dataBackupParent.programImagex1 = programImage.url1;
                    dataBackupParent.programImagex2 = programImage.url2;

                    dataBackupParent.programImagePosterResize =
                        programImagePosterResize.url1;

                    dataBackupParent.programImagePosterNoTitleResize =
                        programImagePosterNoTitleResize.url1;

                    dataBackupParent.programThumbnailResizeX1 =
                        programThumbnailParentResize.url1;
                    dataBackupParent.programThumbnailResizeX2 =
                        programThumbnailParentResize.url2;

                    await dataBackupParent.save();
                }
                await programParent.save();
            }

            if (programChildren) {
                dataBackupChildren = await historyEditProgramModel.findOne({
                    deleted: false,
                    _id: programChildren.historyEditProgramID,
                });

                // must take programThumbnail.thumbnailImage field to convert thumbnail image of episode
                if (programChildren.programThumbnail) {
                    programThumbnailChildrenResize = await imgResize.resizeOptimizeUrl(
                        programChildren.programThumbnail.thumbnailImage,
                        448,
                        252,
                        90
                    );
                } else {
                    // if not have programThumbnail.thumbnailImage field, can take videoThumbnail of parent
                    programThumbnailChildrenResize = await imgResize.resizeOptimizeUrl(
                        programChildren.videoThumbnail,
                        448,
                        252,
                        90
                    );
                }

                programChildren.programThumbnailResizeX1 =
                    programThumbnailChildrenResize.url1;
                programChildren.programThumbnailResizeX2 =
                    programThumbnailChildrenResize.url2;

                // update url for children program (episode)
                programChildren.programImagex1 = programImage.url1;
                programChildren.programImagex2 = programImage.url2;
                programChildren.programImageTitleResize1 = programImageTitleResize.url1;
                programChildren.programImageTitleResize2 = programImageTitleResize.url2;

                programChildren.programImagePosterResize = programImagePosterResize.url1;
                programChildren.programImagePosterNoTitleResize =
                    programImagePosterNoTitleResize.url1;

                // update url for back up data of episode
                dataBackupChildren.programImagex1 = programImage.url1;
                dataBackupChildren.programImagex2 = programImage.url2;

                dataBackupChildren.programImageTitleResize1 =
                    programImageTitleResize.url1;
                dataBackupChildren.programImageTitleResize2 =
                    programImageTitleResize.url2;

                dataBackupChildren.programImagePosterResize =
                    programImagePosterResize.url1;

                dataBackupChildren.programImagePosterNoTitleResize =
                    programImagePosterNoTitleResize.url1;

                dataBackupChildren.programThumbnailResizeX1 =
                    programThumbnailChildrenResize.url1;
                dataBackupChildren.programThumbnailResizeX2 =
                    programThumbnailChildrenResize.url2;

                await programChildren.save();
                await dataBackupChildren.save();
            }
        } catch (error) {
            console.log(error.message);
        }
    }
}

module.exports = new ConvertImageJobs();
