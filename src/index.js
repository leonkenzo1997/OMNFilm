const path = require('path');
const express = require('express');
const methodOverride = require('method-override');
const morgan = require('morgan');
const cors = require('cors');
const app = express();
app.disable('x-powered-by');
require('dotenv').config();

// how to set up swagger for document api
const swaggerUi = require('swagger-ui-express');
const swaggerDocumentUser = require('./Docs/USER.zip-Swagger20.json');
const swaggerDocumentOffline = require('./Docs/OFFLINE.zip-Swagger20.json');
const swaggerDocumentAdmin = require('./Docs/ADMIN.zip-Swagger20.json');
const swaggerDocumentOnline = require('./Docs/ONLINE.zip-Swagger20.json');
const swaggerDocumentPayment = require('./Docs/PAYMENT.zip-Swagger20.json');
const swaggerDocumentMobile = require('./Docs/MOBILE.zip-Swagger20.json');
const swaggerDocumentDRM = require('./Docs/DRM.zip-Swagger20.json');

const SortMiddleware = require('./app/Middlewares/SortMiddleware');

const route = require('./Routes/index');
const db = require('./Connector/Database/config');

const cronTab = require('./app/CronTab/CronJobs');

//route socket
const routeSocket = require('./Routes/Socket/SocketRoute');

require('./app/Service/globalFunction');

//init override console.log
if (!process.env.DEBUG) {
    require('./app/Service/Logging/Log');
}

//init override Date
require('./app/Service/DateTime/OverrideDate');

// connect to db
db.connect();

//init crontab
const constants = require('./app/Constant/constants');
if (process.env.NODE_ENV === constants.NODE_ENV.PRODUCTION) {
    cronTab.constructor();
}

app.set('views', __dirname + '/views');

// using ejs
app.set('view engine', 'ejs');

// using the static file as image
app.use(express.static(path.join(__dirname, 'public')));

app.use(
    express.urlencoded({
        extended: true,
    })
);

// edit limit data can send request on server
app.use(express.json({ limit: '50mb' }));

// override with different headers; last one takes precedence
app.use(methodOverride('X-HTTP-Method')); //          Microsoft
app.use(methodOverride('X-HTTP-Method-Override')); // Google/GData
app.use(methodOverride('X-Method-Override')); //      IBM

// override with POST having ?_method=DELETE
app.use(methodOverride('_method'));
app.use(cors());

// custom middleware
app.use(SortMiddleware);

// http request logger
app.use(morgan('combined'));

app.use('/api-admin-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocumentAdmin));

app.use('/api-offline-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocumentOffline));

app.use('/api-user-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocumentUser));

app.use('/api-online-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocumentOnline));

app.use('/api-payment-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocumentPayment));

app.use('/api-drm-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocumentDRM));

app.use('/api-mobile-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocumentMobile));

// route init
route(app);

const http = require('http').createServer(app);

// set up socket
const io = require('socket.io')(http, {
    cors: {
        origin: '*',
        methods: ['GET'],
    },
    transports: ['polling'],
});

//socket all chanel
global.sockets = io.sockets;

// connect socket
io.on('connection', (socket) => {
    // console.log('Connection id : ' + socket.client.id);
    global.socket = socket;
    routeSocket(socket, io);
});

http.listen(process.env.PORT, () => {
    console.log('Server listening on port ' + process.env.PORT);
});
