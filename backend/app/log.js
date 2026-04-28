var winston = require("winston");
var fs = require('fs');
var config = require(global.appRoot + '/config/config');
var logPath = config.logs.logFilePath + '/log.log';
var errorPath = config.logs.logFilePath + '/error.log';
// var axios = require('axios');

var infologger = winston.createLogger({
    level: 'info',
    transports: [
        new (winston.transports.Console)({ timestamp: true }),
        new (winston.transports.File)({ filename: logPath })
    ]
});

var errorlogger = winston.createLogger({
    level: 'error',
    transports: [
        new (winston.transports.Console)({ timestamp: true }),
        new (winston.transports.File)({ filename: errorPath })
    ]
});

var init = function () {
    try {
        require('fs').mkdirSync(config.logs.logFilePath);
    } catch (e) {
        if (e.code != 'EEXIST') {
            console.error("Could not set up log directory, error was: ", e);
            process.exit(1);
        }
    }
}

var infoLog = function (message) {
    try {
        infologger.log('info', new Date() + " " + message);
    } catch (e) {
        console.error(message);
    }
}

var errorLog = function (err) {
    try {
        errorlogger.log('error', new Date() + " " + err);
        var request = {
            errorMessage : JSON.stringify(err),
            createdAt: new Date(),
            host: config.errorLogNotification.host
        };
        // axios({
        //     method: "post",
        //     url: config.serviceBaseURL.url + 'api/addErrorMessage',
        //     data: request,
        //     headers: {
        //       "Content-Type": "application/json"
        //     }
        // })
        // .then(function (response) {
        //     //handle success
        //     // console.log("done",response);
        // })
        // .catch(function (err) {
        //     // console.log(err);
        // });
    } catch (err) {
        // console.log(err);
    }
}

process.setMaxListeners(0);

process
    .on('uncaughtException', function (err) {
        var errMessage = "['uncaughtException' event] " + err.stack || err.message;
        errorLog(errMessage);
    })
    .on('unhandledRejection', (reason, p) => {
        console.log(reason);
        console.log(p);
        var errMessage = reason + 'Unhandled Rejection at Promise' + p;
        errorLog(errMessage);
    });


init();

module.exports = {
    info: infoLog,
    error: errorLog
};