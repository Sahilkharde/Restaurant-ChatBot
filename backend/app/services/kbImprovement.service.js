const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');
const config = require('../../config/config');

const openai = new OpenAI({
    apiKey: config.apiKey
});

const jsonFile = path.join(process.cwd(), 'content/structured_kb.json');

/**
 * Analyzes recent chat logs from MSSQL to identify knowledge gaps.
 * @param {object} knex - Knex instance
 * @returns {Promise<object>} - Suggestions JSON
 */
async function getKbImprovements(knex) {
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
                .whereRaw("role LIKE 'user%'")   // matches 'user', 'user:guest', 'user:verified', etc.
                .andWhere('messageDateTime', '>=', thirtyDaysAgo)
                .limit(50);

            allUserMessages.push(...messages.map(m => m.content));
        } catch (err) {
            console.warn(`Could not read table ${table}: ${err.message}`);
        }
    }

    if (allUserMessages.length === 0) {
        return {
            suggestions: [],
            reason: "No recent chat history found in the last 30 days."
        };
    }

    // Read current KB for context
    let kbSummary = "Empty KB";
    if (fs.existsSync(jsonFile)) {
        const kbData = JSON.parse(fs.readFileSync(jsonFile, 'utf-8'));
        kbSummary = kbData.slice(0, 30).map(d => d.content).join('\n');
    }

    const prompt = `
    You are a Knowledge Manager for eNotaryOnCall. 
    Below is a sample of recent USER QUESTIONS and a summary of our CURRENT KNOWLEDGE BASE.
    
    USER QUESTIONS:
    ${allUserMessages.slice(0, 30).join('\n')}

    CURRENT KB SUMMARY:
    ${kbSummary}

    TASK:
    Identify 3-5 recurring questions that are NOT answered by the current KB.
    Return ONLY a JSON array of objects:
    [{ "question": "...", "suggested_answer": "...", "reason": "why this is a gap" }]
    `;

    const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "system", content: prompt }],
        response_format: { type: "json_object" }
    });

    const parsed = JSON.parse(response.choices[0].message.content);
    // Handle both { "suggestions": [...] } and direct array if GPT wrapped it
    return parsed.suggestions || parsed;
}

module.exports = { getKbImprovements };
