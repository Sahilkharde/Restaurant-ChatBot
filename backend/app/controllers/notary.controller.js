const { getOpenAIReply } = require('../services/openai.service'); // ✅ Import service
const {
  v4: uuidv4
} = require('uuid');
const axiosPostFn = require('../axiosPostFn');
var mailer = require(global.appRoot + '/app/mailer/mailerServices');
const config = require(global.appRoot + '/config/config');
var moment = require("moment-timezone");
const logger = require(global.appRoot + '/app/log');

module.exports = function (app, knex, acl) {

  app.post('/chat/notary', async function (req, res, next) {
    const { conversation } = req.body;

    try {
      await insertConversationQuery(req.body.conversation, req.body.ConversationsUniqueId, null);
      const botReply = await getOpenAIReply(conversation, 'notary');
      await insertConversationQuery([{ "role": "assistant", "content": botReply }], req.body.ConversationsUniqueId, null);
      res.json({ reply: botReply });
    } catch (error) {
      logger.error("notary-report.controller.js:21 " + error);
      console.error('Error in chat controller:', error.response?.data || error.message);
      res.status(500).json({ reply: 'Sorry, something went wrong with the AI server.' });
    }
  });

  app.post('/chat/notary/anonymousNotary', async function (req, res, next) {
    const { conversation } = req.body;

    try {
      await insertAnonymousConversationQuery(req.body.conversation, req.body.ConversationsUniqueId, null);
      const botReply = await getOpenAIReply(conversation, 'notary');
      await insertAnonymousConversationQuery([{ "role": "assistant", "content": botReply }], req.body.ConversationsUniqueId, null);
      res.json({ reply: botReply });
    } catch (error) {
      logger.error("notary-report.controller.js:35 " + error);
      console.error('Error in chat controller:', error.response?.data || error.message);
      res.status(500).json({ reply: 'Sorry, something went wrong with the AI server.' });
    }
  });

  app.post('/chat/notary/newAnonymousUser', async function (req, res, next) {
    const data = req.body;

    try {
      const apiUrl = `${config.serviceBaseURL.adminApiUrl}api/getPlatformUsersByActive`;
      const response = await axiosPostFn(apiUrl, {});

      var adminEmails = [];
      response.adminUsers.map((item) => {
        adminEmails.push(item.email);
      });

      let mailDetails = {
        name: data.name,
        email: data.email,
        phone: `(${data.phonePrefixCode}) ${data.phone}`,
        subject: `[AI Assistant] New Conversation Started by Notary – ${data.name}`,
        to: adminEmails,
        // to: 'srajan@techrev.us',
        appType: "chat",
        adminName: "Admin",
        userType: 'Notary',
        loginStatus: 'Anonymous User',
        emailBody: `A new conversation has been initiated in the <strong>AI Assistant</strong>. Please review the details below:`
      }

      const isExistingUser = await knex('notaryAnonymousUsers').where('email', data.email).andWhere('phone', data.phone).first();
      if (isExistingUser) {
        // update record in notaryAnonymousUsersChatConversations
        var notaryAnonymousUsersChatConversationsUniqueId = uuidv4();
        let item = {
          notaryAnonymousUsersChatConversationsUniqueId: notaryAnonymousUsersChatConversationsUniqueId,
          notaryAnonymousUsersUniqueId: isExistingUser.notaryAnonymousUsersUniqueId,
          initatedDateTime: new Date(),
          updatedDateTime: new Date()
        }

        await knex('notaryAnonymousUsersChatConversations').insert(item);

        mailDetails.initatedDateTime = formattedTime(item.initatedDateTime);

        let sendMail = await mailer.sendStartChatMail(mailDetails);
        
        // send response back to client
        res.json(
          {
            notaryAnonymousUsersChatConversationsUniqueId: notaryAnonymousUsersChatConversationsUniqueId,
            notaryAnonymousUsersUniqueId: isExistingUser.notaryAnonymousUsersUniqueId
          }
        );
      } else {
        // insert record in notaryAnonymousUsers
        var notaryAnonymousUsersUniqueId = uuidv4();
        let notaryAnonymousUserData = {
          notaryAnonymousUsersUniqueId: notaryAnonymousUsersUniqueId,
          name: data.name,
          email: data.email,
          phone: data.phone,
          countryCodeId: data.countryCodeId,
          countryCode: data.phonePrefixCode,
          createdAt: new Date(),
          ipAddress: req.user.ipAddress
        }

        await knex('notaryAnonymousUsers').insert(notaryAnonymousUserData);

        // insert record in notaryAnonymousUsersChatConversations
        var notaryAnonymousUsersChatConversationsUniqueId = uuidv4();
        let item = {
          notaryAnonymousUsersChatConversationsUniqueId: notaryAnonymousUsersChatConversationsUniqueId,
          notaryAnonymousUsersUniqueId: notaryAnonymousUsersUniqueId,
          initatedDateTime: new Date(),
          updatedDateTime: new Date()
        }

        await knex('notaryAnonymousUsersChatConversations').insert(item);

        mailDetails.initatedDateTime = formattedTime(item.initatedDateTime);
      
        let sendMail = await mailer.sendStartChatMail(mailDetails);

        // send response back to client
        res.json(
          {
            notaryAnonymousUsersChatConversationsUniqueId: notaryAnonymousUsersChatConversationsUniqueId,
            notaryAnonymousUsersUniqueId: notaryAnonymousUsersUniqueId
          }
        );
      }
    } catch (error) {
      logger.error("notary-report.controller.js:122 " + error);
      console.error('Error in chat controller:', error.response?.data || error.message);
      res.status(500).json({ reply: 'Sorry, something went wrong with the AI server.' });
    }
  });

  app.post('/chat/notary/resetAnonymousUserConversation', async function (req, res, next) {
    const data = req.body;

    try {
      // get existing anonymous user unique id
      var notaryAnonymousUsersUniqueId = req.body.notaryAnonymousUsersUniqueId;
      const userData = await knex('notaryAnonymousUsers').where('notaryAnonymousUsersUniqueId', notaryAnonymousUsersUniqueId).first();
      // insert record in notaryAnonymousUsersChatConversations
      var notaryAnonymousUsersChatConversationsUniqueId = uuidv4();
      let item = {
        notaryAnonymousUsersChatConversationsUniqueId: notaryAnonymousUsersChatConversationsUniqueId,
        notaryAnonymousUsersUniqueId: notaryAnonymousUsersUniqueId,
        initatedDateTime: new Date(),
        updatedDateTime: new Date()
      }

      await knex('notaryAnonymousUsersChatConversations').insert(item);

      const apiUrl = `${config.serviceBaseURL.adminApiUrl}api/getPlatformUsersByActive`;
      const response = await axiosPostFn(apiUrl, {});

      var adminEmails = [];
      response.adminUsers.map((item) => {
        adminEmails.push(item.email);
      });

      var mailDetails = {
        name: userData.name,
        email: userData.email,
        phone: `(${userData.countryCode}) ${userData.phone}`,
        subject: `[AI Assistant] New Conversation Reset by Notary – ${userData.name}`,
        to: adminEmails,
        // to: 'srajan@techrev.us',
        appType: "chat",
        adminName: "Admin",
        userType: 'Notary',
        loginStatus: 'Anonymous User',
        initatedDateTime: formattedTime(item.initatedDateTime)
      }
      let sendMail = await mailer.sendResetChatMail(mailDetails);

      // send response back to client
      res.json(
        {
          notaryAnonymousUsersChatConversationsUniqueId: notaryAnonymousUsersChatConversationsUniqueId,
          notaryAnonymousUsersUniqueId: notaryAnonymousUsersUniqueId
        }
      );
    } catch (error) {
      logger.error("notary-report.controller.js:176 " + error);
      console.error('Error in chat controller:', error.response?.data || error.message);
      res.status(500).json({ reply: 'Sorry, something went wrong with the AI server.' });
    }
  });

  app.post('/chat/notary/insertNotaryChatConversations', async function (req, res, next) {
    // const data = req.body;

    try {
      // get existing anonymous user unique id
      var serviceProviderId = req.body.serviceProviderId;
      var isReset = req.body.isReset;
      // insert record in notaryAnonymousUsersChatConversations
      var notaryChatConversationsUniqueId = uuidv4();
      let item = {
        notaryChatConversationsUniqueId: notaryChatConversationsUniqueId,
        serviceProviderId: serviceProviderId,
        initatedDateTime: new Date(),
        updatedDateTime: new Date()
      }

      await knex('notaryChatConversations').insert(item);

      // getting admin data and notary data
      const apiUrl = `${config.serviceBaseURL.adminApiUrl}api/getPlatformUsersByActive`;
      const response = await axiosPostFn(apiUrl, { isNotary: true, userId: serviceProviderId });

      var notaryData = response.notaryData;
      var adminEmails = [];
      response.adminUsers.map((item) => {
        adminEmails.push(item.email);
      });

      var mailDetails = {
        name: notaryData.name,
        email: notaryData.email,
        phone: `(${notaryData.countryCode}) ${notaryData.phone}`,
        subject: `[AI Assistant] New Conversation ${isReset ? "Reset" : "Started"} by Notary – ${notaryData.name}`,
        to: adminEmails,
        // to: 'srajan@techrev.us',
        appType: "chat",
        adminName: "Admin",
        userType: 'Notary',
        loginStatus: 'Logged In User',
        initatedDateTime: formattedTime(item.initatedDateTime),
        emailBody: `A new conversation has been ${isReset ? "reset" : "initiated"} in the <strong>AI Assistant</strong>. Please review the details below:`
      }

      let sendMail = await mailer.sendStartChatMail(mailDetails);

      // send response back to client
      res.json(
        {
          notaryChatConversationsUniqueId: notaryChatConversationsUniqueId,
          serviceProviderId: serviceProviderId
        }
      );
    } catch (error) {
      logger.error("notary-report.controller.js:233 " + error);
      console.error('Error in chat controller:', error.response?.data || error.message);
      res.status(500).json({ reply: 'Sorry, something went wrong with the AI server.' });
    }
  });

  const insertConversationQuery = async (conversationData, ConversationsUniqueId, transaction) => {
    try {
      let item = {
        notaryChatConversationsUniqueId: ConversationsUniqueId,
        role: conversationData[conversationData.length - 1].role,
        content: conversationData[conversationData.length - 1].content,
        messageDateTime: new Date()
      }

      let knexTrx = transaction ? knex('notaryChatMessages').transacting(transaction) : knex('notaryChatMessages');
      let results = await knexTrx.insert(item)
      return Promise.resolve(results);
    } catch (error) {
      // logger.error(error);
      return Promise.reject(error);
    }

  };

  const insertAnonymousConversationQuery = async (conversationData, ConversationsUniqueId, transaction) => {
    try {
      let item = {
        notaryAnonymousUsersChatConversationsUniqueId: ConversationsUniqueId,
        role: conversationData[conversationData.length - 1].role,
        content: conversationData[conversationData.length - 1].content,
        messageDateTime: new Date()
      }

      let knexTrx = transaction ? knex('notaryAnonymousUsersChatMessages').transacting(transaction) : knex('notaryAnonymousUsersChatMessages');
      let results = await knexTrx.insert(item)
      return Promise.resolve(results);
    } catch (error) {
      // logger.error(error);
      return Promise.reject(error);
    }

  };

  var formattedTime = (time) => {
    return moment(time).tz('America/New_York').format('lll');
  }
}
