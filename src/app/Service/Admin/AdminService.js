const constants = require('../../Constant/constants');

const admin = {
    notiStatusEpisodeOffline: (program = {}, status = '') => {
        try {
            if (sockets)
                sockets.emit(constants.MESSAGES_NOTIFICATION.STATUS_EPISODE_OFFLINE, {
                    status,
                    id: program._id,
                    parentID: program.programChildrenSeasonData.parentID,
                });
        } catch (error) {
            console.log(error);
        }
    },
    // socket for upload program (program_edit model)
    notiStatusEpisodeOfflineEDIT: (program = {}, status = '') => {
        try {
            if (sockets)
                sockets.emit(constants.MESSAGES_NOTIFICATION.STATUS_EPISODE_OFFLINE, {
                    status,
                    id: program.programID,
                    parentID: program.programChildrenSeasonData.parentID,
                });
        } catch (error) {
            console.log(error);
        }
    },
};

module.exports = admin;
