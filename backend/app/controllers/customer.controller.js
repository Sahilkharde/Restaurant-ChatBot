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

  app.post('/chat/customer', async function (req, res, next) {
    const { conversation } = req.body;

    try {
      await insertConversationQuery(req.body.conversation, req.body.ConversationsUniqueId, null);
      const userStage = req.body.userStage || 'guest';
      const botReply = await getOpenAIReply(conversation, 'customer', userStage);
      await insertConversationQuery([{ "role": "assistant", "content": botReply }], req.body.ConversationsUniqueId, null);
      res.json({ reply: botReply });
    } catch (error) {
      logger.error("customer-report.controller.js:21 " + error);
      console.error('Error in chat controller:', error.response?.data || error.message);
      res.status(500).json({ reply: 'Sorry, something went wrong with the AI server.' });
    }
  });

  app.post('/chat/customer/anonymousCustomer', async function (req, res, next) {
    const { conversation } = req.body;

    try {
      await insertAnonymousConversationQuery(req.body.conversation, req.body.ConversationsUniqueId, null);
      const userStage = req.body.userStage || 'guest';
      const botReply = await getOpenAIReply(conversation, 'customer', userStage);
      await insertAnonymousConversationQuery([{ "role": "assistant", "content": botReply }], req.body.ConversationsUniqueId, null);
      res.json({ reply: botReply });
    } catch (error) {
      logger.error("customer-report.controller.js:35 " + error);
      console.error('Error in chat controller:', error.response?.data || error.message);
      res.status(500).json({ reply: 'Sorry, something went wrong with the AI server.' });
    }
  });

  app.post('/chat/customer/newAnonymousUser', async function (req, res, next) {
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
        subject: `[AI Assistant] New Conversation Started by Customer – ${data.name}`,
        to: adminEmails,
        // to: 'srajan@techrev.us',
        appType: "chat",
        adminName: "Admin",
        userType: 'Customer',
        loginStatus: 'Anonymous User',
        emailBody: `A new conversation has been initiated in the <strong>AI Assistant</strong>. Please review the details below:`
      }

      const isExistingUser = await knex('customerAnonymousUsers').where('email', data.email).andWhere('phone', data.phone).first();
      if (isExistingUser) {
        // update record in customerAnonymousUsersChatConversations
        var customerAnonymousUsersChatConversationsUniqueId = uuidv4();
        let item = {
          customerAnonymousUsersChatConversationsUniqueId: customerAnonymousUsersChatConversationsUniqueId,
          customerAnonymousUsersUniqueId: isExistingUser.customerAnonymousUsersUniqueId,
          initatedDateTime: new Date(),
          updatedDateTime: new Date()
        }

        await knex('customerAnonymousUsersChatConversations').insert(item);
        
        mailDetails.initatedDateTime = formattedTime(item.initatedDateTime);

        let sendMail = await mailer.sendStartChatMail(mailDetails);

        // send response back to client
        res.json(
          {
            customerAnonymousUsersChatConversationsUniqueId: customerAnonymousUsersChatConversationsUniqueId,
            customerAnonymousUsersUniqueId: isExistingUser.customerAnonymousUsersUniqueId
          }
        );
      } else {
        // insert record in customerAnonymousUsers
        var customerAnonymousUsersUniqueId = uuidv4();
        let customerAnonymousUserData = {
          customerAnonymousUsersUniqueId: customerAnonymousUsersUniqueId,
          name: data.name,
          email: data.email,
          phone: data.phone,
          countryCodeId: data.countryCodeId,
          countryCode: data.phonePrefixCode,
          createdAt: new Date(),
          ipAddress: req.user.ipAddress
        }

        await knex('customerAnonymousUsers').insert(customerAnonymousUserData);

        // insert record in customerAnonymousUsersChatConversations
        var customerAnonymousUsersChatConversationsUniqueId = uuidv4();
        let item = {
          customerAnonymousUsersChatConversationsUniqueId: customerAnonymousUsersChatConversationsUniqueId,
          customerAnonymousUsersUniqueId: customerAnonymousUsersUniqueId,
          initatedDateTime: new Date(),
          updatedDateTime: new Date()
        }

        await knex('customerAnonymousUsersChatConversations').insert(item);

        mailDetails.initatedDateTime = formattedTime(item.initatedDateTime);

        let sendMail = await mailer.sendStartChatMail(mailDetails);

        // send response back to client
        res.json(
          {
            customerAnonymousUsersChatConversationsUniqueId: customerAnonymousUsersChatConversationsUniqueId,
            customerAnonymousUsersUniqueId: customerAnonymousUsersUniqueId
          }
        );
      }
    } catch (error) {
      logger.error("customer-report.controller.js:123 " + error);
      console.error('Error in chat controller:', error.response?.data || error.message);
      res.status(500).json({ reply: 'Sorry, something went wrong with the AI server.' });
    }
  });

  app.post('/chat/customer/resetAnonymousUserConversation', async function (req, res, next) {
    const data = req.body;

    try {
      // get existing anonymous user unique id
      var customerAnonymousUsersUniqueId = req.body.customerAnonymousUsersUniqueId;
      const userData = await knex('customerAnonymousUsers').where('customerAnonymousUsersUniqueId', customerAnonymousUsersUniqueId).first();
      // insert record in customerAnonymousUsersChatConversations
      var customerAnonymousUsersChatConversationsUniqueId = uuidv4();
      let item = {
        customerAnonymousUsersChatConversationsUniqueId: customerAnonymousUsersChatConversationsUniqueId,
        customerAnonymousUsersUniqueId: customerAnonymousUsersUniqueId,
        initatedDateTime: new Date(),
        updatedDateTime: new Date()
      }

      await knex('customerAnonymousUsersChatConversations').insert(item);

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
        subject: `[AI Assistant] New Conversation Reset by Customer – ${userData.name}`,
        to: adminEmails,
        // to: 'srajan@techrev.us',
        appType: "chat",
        adminName: "Admin",
        userType: 'Customer',
        loginStatus: 'Anonymous User',
        initatedDateTime: formattedTime(item.initatedDateTime)
      }
      let sendMail = await mailer.sendResetChatMail(mailDetails);

      // send response back to client
      res.json(
        {
          customerAnonymousUsersChatConversationsUniqueId: customerAnonymousUsersChatConversationsUniqueId,
          customerAnonymousUsersUniqueId: customerAnonymousUsersUniqueId
        }
      );
    } catch (error) {
      logger.error("customer-report.controller.js:177 " + error);
      console.error('Error in chat controller:', error.response?.data || error.message);
      res.status(500).json({ reply: 'Sorry, something went wrong with the AI server.' });
    }
  });

  app.post('/chat/customer/insertCustomerChatConversations', async function (req, res, next) {
    // const data = req.body;

    try {
      // get existing anonymous user unique id
      var applicationUserId = req.body.applicationUserId;
      var isReset = req.body.isReset;
      // insert record in customerAnonymousUsersChatConversations
      var customerChatConversationsUniqueId = uuidv4();
      let item = {
        customerChatConversationsUniqueId: customerChatConversationsUniqueId,
        applicationUserId: applicationUserId,
        initatedDateTime: new Date(),
        updatedDateTime: new Date()
      }

      await knex('customerChatConversations').insert(item);

      // getting admin data and notary data
      const apiUrl = `${config.serviceBaseURL.adminApiUrl}api/getPlatformUsersByActive`;
      const response = await axiosPostFn(apiUrl, { isCustomer: true, userId: applicationUserId });

      var customerData = response.customerData;
      var adminEmails = [];
      response.adminUsers.map((item) => {
        adminEmails.push(item.email);
      });

      var mailDetails = {
        name: customerData.name,
        email: customerData.email,
        phone: `(${customerData.countryCode}) ${customerData.phone}`,
        subject: `[AI Assistant] New Conversation ${isReset ? "Reset" : "Started"} by Customer – ${customerData.name}`,
        to: adminEmails,
        // to: 'srajan@techrev.us',
        appType: "chat",
        adminName: "Admin",
        userType: 'Customer',
        loginStatus: 'Logged In User',
        initatedDateTime: formattedTime(item.initatedDateTime),
        emailBody: `A new conversation has been ${isReset ? "reset" : "initiated"} in the <strong>AI Assistant</strong>. Please review the details below:`
      }

      let sendMail = await mailer.sendStartChatMail(mailDetails);

      // send response back to client
      res.json(
        {
          customerChatConversationsUniqueId: customerChatConversationsUniqueId,
          applicationUserId: applicationUserId
        }
      );
    } catch (error) {
      logger.error("customer-report.controller.js:233 " + error);
      console.error('Error in chat controller:', error.response?.data || error.message);
      res.status(500).json({ reply: 'Sorry, something went wrong with the AI server.' });
    }
  });

  const insertConversationQuery = async (conversationData, ConversationsUniqueId, transaction) => {
    try {
      let item = {
        customerChatConversationsUniqueId: ConversationsUniqueId,
        role: conversationData[conversationData.length - 1].role,
        content: conversationData[conversationData.length - 1].content,
        messageDateTime: new Date()
      }

      let knexTrx = transaction ? knex('customerChatMessages').transacting(transaction) : knex('customerChatMessages');
      let results = await knexTrx.insert(item);

      let updateItem = {
        updatedDateTime: new Date()
      }

      await knex('customerChatConversations').where('customerChatConversationsUniqueId', ConversationsUniqueId).update(updateItem);

      return Promise.resolve(results);
    } catch (error) {
      // logger.error(error);
      return Promise.reject(error);
    }

  };

  const insertAnonymousConversationQuery = async (conversationData, ConversationsUniqueId, transaction) => {
    try {
      let item = {
        customerAnonymousUsersChatConversationsUniqueId: ConversationsUniqueId,
        role: conversationData[conversationData.length - 1].role,
        content: conversationData[conversationData.length - 1].content,
        messageDateTime: new Date()
      }

      let knexTrx = transaction ? knex('customerAnonymousUsersChatMessages').transacting(transaction) : knex('customerAnonymousUsersChatMessages');
      let results = await knexTrx.insert(item);

      let updateItem = {
        updatedDateTime: new Date()
      }

      await knex('customerAnonymousUsersChatConversations').where('customerAnonymousUsersChatConversationsUniqueId', ConversationsUniqueId).update(updateItem);

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
