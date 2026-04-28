process.env.DB_SERVER = process.env.DB_SERVER;
const config = require('../config/config');
// Load env via the app's standard pattern
const path = require('path');
require('fs').readFileSync(path.join(__dirname, '../.env'), 'utf8').split('\n').forEach(line => {
    const [key, ...vals] = line.split('=');
    if (key && vals.length) process.env[key.trim()] = vals.join('=').trim();
});

const knex = require('knex')({
    client: 'mssql',
    connection: {
        server: process.env.DB_SERVER,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE,
        options: { trustServerCertificate: true }
    }
});

async function checkColumns() {
    const tables = [
        'customerAnonymousUsersChatMessages',
        'customerChatMessages',
        'customerAnonymousUsersChatConversations',
        'customerChatConversations'
    ];
    for (const t of tables) {
        try {
            const cols = await knex(t).columnInfo();
            console.log(`\n[${t}]\n  Columns: ${Object.keys(cols).join(', ')}`);
        } catch(e) {
            console.log(`\n[${t}] ERROR:`, e.message);
        }
    }
    await knex.destroy();
}

checkColumns().catch(e => { console.error(e.message); knex.destroy(); });
