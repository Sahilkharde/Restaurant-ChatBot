const _ = require('lodash');
const nodemailer = require('nodemailer');
const config = require('../../config/config');
const fs = require('fs');
const logger = require(global.appRoot + '/app/log');

//Main transporter function for mail triggering
const transportMail = async (templatePath, mailDetails) => {
    try {
        let baseTemplate = fs.readFileSync(templatePath, 'utf8');
        let templateFn = _.template(baseTemplate);
        let templateHTML = templateFn({ mailDetails: mailDetails });
        let transporter = await nodemailer.createTransport(config.mailer);
        // Setup email
        let mailOptions = {
            from: config.mailer.from,
            to: mailDetails.to,
            subject: mailDetails.subject,
            html: templateHTML,
            attachments: mailDetails.attachments || '',
        };
        let info = await transporter.sendMail(mailOptions);
        logger.info('Message %s sent: %s', info.messageId + info.response);
        return Promise.resolve(info);
    } catch (error) {
        logger.error('Message has not been sent:', error);
        return Promise.reject(error);
    }
};

const sendMail = async (req) => {
    let templatePath = global.appRoot + "/app/mailer/templates/mailer.template";
    let mailDetails = req.body;
    //Transport your mails
    transportMail(templatePath, mailDetails)
        .then((info) => {
            return Promise.resolve(info);
        })
        .catch((err) => {
            return Promise.reject(err);
        });

};

const sendStartChatMail = async (req) => {
    let templatePath = global.appRoot + "/app/mailer/templates/startChatMail.template";
    let mailDetails = req;
    //Transport your mails
    transportMail(templatePath, mailDetails)
        .then((info) => {
            return Promise.resolve(info);
        })
        .catch((err) => {
            return Promise.reject(err);
        });

};

const sendResetChatMail = async (req) => {
    let templatePath = global.appRoot + "/app/mailer/templates/sendResetChatMail.template";
    let mailDetails = req;
    //Transport your mails
    transportMail(templatePath, mailDetails)
        .then((info) => {
            return Promise.resolve(info);
        })
        .catch((err) => {
            return Promise.reject(err);
        });

};

module.exports = { sendMail, sendStartChatMail, sendResetChatMail }