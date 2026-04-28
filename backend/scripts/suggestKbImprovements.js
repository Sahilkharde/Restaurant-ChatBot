const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const config = require('../config/config');
const knex = require('knex')(config.db.development);

const openai = new OpenAI({
    apiKey: config.apiKey
});

const jsonFile = path.join(__dirname, '../content/structured_kb.json');
const reportFile = path.join(__dirname, '../content/suggested_kb_updates.json');

async function analyzeGaps() {
    console.log('--- KB Improvement Loop Starting ---');

    // 1. Fetch recent user messages (last 30 days)
    console.log('Fetching recent chat logs from MSSQL...');
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const tables = [
        'customerChatMessages',
        'customerAnonymousUsersChatMessages',
        'notaryChatMessages',
        'businessChatMessages'
    ];

    let allUserMessages = [];

    for (const table of tables) {
        try {
            const hasTable = await knex.schema.hasTable(table);
            if (!hasTable) continue;

            const messages = await knex(table)
                .select('content')
                .where('role', 'user')
                .andWhere('messageDateTime', '>=', thirtyDaysAgo)
                .limit(100);

            allUserMessages.push(...messages.map(m => m.content));
        } catch (err) {
            console.warn(`Could not read table ${table}: ${err.message}`);
        }
    }

    if (allUserMessages.length === 0) {
        console.log('No recent user messages found in database.');
        process.exit(0);
    }

    console.log(`Analyzing ${allUserMessages.length} user queries against current KB...`);

    // 2. Read current KB summaries
    const kbData = JSON.parse(fs.readFileSync(jsonFile, 'utf-8'));
    const kbSummary = kbData.slice(0, 50).map(d => d.content).join('\n'); // Simplified summary

    // 3. Ask GPT to find gaps
    const prompt = `
    You are a Knowledge Manager for eNotaryOnCall. 
    Below is a sample of recent USER QUESTIONS and a summary of our CURRENT KNOWLEDGE BASE.
    
    USER QUESTIONS:
    ${allUserMessages.slice(0, 50).join('\n')}

    CURRENT KB SUMMARY:
    ${kbSummary}

    TASK:
    Identify 3-5 recurring questions that are NOT answered by the current KB.
    Format your answer as a JSON array of objects: [{ "question": "...", "suggested_answer": "...", "reason": "..." }]
    `;

    const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "system", content: prompt }],
        response_format: { type: "json_object" }
    });

    const suggestions = response.choices[0].message.content;
    fs.writeFileSync(reportFile, suggestions);

    console.log(`--- Analysis Complete ---`);
    console.log(`Suggested updates saved to: ${reportFile}`);

    await knex.destroy();
}

analyzeGaps().catch(async (err) => {
    console.error(err);
    await knex.destroy();
});
