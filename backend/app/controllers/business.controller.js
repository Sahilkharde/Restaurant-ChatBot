const { getOpenAIReply } = require('../services/openai.service'); // ✅ Import service
const {
  v4: uuidv4
} = require('uuid');
var mailer = require(global.appRoot + '/app/mailer/mailerServices');
const config = require(global.appRoot + '/config/config');
var moment = require("moment-timezone");
const axiosPostFn = require('../axiosPostFn');
const logger = require(global.appRoot + '/app/log');

module.exports = function (app, knex, acl) {

  app.post('/chat/business', async function (req, res, next) {
    const { conversation } = req.body;

    try {
      await insertConversationQuery(req.body.conversation, req.body.ConversationsUniqueId, null);
      const botReply = await getOpenAIReply(conversation, 'business');
      await insertConversationQuery([{ "role": "assistant", "content": botReply }], req.body.ConversationsUniqueId, null);
      res.json({ reply: botReply });
    } catch (error) {
      logger.error("business-report.controller.js:21 " + error);
      console.error('Error in chat controller:', error.response?.data || error.message);
      res.status(500).json({ reply: 'Sorry, something went wrong with the AI server.' });
    }
  });

  app.post('/chat/business/anonymousBusiness', async function (req, res, next) {
    const { conversation } = req.body;

    try {
      await insertAnonymousConversationQuery(req.body.conversation, req.body.ConversationsUniqueId, null);
      const botReply = await getOpenAIReply(conversation, 'business');
      await insertAnonymousConversationQuery([{ "role": "assistant", "content": botReply }], req.body.ConversationsUniqueId, null);
      res.json({ reply: botReply });
    } catch (error) {
      logger.error("business-report.controller.js:36 " + error);
      console.error('Error in chat controller:', error.response?.data || error.message);
      res.status(500).json({ reply: 'Sorry, something went wrong with the AI server.' });
    }
  });

  app.post('/chat/business/newAnonymousUser', async function (req, res, next) {
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
        subject: `[AI Assistant] New Conversation Started by Business – ${data.name}`,
        to: adminEmails,
        // to: 'srajan@techrev.us',
        appType: "chat",
        adminName: "Admin",
        userType: 'Business',
        loginStatus: 'Anonymous User',
        emailBody: `A new conversation has been initiated in the <strong>AI Assistant</strong>. Please review the details below:`
      }

      const isExistingUser = await knex('businessAnonymousUsers').where('email', data.email).andWhere('phone', data.phone).first();
      if (isExistingUser) {
        // update record in businessAnonymousUsersChatConversations
        var businessAnonymousUsersChatConversationsUniqueId = uuidv4();
        let item = {
          businessAnonymousUsersChatConversationsUniqueId: businessAnonymousUsersChatConversationsUniqueId,
          businessAnonymousUsersUniqueId: isExistingUser.businessAnonymousUsersUniqueId,
          initatedDateTime: new Date(),
          updatedDateTime: new Date()
        }

        await knex('businessAnonymousUsersChatConversations').insert(item);

        mailDetails.initatedDateTime = formattedTime(item.initatedDateTime);

        let sendMail = await mailer.sendStartChatMail(mailDetails);

        // send response back to client
        res.json(
          {
            businessAnonymousUsersChatConversationsUniqueId: businessAnonymousUsersChatConversationsUniqueId,
            businessAnonymousUsersUniqueId: isExistingUser.businessAnonymousUsersUniqueId
          }
        );
      } else {
        // insert record in businessAnonymousUsers
        var businessAnonymousUsersUniqueId = uuidv4();
        let businessAnonymousUserData = {
          businessAnonymousUsersUniqueId: businessAnonymousUsersUniqueId,
          name: data.name,
          email: data.email,
          phone: data.phone,
          countryCodeId: data.countryCodeId,
          countryCode: data.phonePrefixCode,
          createdAt: new Date(),
          ipAddress: req.user.ipAddress
        }

        await knex('businessAnonymousUsers').insert(businessAnonymousUserData);

        // insert record in businessAnonymousUsersChatConversations
        var businessAnonymousUsersChatConversationsUniqueId = uuidv4();
        let item = {
          businessAnonymousUsersChatConversationsUniqueId: businessAnonymousUsersChatConversationsUniqueId,
          businessAnonymousUsersUniqueId: businessAnonymousUsersUniqueId,
          initatedDateTime: new Date(),
          updatedDateTime: new Date()
        }

        await knex('businessAnonymousUsersChatConversations').insert(item);

        mailDetails.initatedDateTime = formattedTime(item.initatedDateTime);

        let sendMail = await mailer.sendStartChatMail(mailDetails);

        // send response back to client
        res.json(
          {
            businessAnonymousUsersChatConversationsUniqueId: businessAnonymousUsersChatConversationsUniqueId,
            businessAnonymousUsersUniqueId: businessAnonymousUsersUniqueId
          }
        );
      }
    } catch (error) {
      logger.error("business-report.controller.js:125 " + error);
      console.error('Error in chat controller:', error.response?.data || error.message);
      res.status(500).json({ reply: 'Sorry, something went wrong with the AI server.' });
    }
  });

  app.post('/chat/business/resetAnonymousUserConversation', async function (req, res, next) {
    const data = req.body;

    try {
      // get existing anonymous user unique id
      var businessAnonymousUsersUniqueId = req.body.businessAnonymousUsersUniqueId;
      const userData = await knex('businessAnonymousUsers').where('businessAnonymousUsersUniqueId', businessAnonymousUsersUniqueId).first();
      // insert record in businessAnonymousUsersChatConversations
      var businessAnonymousUsersChatConversationsUniqueId = uuidv4();
      let item = {
        businessAnonymousUsersChatConversationsUniqueId: businessAnonymousUsersChatConversationsUniqueId,
        businessAnonymousUsersUniqueId: businessAnonymousUsersUniqueId,
        initatedDateTime: new Date(),
        updatedDateTime: new Date()
      }

      await knex('businessAnonymousUsersChatConversations').insert(item);

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
        subject: `[AI Assistant] New Conversation Reset by Business – ${userData.name}`,
        to: adminEmails,
        // to: 'srajan@techrev.us',
        appType: "chat",
        adminName: "Admin",
        userType: 'Business',
        loginStatus: 'Anonymous User',
        initatedDateTime: formattedTime(item.initatedDateTime)
      }
      let sendMail = await mailer.sendResetChatMail(mailDetails);

      // send response back to client
      res.json(
        {
          businessAnonymousUsersChatConversationsUniqueId: businessAnonymousUsersChatConversationsUniqueId,
          businessAnonymousUsersUniqueId: businessAnonymousUsersUniqueId
        }
      );
    } catch (error) {
      logger.error("business-report.controller.js:180 " + error);
      console.error('Error in chat controller:', error.response?.data || error.message);
      res.status(500).json({ reply: 'Sorry, something went wrong with the AI server.' });
    }
  });

  app.post('/chat/business/insertBusinessChatConversations', async function (req, res, next) {
    // const data = req.body;

    try {
      // get existing anonymous user unique id
      var businessUserId = req.body.businessUserId;
      var isReset = req.body.isReset;
      // insert record in businessAnonymousUsersChatConversations
      var businessChatConversationsUniqueId = uuidv4();
      let item = {
        businessChatConversationsUniqueId: businessChatConversationsUniqueId,
        businessUserId: businessUserId,
        initatedDateTime: new Date(),
        updatedDateTime: new Date()
      }

      await knex('businessChatConversations').insert(item);

      // getting admin data and notary data
      const apiUrl = `${config.serviceBaseURL.adminApiUrl}api/getPlatformUsersByActive`;
      const response = await axiosPostFn(apiUrl, { isBusiness: true, userId: businessUserId });

      var businessData = response.businessData;
      var adminEmails = [];
      response.adminUsers.map((item) => {
        adminEmails.push(item.email);
      });

      var mailDetails = {
        name: businessData.name,
        email: businessData.email,
        phone: `(${businessData.countryCode}) ${businessData.phone}`,
        subject: `[AI Assistant] New Conversation ${isReset ? "Reset" : "Started"} by Business – ${businessData.name}`,
        to: adminEmails,
        // to: 'srajan@techrev.us',
        appType: "chat",
        adminName: "Admin",
        userType: 'Business',
        loginStatus: 'Logged In User',
        initatedDateTime: formattedTime(item.initatedDateTime),
        emailBody: `A new conversation has been ${isReset ? "reset" : "initiated"} in the <strong>AI Assistant</strong>. Please review the details below:`
      }

      let sendMail = await mailer.sendStartChatMail(mailDetails);

      // send response back to client
      res.json(
        {
          businessChatConversationsUniqueId: businessChatConversationsUniqueId,
          businessUserId: businessUserId
        }
      );
    } catch (error) {
      logger.error("business-report.controller.js:238 " + error);
      console.error('Error in chat controller:', error.response?.data || error.message);
      res.status(500).json({ reply: 'Sorry, something went wrong with the AI server.' });
    }
  });

  const insertConversationQuery = async (conversationData, ConversationsUniqueId, transaction) => {
    try {
      let item = {
        businessChatConversationsUniqueId: ConversationsUniqueId,
        role: conversationData[conversationData.length - 1].role,
        content: conversationData[conversationData.length - 1].content,
        messageDateTime: new Date()
      }

      let knexTrx = transaction ? knex('businessChatMessages').transacting(transaction) : knex('businessChatMessages');
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
        businessAnonymousUsersChatConversationsUniqueId: ConversationsUniqueId,
        role: conversationData[conversationData.length - 1].role,
        content: conversationData[conversationData.length - 1].content,
        messageDateTime: new Date()
      }

      let knexTrx = transaction ? knex('businessAnonymousUsersChatMessages').transacting(transaction) : knex('businessAnonymousUsersChatMessages');
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
