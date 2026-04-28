const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const contentDir = path.join(__dirname, '../content');
const outputFile = path.join(contentDir, 'structured_kb.json');

function processFiles() {
    const files = fs.readdirSync(contentDir).filter(f => f.endsWith('.txt'));
    const structuredData = [];

    for (const file of files) {
        const filePath = path.join(contentDir, file);
        const text = fs.readFileSync(filePath, 'utf-8');
        
        let currentRole = file.match(/([a-zA-Z]+)Kb\.txt$/) ? file.match(/([a-zA-Z]+)Kb\.txt$/)[1].toLowerCase() : 'general';
        let currentIntent = 'general';
        let currentType = 'flow';

        // Split by newlines to parse statefully
        const lines = text.split('\n');
        
        let buffer = '';
        let currentQuestion = '';

        const flushBuffer = () => {
            if (buffer.trim().length > 10) {
                structuredData.push({
                    id: uuidv4(),
                    file: file,
                    role: currentRole,
                    intent: currentIntent,
                    type: currentType,
                    content: buffer.trim()
                });
            }
            buffer = '';
            currentQuestion = '';
        };

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) {
                // Empty line might mean end of a Q/A block or paragraph
                if (currentType === 'faq' && buffer) {
                    flushBuffer();
                } else if (currentType !== 'faq' && buffer) {
                    buffer += '\n\n';
                }
                continue;
            }

            // Check for Role Headers: [Customer FAQ]
            const roleMatch = line.match(/^\[(Customer|Notary|Business) FAQ\]$/i);
            if (roleMatch) {
                flushBuffer();
                currentRole = roleMatch[1].toLowerCase();
                currentType = 'faq';
                continue;
            }

            // Check for Intent Headers: [Fees], [Payments]
            const intentMatch = line.match(/^\[(.*?)\]$/);
            if (intentMatch && !line.match(/^\[IMPORTANT\]$/i)) {
                flushBuffer();
                currentIntent = intentMatch[1].toLowerCase();
                continue;
            }

            // Check for QA Pattern: "Q: What is..." or "Question:..."
            const qMatch = line.match(/^(?:Q|Question):\s*(.*)$/i);
            if (qMatch) {
                flushBuffer();
                currentType = 'faq';
                currentQuestion = qMatch[1];
                buffer = `Question: ${currentQuestion}\n`;
                continue;
            }

            // Check for Answer Pattern
            const aMatch = line.match(/^(?:A|Answer):\s*(.*)$/i);
            if (aMatch) {
                buffer += `Answer: ${aMatch[1]}\n`;
                // Often an answer spans multiple lines, we wait for empty line to flush
                continue;
            }

            // Otherwise, it's just continuation text or a flow block
            if (line.match(/^\[IMPORTANT\]$/i) || line.startsWith('---')) {
                flushBuffer();
                currentType = 'flow';
                continue;
            }

            buffer += line + '\n';
        }

        // Flush remaining buffer at EOF
        flushBuffer();
    }

    fs.writeFileSync(outputFile, JSON.stringify(structuredData, null, 2));
    console.log(`Successfully converted ${files.length} KB files into ${structuredData.length} structurally tagged RAG chunks.`);
}

processFiles();
