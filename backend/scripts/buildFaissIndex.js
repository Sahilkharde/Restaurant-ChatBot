const fs = require('fs');
const path = require('path');
const { IndexFlatL2 } = require('faiss-node');
const OpenAI = require('openai');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const config = require('../config/config');

const openai = new OpenAI({
    apiKey: config.apiKey
});

const contentDir = path.join(__dirname, '../content');
const jsonFile = path.join(contentDir, 'structured_kb.json');
const indexFile = path.join(contentDir, 'faiss.index');

async function getEmbeddings(texts) {
    // Batch embeddings up to 100 at a time to stay under rate limits
    const embeddings = [];
    const batchSize = 100;
    
    for (let i = 0; i < texts.length; i += batchSize) {
        const batch = texts.slice(i, i + batchSize);
        console.log(`Processing batch ${i / batchSize + 1} of ${Math.ceil(texts.length / batchSize)}`);
        
        const response = await openai.embeddings.create({
            model: "text-embedding-ada-002",
            input: batch
        });
        
        embeddings.push(...response.data.map(d => d.embedding));
    }
    return embeddings;
}

async function buildIndex() {
    if (!fs.existsSync(jsonFile)) {
        console.error('structured_kb.json not found. Run convertKbToJson.js first.');
        process.exit(1);
    }

    const kbData = JSON.parse(fs.readFileSync(jsonFile, 'utf-8'));
    if (kbData.length === 0) {
        console.log('No data to index.');
        return;
    }

    console.log(`Generating embeddings for ${kbData.length} structured chunks...`);
    // Richer embedding context! Includes the extracted intent, type, and role
    const textsToEmbed = kbData.map(item => `Role Requirements: ${item.role}\nType: ${item.type}\nIntent Tag: ${item.intent}\nContent: ${item.content}`);
    
    // Get embeddings
    const embeddings = await getEmbeddings(textsToEmbed);
    
    const dimension = embeddings[0].length; // 1536 for text-embedding-ada-002
    console.log(`Initializing FAISS index with dimension ${dimension}...`);
    
    const index = new IndexFlatL2(dimension);
    
    // Flatten embeddings list
    const flattenedEmbeddings = embeddings.flat();
    
    // Add to index
    index.add(flattenedEmbeddings);
    
    // Save index to file
    index.write(indexFile);
    console.log(`Saved FAISS index to ${indexFile}.`);
}

buildIndex().catch(console.error);
