const { getOpenAIReply } = require('../services/openai.service'); // ✅ Import service
const {
    v4: uuidv4
} = require('uuid');
module.exports = function (app, knex, acl) {


  // app.post('/chat/notary', async function (req, res, next) {
  //   const { conversation } = req.body;

  //   try {
  //     const botReply = await getOpenAIReply(conversation, 'notary');
  //     res.json({ reply: botReply });
  //   } catch (error) {
  //     console.error('Error in chat controller:', error.response?.data || error.message);
  //     res.status(500).json({ reply: 'Sorry, something went wrong with the AI server.' });
  //   }
  // });

  // app.post('/chat/business', async function (req, res, next) {
  //   const { conversation } = req.body;

  //   try {
  //     const botReply = await getOpenAIReply(conversation, 'business');
  //     res.json({ reply: botReply });
  //   } catch (error) {
  //     console.error('Error in chat controller:', error.response?.data || error.message);
  //     res.status(500).json({ reply: 'Sorry, something went wrong with the AI server.' });
  //   }
  // });

   const { getKbImprovements } = require('../services/kbImprovement.service');

   /**
    * Helper to ensure a conversation record exists in the database.
    * This is what shows up in the Admin Analytics (Task 7).
    */
   async function ensureConversationExists(knex, conversationUniqueId, kbType, userStage) {
     try {
       let convTable = 'customerChatConversations';
       let idColumn = 'customerChatConversationsUniqueId';
       
       if (kbType === 'business') {
         convTable = 'businessChatConversations';
         idColumn = 'businessChatConversationsUniqueId';
       } else if (kbType === 'notary') {
         convTable = 'notaryChatConversations';
         idColumn = 'notaryChatConversationsUniqueId';
       } else if (userStage === 'guest') {
         convTable = 'customerAnonymousUsersChatConversations';
         idColumn = 'customerAnonymousUsersChatConversationsUniqueId';
       }

       const existing = await knex(convTable).where(idColumn, conversationUniqueId).first();
       if (!existing) {
         console.log(`[Task 7] Creating new conversation: ${conversationUniqueId} in ${convTable}`);
         const insertData = {
           initatedDateTime: new Date(),
           updatedDateTime: new Date(),
           conversationTitle: `Chat at ${new Date().toLocaleString()}`
         };
         insertData[idColumn] = conversationUniqueId;
         
         // Add dummy association ID for anonymous users if needed
         if (userStage === 'guest' && convTable === 'customerAnonymousUsersChatConversations') {
            insertData['customerAnonymousUsersUniqueId'] = 'GUEST-' + uuidv4().substring(0, 8);
         }

         await knex(convTable).insert(insertData);
       } else {
         await knex(convTable).where(idColumn, conversationUniqueId).update({ updatedDateTime: new Date() });
       }
     } catch (err) {
       console.error('Error ensuring conversation exists:', err.message);
     }
   }

   /**
    * Helper to save chat messages to MSSQL
    */
   async function saveToDb(knex, role, content, kbType, userStage, conversationUniqueId) {
     try {
       let tableName = 'customerChatMessages';
       let idColumn = 'customerChatConversationsUniqueId';

       if (kbType === 'business') {
         tableName = 'businessChatMessages';
         idColumn = 'businessChatConversationsUniqueId';
       } else if (kbType === 'notary') {
         tableName = 'notaryChatMessages';
         idColumn = 'notaryChatConversationsUniqueId';
       } else if (kbType === 'kb' || userStage === 'guest') {
         // Guest users or general KB chat
         if (userStage === 'guest') {
           tableName = 'customerAnonymousUsersChatMessages';
           idColumn = 'customerAnonymousUsersChatConversationsUniqueId';
         } else {
           tableName = 'customerChatMessages';
           idColumn = 'customerChatConversationsUniqueId';
         }
       }

       const hasTable = await knex.schema.hasTable(tableName);
       if (!hasTable) {
         console.warn(`Table ${tableName} not found. Skipping DB log.`);
         return;
       }

       const insertData = {
         content: content,
         // Task 5: Tag role with userStage for per-stage analytics (e.g. 'user:guest', 'assistant:verified')
         role: userStage ? `${role}:${userStage}` : role,
         messageDateTime: new Date()
       };
       
       // Ensure the unique ID is NOT null before inserting
       if (conversationUniqueId) {
         insertData[idColumn] = conversationUniqueId;
       } else {
         console.error(`[CRITICAL] Missing conversationUniqueId for table ${tableName}`);
         return; // Don't allow NULL insert if column is NOT NULL
       }

       await knex(tableName).insert(insertData);
       console.log(`[Task 5] Saved ${role}:${userStage} to ${tableName}`);
     } catch (err) {
       console.error('Error saving message to MSSQL:', err.message);
     }
   }

   app.post('/chat', async function (req, res, next) {
    const { conversation, userStage, conversationUniqueId } = req.body;
    const stage = userStage || 'guest';
    const convId = conversationUniqueId || uuidv4();

    try {
      // Ensure conversation row exists (increments dashboard analytics)
      await ensureConversationExists(knex, convId, 'kb', stage);

      const lastMessage = conversation[conversation.length - 1];
      if (lastMessage && lastMessage.role === 'user') {
        await saveToDb(knex, 'user', lastMessage.content, 'kb', stage, convId);
      }

      const botReply = await getOpenAIReply(conversation, 'kb', stage);
      
      await saveToDb(knex, 'assistant', botReply, 'kb', stage, convId);

      res.json({ reply: botReply, conversationUniqueId: convId });
    } catch (error) {
      console.error('Error in chat controller:', error.response?.data || error.message);
      res.status(500).json({ reply: 'Sorry, something went wrong with the AI server.' });
    }
  });

   app.post('/chat/admin', async function (req, res, next) {
    const { conversation, userStage, conversationUniqueId } = req.body;
    const stage = userStage || 'admin';
    const convId = conversationUniqueId || uuidv4();

    try {
      await ensureConversationExists(knex, convId, 'admin', stage);

      const lastMessage = conversation[conversation.length - 1];
      if (lastMessage && lastMessage.role === 'user') {
        await saveToDb(knex, 'user', lastMessage.content, 'admin', stage, convId);
      }

      const botReply = await getOpenAIReply(conversation, 'admin', stage);

      await saveToDb(knex, 'assistant', botReply, 'admin', stage, convId);

      res.json({ reply: botReply, conversationUniqueId: convId });
    } catch (error) {
      console.error('Error in chat controller:', error.response?.data || error.message);
      res.status(500).json({ reply: 'Sorry, something went wrong with the AI server.' });
    }
  });

  app.get('/chat/admin/getKbSuggestions', async function (req, res, next) {
    try {
      const suggestions = await getKbImprovements(knex);
      res.json(suggestions);
    } catch (error) {
      console.error('Error in KB Improvement Loop:', error.message);
      res.status(500).json({ reply: 'Could not fetch KB suggestions.' });
    }
  });
}






