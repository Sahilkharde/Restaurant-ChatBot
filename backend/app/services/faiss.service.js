const fs = require('fs');
const path = require('path');
const { IndexFlatL2 } = require('faiss-node');
const OpenAI = require('openai');
const config = require('../../config/config');

const OPENAI_TIMEOUT_MS = parseInt(process.env.OPENAI_TIMEOUT_MS || '90000', 10);

const openai = new OpenAI({
    apiKey: config.apiKey,
    timeout: OPENAI_TIMEOUT_MS,
    maxRetries: 1
});

const contentDir = path.join(process.cwd(), 'content');
const indexFile = path.join(contentDir, 'faiss.index');
const jsonFile = path.join(contentDir, 'structured_kb.json');

let index = null;
let kbData = null;

// Initialize FAISS index
function initFaiss() {
    if (!fs.existsSync(indexFile) || !fs.existsSync(jsonFile)) {
        console.error('FAISS index or structured_kb.json not found. Run buildFaissIndex.js first.');
        return false;
    }

    try {
        kbData = JSON.parse(fs.readFileSync(jsonFile, 'utf-8'));
        index = IndexFlatL2.read(indexFile);
        console.log(`FAISS index loaded successfully with ${index.ntotal()} vectors.`);
        return true;
    } catch (err) {
        console.error('Error loading FAISS index:', err);
        return false;
    }
}

// Search function
async function searchVector(query, topK = 5, roleFilter = null) {
    if (!index || !kbData) {
        if (!initFaiss()) {
            throw new Error('FAISS index not initialized');
        }
    }

    // 1. Embed query
    const response = await openai.embeddings.create({
        model: "text-embedding-ada-002",
        input: query
    });
    const queryEmbedding = response.data[0].embedding;

    // 2. Search FAISS index
    const results = index.search(queryEmbedding, topK * 3); // fetch more to allow filtering
    
    // faiss-node search returns { labels, distances } as flat arrays
    const labels = results.labels;
    const distances = results.distances;
    
    let matchedChunks = [];
    
    for (let i = 0; i < labels.length; i++) {
        const idx = labels[i];
        if (idx !== -1 && idx < kbData.length) {
            const doc = kbData[idx];
            
            // Apply role filter if specified (e.g., 'customer', 'admin', 'business')
            // Special case: if roleFilter is 'kb', it should search across all roles.
            if (roleFilter && roleFilter !== 'kb' && doc.role && doc.role !== roleFilter) {
                continue;
            }
            
            matchedChunks.push({
                content: doc.content,
                role: doc.role,
                intent: doc.intent,
                type: doc.type,
                distance: distances[i] // L2 distance (lower is better)
            });
            
            if (matchedChunks.length >= topK) {
                break;
            }
        }
    }
    
    return matchedChunks;
}

module.exports = {
    initFaiss,
    searchVector
};
