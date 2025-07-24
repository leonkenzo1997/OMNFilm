const adminRouter = require("./Admin/IndexAdminRoute");
const offlineRouter = require("./Offline/IndexOfflineRoute");
const onlineRouter = require("./Online/IndexOnlineRoute");
const userRouter = require("./User/IndexUserRoute");

function route(app) {
    // admin router
    adminRouter(app);

    // offline router
    offlineRouter(app);

    // online router
    onlineRouter(app);

    //user router
    userRouter(app);

    app.use("/", (request, response) => {
        response.send("welcome to OMN");
    });
}

module.exports = route;
