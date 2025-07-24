const challengerRoute = require("./Challenger/ChallengerRoute");
const uploadRoute = require("./Upload/UploadRoute");
const categoryManage = require("./CategoryManage/CategoryManageRoute");
const rsUserRoute = require("./RsUser/RsUserRoute");
const programSampleRoute = require("./ProgramSample/ProgramSampleRoute");
const omnerRouter = require("./OmnEr/OmnErRoute");
const historyEditProgramRoute = require('./HistoryEditProgram/HistoryEditProgramRoute');
const messagesRoute = require("./OmnEr/Messages/MessagesRoute");
const notificationRoute = require("./Notification/NotificationRoute");

module.exports = (app) => {
    // upload router
    app.use("/offline/category-manage", categoryManage);

    // challenger router
    app.use("/offline/challenger", challengerRoute);

    // history edit router
    app.use("/offline/history-edit-program", historyEditProgramRoute);

    // upload router
    app.use("/offline/upload", uploadRoute);

    // RS User router
    app.use("/offline/rs-user", rsUserRoute);

    // Program sample
    app.use("/offline/program-sample", programSampleRoute);

    // OMN'ER
    app.use("/offline/omner", omnerRouter);

    // Messages
    app.use("/offline/omner/messages", messagesRoute);

    // Notification
    app.use("/offline/notification", notificationRoute);
};
