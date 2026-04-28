const axios = require('axios');
const config = require(global.appRoot + '/config/config');
var logger = require(global.appRoot + '/app/log');

module.exports = function (app, knex, acl) {

    // Anonmymous Customer Chat Conversations
    app.post('/chat/admin/getAllAnonymousCustomerChatConversations', async function (req, res) {
        try {
            const data = await getAllAnonymousCustomerChatConversationsQuery(req.body);
            res.status(200).json({ success: true, data });
        } catch (error) {
            logger.error("admin-report.controller.js:13 " + error);
            res.status(500).json({ success: false, message: 'Error fetching anonymous customer chat conversations' });
        }
    });

    //Anonmymous Customer Chat Conversation Messages
    app.post('/chat/admin/getAnonymousCustomerChatConversationMessages', async function (req, res) {
        try {
            const { conversationUniqueId } = req.body;

            if (!conversationUniqueId) {
                return res.status(400).json({ success: false, message: 'conversationUniqueId is required' });
            }

            const data = await getAnonymousCustomerChatConversationMessagesQuery(knex, conversationUniqueId);
            res.status(200).json({ success: true, data });
        } catch (error) {
            logger.error("admin-report.controller.js:29 " + error);
            res.status(500).json({ success: false, message: 'Error fetching anonymous customer chat messages for conversation' });
        }
    });

    // Registered Customer Chat Conversations
    app.post('/chat/admin/getAllRegisteredCustomerChatConversations', async function (req, res) {
        try {
            const data = await getAllRegisteredCustomerChatConversationsQuery(req.body);
            res.status(200).json({ success: true, data });
        } catch (error) {
            logger.error("admin-report.controller.js:40" + error);
            res.status(500).json({ success: false, message: 'Error fetching registered customer chat conversations' });
        }
    });

    // Registered Customer Chat Conversation Messages
    app.post('/chat/admin/getRegisteredCustomerChatConversationMessages', async function (req, res) {
        try {
            const { conversationUniqueId } = req.body;

            if (!conversationUniqueId) {
                return res.status(400).json({ success: false, message: 'conversationUniqueId is required' });
            }

            const data = await getRegisteredCustomerChatConversationMessagesQuery(knex, conversationUniqueId);
            res.status(200).json({ success: true, data });
        } catch (error) {
            logger.error("admin-report.controller.js:57 " + error);
            res.status(500).json({ success: false, message: 'Error fetching registered customer chat messages for conversation' });
        }
    });

    const getAllAnonymousCustomerChatConversationsQuery = async (reqItem) => {
        try {
            // Get all conversations with user details
            const conversations = await knex('customerAnonymousUsersChatConversations as c')
                .leftJoin(
                    'customerAnonymousUsers as u',
                    'c.customerAnonymousUsersUniqueId',
                    'u.customerAnonymousUsersUniqueId'
                )
                .select(
                    'c.customerAnonymousUsersChatConversationsId',
                    'c.customerAnonymousUsersChatConversationsUniqueId',
                    'c.customerAnonymousUsersUniqueId',
                    'c.initatedDateTime',
                    'c.updatedDateTime',
                    'u.customerAnonymousUsersId',
                    'u.name',
                    'u.email',
                    'u.phone',
                    'u.countryCodeId',
                    'u.countryCode'
                )
                .orderBy('c.updatedDateTime', 'desc');

            // Fetch the latest user message for each conversation
            const conversationIds = conversations.map(
                (conv) => conv.customerAnonymousUsersChatConversationsUniqueId
            );

            if (conversationIds.length === 0) return [];

            const lastMessages = await knex('customerAnonymousUsersChatMessages as m')
                .select(
                    'm.customerAnonymousUsersChatConversationsUniqueId',
                    'm.content as lastUserMessage'
                )
                .whereIn('m.customerAnonymousUsersChatConversationsUniqueId', conversationIds)
                .andWhere('m.role', 'user')
                .andWhereRaw(`
                    m.messageDateTime = (
                        SELECT MAX(messageDateTime) 
                        FROM customerAnonymousUsersChatMessages 
                        WHERE role = 'user' 
                        AND customerAnonymousUsersChatConversationsUniqueId = m.customerAnonymousUsersChatConversationsUniqueId
                    )
                `);

            // Map last messages to conversations
            const lastMessageMap = {};
            lastMessages.forEach((msg) => {
                lastMessageMap[msg.customerAnonymousUsersChatConversationsUniqueId] = msg.lastUserMessage;
            });

            // Map to a new array and assign it to a variable
            const conversationsWithMessages = conversations.map((conv) => ({
                ...conv,
                lastUserMessage: lastMessageMap[conv.customerAnonymousUsersChatConversationsUniqueId] || null,
            }));

            // pagination 
            let object = { total: conversationsWithMessages.length, results: conversationsWithMessages };

            if (reqItem.gridProperties.pageNumber) {
                const from = (reqItem.gridProperties.pageNumber * reqItem.gridProperties.pageSize) - reqItem.gridProperties.pageSize;
                const to = (reqItem.gridProperties.pageNumber * reqItem.gridProperties.pageSize);

                const paginatedData = conversationsWithMessages.slice(from, to);
                object = { total: conversationsWithMessages.length, results: paginatedData };
            }

            return object;



        } catch (error) {
            logger.error("admin-report.controller.js:137 " + error);
            throw error;
        }
    };

    const getAnonymousCustomerChatConversationMessagesQuery = async (knex, conversationUniqueId) => {
        try {
            // Fetch all messages for the conversation
            const messages = await knex('customerAnonymousUsersChatMessages as m')
                .select(
                    'm.customerAnonymousUsersChatMessagesId',
                    'm.customerAnonymousUsersChatConversationsUniqueId',
                    'm.role',
                    'm.content',
                    'm.messageDateTime'
                )
                .where('m.customerAnonymousUsersChatConversationsUniqueId', conversationUniqueId)
                .orderBy('m.messageDateTime', 'asc');

            return messages;
        } catch (error) {
            logger.error("admin-report.controller.js:158 " + error);
            throw error;
        }
    };

    const getAllRegisteredCustomerChatConversationsQuery = async (reqItem) => {
        try {
            // Step 1: Fetch all conversations
            const conversations = await knex('customerChatConversations as c')
                .select(
                    'c.customerChatConversationsId',
                    'c.customerChatConversationsUniqueId',
                    'c.applicationUserId',
                    'c.initatedDateTime',
                    'c.updatedDateTime'
                )
                .orderBy('c.updatedDateTime', 'desc');

            if (conversations.length === 0) {
                return { total: 0, results: [] };
            }

            // Step 2: Fetch last user message for each conversation
            const conversationIds = conversations.map(
                (conv) => conv.customerChatConversationsUniqueId
            );

            const lastMessages = await knex('customerChatMessages as m')
                .select(
                    'm.customerChatConversationsUniqueId',
                    'm.content as lastUserMessage'
                )
                .whereIn('m.customerChatConversationsUniqueId', conversationIds)
                .andWhere('m.role', 'user')
                .andWhereRaw(`
                m.messageDateTime = (
                    SELECT MAX(messageDateTime) 
                    FROM customerChatMessages 
                    WHERE role = 'user' 
                    AND customerChatConversationsUniqueId = m.customerChatConversationsUniqueId
                )
            `);

            // Step 3: Map last messages to conversations
            const lastMessageMap = {};
            lastMessages.forEach((msg) => {
                lastMessageMap[msg.customerChatConversationsUniqueId] = msg.lastUserMessage;
            });

            // Step 4: Fetch user details from external API
            const uniqueUserIds = [...new Set(
                conversations.map((c) => c.applicationUserId).filter(Boolean)
            )];

            let userDataMap = {};
            if (uniqueUserIds.length > 0) {
                try {
                    const response = await axios.post(
                        config.serviceBaseURL.customerApiUrl + 'api/getApplicationUserDetail',
                        { userIds: uniqueUserIds },
                        { headers: { 'Content-Type': 'application/json', "Origin": 'ChatbotBackend' } }
                    );

                    if (response.data?.success && Array.isArray(response.data.data)) {
                        response.data.data.forEach((user) => {
                            userDataMap[user.applicationUserId] = user; // match key with conv.applicationUserId
                        });
                    }
                } catch (err) {
                    logger.error("admin-report.controller.js:227 " + err);
                }
            }

            // Step 5: Combine conversation, user data, and last user message
            const conversationsWithData = conversations.map((conv) => ({
                ...conv,
                lastUserMessage: lastMessageMap[conv.customerChatConversationsUniqueId] || null,
                ...(userDataMap[conv.applicationUserId] || {}) // flatten user data
            }));

            // Step 6: Pagination
            let object = { total: conversationsWithData.length, results: conversationsWithData };

            if (reqItem.gridProperties?.pageNumber && reqItem.gridProperties?.pageSize) {
                const from = (reqItem.gridProperties.pageNumber - 1) * reqItem.gridProperties.pageSize;
                const to = reqItem.gridProperties.pageNumber * reqItem.gridProperties.pageSize;
                const paginatedData = conversationsWithData.slice(from, to);
                object = { total: conversationsWithData.length, results: paginatedData };
            }

            return object;

        } catch (error) {
            logger.error("admin-report.controller.js:251" + error);
            throw error;
        }
    };

    const getRegisteredCustomerChatConversationMessagesQuery = async (knex, conversationUniqueId) => {
        try {
            // Fetch all messages for the conversation
            const messages = await knex('customerChatMessages as m')
                .select(
                    'm.customerChatMessagesId',
                    'm.customerChatConversationsUniqueId',
                    'm.role',
                    'm.content',
                    'm.messageDateTime'
                )
                .where('m.customerChatConversationsUniqueId', conversationUniqueId)
                .orderBy('m.messageDateTime', 'asc');

            return messages;
        } catch (error) {
            logger.error("admin-report.controller.js:272" + error);
            throw error;
        }
    };

    // -------------- Notary Chat Conversations ------------------------//////
    // Anonymous Notary Chat Conversations
    app.post('/chat/admin/getAllAnonymousNotaryChatConversations', async function (req, res) {
        try {
            const data = await getAllAnonymousNotaryChatConversationsQuery(req.body);
            res.status(200).json({ success: true, data });
        } catch (error) {
            logger.error("admin-report.controller.js:285 " + error);
            res.status(500).json({ success: false, message: 'Error fetching anonymous Notary chat conversations' });
        }
    });

    //Anonymous Notary Chat Conversation Messages
    app.post('/chat/admin/getAnonymousNotaryChatConversationMessages', async function (req, res) {
        try {
            const { conversationUniqueId } = req.body;

            if (!conversationUniqueId) {
                return res.status(400).json({ success: false, message: 'conversationUniqueId is required' });
            }

            const data = await getAnonymousNotaryChatConversationMessagesQuery(knex, conversationUniqueId);
            res.status(200).json({ success: true, data });
        } catch (error) {
            logger.error("admin-report.controller.js:302 " + error);
            res.status(500).json({ success: false, message: 'Error fetching anonymous Notary chat messages for conversation' });
        }
    });

    // Registered Notary Chat Conversations
    app.post('/chat/admin/getAllRegisteredNotaryChatConversations', async function (req, res) {
        try {
            const data = await getAllRegisteredNotaryChatConversationsQuery(req.body);
            res.status(200).json({ success: true, data });
        } catch (error) {
            logger.error("admin-report.controller.js:313" + error);
            res.status(500).json({ success: false, message: 'Error fetching registered Notary chat conversations' });
        }
    });

    // Registered Notary Chat Conversation Messages
    app.post('/chat/admin/getRegisteredNotaryChatConversationMessages', async function (req, res) {
        try {
            const { conversationUniqueId } = req.body;

            if (!conversationUniqueId) {
                return res.status(400).json({ success: false, message: 'conversationUniqueId is required' });
            }

            const data = await getRegisteredNotaryChatConversationMessagesQuery(knex, conversationUniqueId);
            res.status(200).json({ success: true, data });
        } catch (error) {
            logger.error("admin-report.controller.js:330 " + error);
            res.status(500).json({ success: false, message: 'Error fetching registered Notary chat messages for conversation' });
        }
    });

    const getAllAnonymousNotaryChatConversationsQuery = async (reqItem) => {
        try {
            // Get all conversations with user details
            const conversations = await knex('notaryAnonymousUsersChatConversations as c')
                .leftJoin(
                    'notaryAnonymousUsers as u',
                    'c.notaryAnonymousUsersUniqueId',
                    'u.notaryAnonymousUsersUniqueId'
                )
                .select(
                    'c.notaryAnonymousUsersChatConversationsId',
                    'c.notaryAnonymousUsersChatConversationsUniqueId',
                    'c.notaryAnonymousUsersUniqueId',
                    'c.initatedDateTime',
                    'c.updatedDateTime',
                    'u.notaryAnonymousUsersId',
                    'u.name',
                    'u.email',
                    'u.phone',
                    'u.countryCodeId',
                    'u.countryCode'
                )
                .orderBy('c.updatedDateTime', 'desc');

            // Fetch the latest user message for each conversation
            const conversationIds = conversations.map(
                (conv) => conv.notaryAnonymousUsersChatConversationsUniqueId
            );

            if (conversationIds.length === 0) return [];

            const lastMessages = await knex('notaryAnonymousUsersChatMessages as m')
                .select(
                    'm.notaryAnonymousUsersChatConversationsUniqueId',
                    'm.content as lastUserMessage'
                )
                .whereIn('m.notaryAnonymousUsersChatConversationsUniqueId', conversationIds)
                .andWhere('m.role', 'user')
                .andWhereRaw(`
                    m.messageDateTime = (
                        SELECT MAX(messageDateTime) 
                        FROM notaryAnonymousUsersChatMessages 
                        WHERE role = 'user' 
                        AND notaryAnonymousUsersChatConversationsUniqueId = m.notaryAnonymousUsersChatConversationsUniqueId
                    )
                `);

            // Map last messages to conversations
            const lastMessageMap = {};
            lastMessages.forEach((msg) => {
                lastMessageMap[msg.notaryAnonymousUsersChatConversationsUniqueId] = msg.lastUserMessage;
            });

            // Map to a new array and assign it to a variable
            const conversationsWithMessages = conversations.map((conv) => ({
                ...conv,
                lastUserMessage: lastMessageMap[conv.notaryAnonymousUsersChatConversationsUniqueId] || null,
            }));

            // pagination 
            let object = { total: conversationsWithMessages.length, results: conversationsWithMessages };

            if (reqItem.gridProperties.pageNumber) {
                const from = (reqItem.gridProperties.pageNumber * reqItem.gridProperties.pageSize) - reqItem.gridProperties.pageSize;
                const to = (reqItem.gridProperties.pageNumber * reqItem.gridProperties.pageSize);

                const paginatedData = conversationsWithMessages.slice(from, to);
                object = { total: conversationsWithMessages.length, results: paginatedData };
            }

            return object;



        } catch (error) {
            logger.error("admin-report.controller.js:410 " + error);
            throw error;
        }
    };

    const getAnonymousNotaryChatConversationMessagesQuery = async (knex, conversationUniqueId) => {
        try {
            // Fetch all messages for the conversation
            const messages = await knex('notaryAnonymousUsersChatMessages as m')
                .select(
                    'm.notaryAnonymousUsersChatMessagesId',
                    'm.notaryAnonymousUsersChatConversationsUniqueId',
                    'm.role',
                    'm.content',
                    'm.messageDateTime'
                )
                .where('m.notaryAnonymousUsersChatConversationsUniqueId', conversationUniqueId)
                .orderBy('m.messageDateTime', 'asc');

            return messages;
        } catch (error) {
            logger.error("admin-report.controller.js:431 " + error);
            throw error;
        }
    };

    const getAllRegisteredNotaryChatConversationsQuery = async (reqItem) => {
        try {
            // Step 1: Fetch all conversations
            const conversations = await knex('notaryChatConversations as c')
                .select(
                    'c.notaryChatConversationsId',
                    'c.notaryChatConversationsUniqueId',
                    'c.serviceProviderId',
                    'c.initatedDateTime',
                    'c.updatedDateTime'
                )
                .orderBy('c.updatedDateTime', 'desc');

            if (conversations.length === 0) {
                return { total: 0, results: [] };
            }

            // Step 2: Fetch last user message for each conversation
            const conversationIds = conversations.map(
                (conv) => conv.notaryChatConversationsUniqueId
            );

            const lastMessages = await knex('notaryChatMessages as m')
                .select(
                    'm.notaryChatConversationsUniqueId',
                    'm.content as lastUserMessage'
                )
                .whereIn('m.notaryChatConversationsUniqueId', conversationIds)
                .andWhere('m.role', 'user')
                .andWhereRaw(`
                m.messageDateTime = (
                    SELECT MAX(messageDateTime) 
                    FROM notaryChatMessages 
                    WHERE role = 'user' 
                    AND notaryChatConversationsUniqueId = m.notaryChatConversationsUniqueId
                )
            `);

            // Step 3: Map last messages to conversations
            const lastMessageMap = {};
            lastMessages.forEach((msg) => {
                lastMessageMap[msg.notaryChatConversationsUniqueId] = msg.lastUserMessage;
            });

            // Step 4: Fetch user details from external API
            const uniqueUserIds = [...new Set(
                conversations.map((c) => c.serviceProviderId).filter(Boolean)
            )];

            let userDataMap = {};
            if (uniqueUserIds.length > 0) {
                try {
                    const response = await axios.post(
                        config.serviceBaseURL.customerApiUrl + 'api/getNotaryUserDetail',
                        { userIds: uniqueUserIds },
                        { headers: { 'Content-Type': 'application/json', "Origin": 'ChatbotBackend' } }
                    );

                    if (response.data?.success && Array.isArray(response.data.data)) {
                        response.data.data.forEach((user) => {
                            userDataMap[user.serviceProviderId] = user; // match key with conv.serviceProviderId
                        });
                    }
                } catch (err) {
                    logger.error("admin-report.controller.js:500 " + err);
                }
            }

            // Step 5: Combine conversation, user data, and last user message
            const conversationsWithData = conversations.map((conv) => ({
                ...conv,
                lastUserMessage: lastMessageMap[conv.notaryChatConversationsUniqueId] || null,
                ...(userDataMap[conv.serviceProviderId] || {}) // flatten user data
            }));

            // Step 6: Pagination
            let object = { total: conversationsWithData.length, results: conversationsWithData };

            if (reqItem.gridProperties?.pageNumber && reqItem.gridProperties?.pageSize) {
                const from = (reqItem.gridProperties.pageNumber - 1) * reqItem.gridProperties.pageSize;
                const to = reqItem.gridProperties.pageNumber * reqItem.gridProperties.pageSize;
                const paginatedData = conversationsWithData.slice(from, to);
                object = { total: conversationsWithData.length, results: paginatedData };
            }

            return object;

        } catch (error) {
            logger.error("admin-report.controller.js:524" + error);
            throw error;
        }
    };

    const getRegisteredNotaryChatConversationMessagesQuery = async (knex, conversationUniqueId) => {
        try {
            // Fetch all messages for the conversation
            const messages = await knex('notaryChatMessages as m')
                .select(
                    'm.notaryChatMessagesId',
                    'm.notaryChatConversationsUniqueId',
                    'm.role',
                    'm.content',
                    'm.messageDateTime'
                )
                .where('m.notaryChatConversationsUniqueId', conversationUniqueId)
                .orderBy('m.messageDateTime', 'asc');

            return messages;
        } catch (error) {
            logger.error("admin-report.controller.js:545" + error);
            throw error;
        }
    };

    // -------------- End of Notary Chat Conversations ------------------------//////

    // -------------- Business Chat Conversations ------------------------//////
    // Anonymous Business Chat Conversations
    app.post('/chat/admin/getAllAnonymousBusinessChatConversations', async function (req, res) {
        try {
            const data = await getAllAnonymousBusinessChatConversationsQuery(req.body);
            res.status(200).json({ success: true, data });
        } catch (error) {
            logger.error("admin-report.controller.js:559 " + error);
            res.status(500).json({ success: false, message: 'Error fetching anonymous Business chat conversations' });
        }
    });

    //Anonymous Business Chat Conversation Messages
    app.post('/chat/admin/getAnonymousBusinessChatConversationMessages', async function (req, res) {
        try {
            const { conversationUniqueId } = req.body;

            if (!conversationUniqueId) {
                return res.status(400).json({ success: false, message: 'conversationUniqueId is required' });
            }

            const data = await getAnonymousBusinessChatConversationMessagesQuery(knex, conversationUniqueId);
            res.status(200).json({ success: true, data });
        } catch (error) {
            logger.error("admin-report.controller.js:576 " + error);
            res.status(500).json({ success: false, message: 'Error fetching anonymous Business chat messages for conversation' });
        }
    });

    // Registered Business Chat Conversations
    app.post('/chat/admin/getAllRegisteredBusinessChatConversations', async function (req, res) {
        try {
            const data = await getAllRegisteredBusinessChatConversationsQuery(req.body);
            res.status(200).json({ success: true, data });
        } catch (error) {
            logger.error("admin-report.controller.js:587" + error);
            res.status(500).json({ success: false, message: 'Error fetching registered Business chat conversations' });
        }
    });

    // Registered Business Chat Conversation Messages
    app.post('/chat/admin/getRegisteredBusinessChatConversationMessages', async function (req, res) {
        try {
            const { conversationUniqueId } = req.body;

            if (!conversationUniqueId) {
                return res.status(400).json({ success: false, message: 'conversationUniqueId is required' });
            }

            const data = await getRegisteredBusinessChatConversationMessagesQuery(knex, conversationUniqueId);
            res.status(200).json({ success: true, data });
        } catch (error) {
            logger.error("admin-report.controller.js:604 " + error);
            res.status(500).json({ success: false, message: 'Error fetching registered Business chat messages for conversation' });
        }
    });

    const getAllAnonymousBusinessChatConversationsQuery = async (reqItem) => {
        try {
            // Get all conversations with user details
            const conversations = await knex('businessAnonymousUsersChatConversations as c')
                .leftJoin(
                    'businessAnonymousUsers as u',
                    'c.businessAnonymousUsersUniqueId',
                    'u.businessAnonymousUsersUniqueId'
                )
                .select(
                    'c.businessAnonymousUsersChatConversationsId',
                    'c.businessAnonymousUsersChatConversationsUniqueId',
                    'c.businessAnonymousUsersUniqueId',
                    'c.initatedDateTime',
                    'c.updatedDateTime',
                    'u.businessAnonymousUsersId',
                    'u.name',
                    'u.email',
                    'u.phone',
                    'u.countryCodeId',
                    'u.countryCode'
                )
                .orderBy('c.updatedDateTime', 'desc');

            // Fetch the latest user message for each conversation
            const conversationIds = conversations.map(
                (conv) => conv.businessAnonymousUsersChatConversationsUniqueId
            );

            if (conversationIds.length === 0) return [];

            const lastMessages = await knex('businessAnonymousUsersChatMessages as m')
                .select(
                    'm.businessAnonymousUsersChatConversationsUniqueId',
                    'm.content as lastUserMessage'
                )
                .whereIn('m.businessAnonymousUsersChatConversationsUniqueId', conversationIds)
                .andWhere('m.role', 'user')
                .andWhereRaw(`
                    m.messageDateTime = (
                        SELECT MAX(messageDateTime) 
                        FROM businessAnonymousUsersChatMessages 
                        WHERE role = 'user' 
                        AND businessAnonymousUsersChatConversationsUniqueId = m.businessAnonymousUsersChatConversationsUniqueId
                    )
                `);

            // Map last messages to conversations
            const lastMessageMap = {};
            lastMessages.forEach((msg) => {
                lastMessageMap[msg.businessAnonymousUsersChatConversationsUniqueId] = msg.lastUserMessage;
            });

            // Map to a new array and assign it to a variable
            const conversationsWithMessages = conversations.map((conv) => ({
                ...conv,
                lastUserMessage: lastMessageMap[conv.businessAnonymousUsersChatConversationsUniqueId] || null,
            }));

            // pagination 
            let object = { total: conversationsWithMessages.length, results: conversationsWithMessages };

            if (reqItem.gridProperties.pageNumber) {
                const from = (reqItem.gridProperties.pageNumber * reqItem.gridProperties.pageSize) - reqItem.gridProperties.pageSize;
                const to = (reqItem.gridProperties.pageNumber * reqItem.gridProperties.pageSize);

                const paginatedData = conversationsWithMessages.slice(from, to);
                object = { total: conversationsWithMessages.length, results: paginatedData };
            }

            return object;



        } catch (error) {
            logger.error("admin-report.controller.js:684 " + error);
            throw error;
        }
    };

    const getAnonymousBusinessChatConversationMessagesQuery = async (knex, conversationUniqueId) => {
        try {
            // Fetch all messages for the conversation
            const messages = await knex('businessAnonymousUsersChatMessages as m')
                .select(
                    'm.businessAnonymousUsersChatMessagesId',
                    'm.businessAnonymousUsersChatConversationsUniqueId',
                    'm.role',
                    'm.content',
                    'm.messageDateTime'
                )
                .where('m.businessAnonymousUsersChatConversationsUniqueId', conversationUniqueId)
                .orderBy('m.messageDateTime', 'asc');

            return messages;
        } catch (error) {
            logger.error("admin-report.controller.js:705 " + error);
            throw error;
        }
    };

    const getAllRegisteredBusinessChatConversationsQuery = async (reqItem) => {
        try {
            // Step 1: Fetch all conversations
            const conversations = await knex('businessChatConversations as c')
                .select(
                    'c.businessChatConversationsId',
                    'c.businessChatConversationsUniqueId',
                    'c.businessUserId',
                    'c.initatedDateTime',
                    'c.updatedDateTime'
                )
                .orderBy('c.updatedDateTime', 'desc');

            if (conversations.length === 0) {
                return { total: 0, results: [] };
            }

            // Step 2: Fetch last user message for each conversation
            const conversationIds = conversations.map(
                (conv) => conv.businessChatConversationsUniqueId
            );

            const lastMessages = await knex('businessChatMessages as m')
                .select(
                    'm.businessChatConversationsUniqueId',
                    'm.content as lastUserMessage'
                )
                .whereIn('m.businessChatConversationsUniqueId', conversationIds)
                .andWhere('m.role', 'user')
                .andWhereRaw(`
                m.messageDateTime = (
                    SELECT MAX(messageDateTime) 
                    FROM businessChatMessages 
                    WHERE role = 'user' 
                    AND businessChatConversationsUniqueId = m.businessChatConversationsUniqueId
                )
            `);

            // Step 3: Map last messages to conversations
            const lastMessageMap = {};
            lastMessages.forEach((msg) => {
                lastMessageMap[msg.businessChatConversationsUniqueId] = msg.lastUserMessage;
            });

            // Step 4: Fetch user details from external API
            const uniqueUserIds = [...new Set(
                conversations.map((c) => c.businessUserId).filter(Boolean)
            )];

            let userDataMap = {};
            if (uniqueUserIds.length > 0) {
                try {
                    const response = await axios.post(
                        config.serviceBaseURL.businessApiUrl + 'api/getBusinessUserDetail',
                        { userIds: uniqueUserIds },
                        { headers: { 'Content-Type': 'application/json', "Origin": 'ChatbotBackend' } }
                    );

                    if (response.data?.success && Array.isArray(response.data.data)) {
                        response.data.data.forEach((user) => {
                            userDataMap[user.businessUserId] = user; // match key with conv.businessUserId
                        });
                    }
                } catch (err) {
                    logger.error("admin-report.controller.js:774 " + err);
                }
            }

            // Step 5: Combine conversation, user data, and last user message
            const conversationsWithData = conversations.map((conv) => ({
                ...conv,
                lastUserMessage: lastMessageMap[conv.businessChatConversationsUniqueId] || null,
                ...(userDataMap[conv.businessUserId] || {}) // flatten user data
            }));

            // Step 6: Pagination
            let object = { total: conversationsWithData.length, results: conversationsWithData };

            if (reqItem.gridProperties?.pageNumber && reqItem.gridProperties?.pageSize) {
                const from = (reqItem.gridProperties.pageNumber - 1) * reqItem.gridProperties.pageSize;
                const to = reqItem.gridProperties.pageNumber * reqItem.gridProperties.pageSize;
                const paginatedData = conversationsWithData.slice(from, to);
                object = { total: conversationsWithData.length, results: paginatedData };
            }

            return object;

        } catch (error) {
            logger.error("admin-report.controller.js:798" + error);
            throw error;
        }
    };

    const getRegisteredBusinessChatConversationMessagesQuery = async (knex, conversationUniqueId) => {
        try {
            // Fetch all messages for the conversation
            const messages = await knex('businessChatMessages as m')
                .select(
                    'm.businessChatMessagesId',
                    'm.businessChatConversationsUniqueId',
                    'm.role',
                    'm.content',
                    'm.messageDateTime'
                )
                .where('m.businessChatConversationsUniqueId', conversationUniqueId)
                .orderBy('m.messageDateTime', 'asc');

            return messages;
        } catch (error) {
            logger.error("admin-report.controller.js:819" + error);
            throw error;
        }
    };

    // Chatbot Analytics Dashboard
    app.get('/chat/admin/getAnalyticsDashboard', async function (req, res) {
        try {
            // Very simple analytics aggregation
            // Total Sessions
            const anonCust = await knex('customerAnonymousUsersChatConversations').count('customerAnonymousUsersChatConversationsUniqueId as count').first();
            const regCust = await knex('customerChatConversations').count('customerChatConversationsUniqueId as count').first();
            const anonNot = await knex('notaryAnonymousUsersChatConversations').count('notaryAnonymousUsersChatConversationsUniqueId as count').first();
            const regNot = await knex('notaryChatConversations').count('notaryChatConversationsUniqueId as count').first();
            const anonBus = await knex('businessAnonymousUsersChatConversations').count('businessAnonymousUsersChatConversationsUniqueId as count').first();
            const regBus = await knex('businessChatConversations').count('businessChatConversationsUniqueId as count').first();

            const totalSessions = 
                (anonCust ? parseInt(anonCust.count) : 0) + 
                (regCust ? parseInt(regCust.count) : 0) +
                (anonNot ? parseInt(anonNot.count) : 0) + 
                (regNot ? parseInt(regNot.count) : 0) +
                (anonBus ? parseInt(anonBus.count) : 0) + 
                (regBus ? parseInt(regBus.count) : 0);

            // Total messages could be done similarly, but for brevity we'll mock or just provide the tables
            const stats = {
                totalSessions: totalSessions,
                breakdown: {
                    customer: (anonCust ? parseInt(anonCust.count) : 0) + (regCust ? parseInt(regCust.count) : 0),
                    notary: (anonNot ? parseInt(anonNot.count) : 0) + (regNot ? parseInt(regNot.count) : 0),
                    business: (anonBus ? parseInt(anonBus.count) : 0) + (regBus ? parseInt(regBus.count) : 0),
                }
            };

            res.status(200).json({ success: true, data: stats });
        } catch (error) {
            logger.error("admin-report.controller.js:860 " + error);
            res.status(500).json({ success: false, message: 'Error fetching analytics dashboard' });
        }
    });

};