// // Controller Function
// async function handleCustomerChat(req, res) {
//   const { conversation } = req.body;

//   try {
//     const botReply = await getOpenAIReply(conversation, 'customer');
//     res.json({ reply: botReply });
//   } catch (error) {
//     console.error('Error in chat controller:', error.response?.data || error.message);
//     res.status(500).json({ reply: 'Sorry, something went wrong with the AI server.' });
//   }
// }

// async function handleBusinessChat(req, res) {
//   const { conversation } = req.body;

//   try {
//     const botReply = await getOpenAIReply(conversation, 'business');
//     res.json({ reply: botReply });
//   } catch (error) {
//     console.error('Error in chat controller:', error.response?.data || error.message);
//     res.status(500).json({ reply: 'Sorry, something went wrong with the AI server.' });
//   }
// }

// async function handleNotaryChat(req, res) {
//   const { conversation } = req.body;

//   try {
//     const botReply = await getOpenAIReply(conversation, 'notary');
//     res.json({ reply: botReply });
//   } catch (error) {
//     console.error('Error in chat controller:', error.response?.data || error.message);
//     res.status(500).json({ reply: 'Sorry, something went wrong with the AI server.' });
//   }
// }


// module.exports = {
//   handleCustomerChat,
//   handleBusinessChat,
//   handleNotaryChat
// };
