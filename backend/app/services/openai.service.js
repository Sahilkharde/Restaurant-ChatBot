const OpenAI = require('openai');
const config = require('../../config/config');
const { searchVector } = require('./faiss.service');

const OPENAI_TIMEOUT_MS = parseInt(process.env.OPENAI_TIMEOUT_MS || '90000', 10);

const openai = new OpenAI({
    apiKey: config.apiKey,
    timeout: OPENAI_TIMEOUT_MS,
    maxRetries: 1
});

async function getOpenAIReply(conversation, kbType, userStage = 'guest') {
    const lastUserMessage = conversation.length > 0 && conversation[conversation.length - 1].role === 'user' 
        ? conversation[conversation.length - 1].content 
        : '';

    let kbContentContext = '';
    let fallbackTriggered = false;

    if (lastUserMessage) {
        try {
            const chunksForKb = await searchVector(lastUserMessage, 5, kbType);
            const topChunk = chunksForKb.length > 0 ? chunksForKb[0] : null;
            const chunkType = topChunk ? topChunk.type : ''; 
            const chunkFile = topChunk ? topChunk.file : '';

            // Task 3: Multi-File & Category Security Gates
            const ADMIN_FILES = ['adminKb.txt'];
            const BUSINESS_FILES = ['businessKb.txt'];
            const NOTARY_FILES = ['notaryKb.txt'];
            const RON_SUPPORT_FILES = ['customerRONSupportKb.txt'];
            const IPEN_SUPPORT_FILES = ['customerIpenSupportKb.txt'];

            const GUEST_RESTRICTED_CATS = ['[Account - Customer Side]', '[Notarization Process]', '[Support & Access]', '[File Size]', '[Documents]', '[Technical Requirements]'];
            const LOGGED_IN_RESTRICTED_CATS = ['[Notarization Process]', '[Reports]', '[Download]'];
            const VERIFIED_RESTRICTED_CATS = ['[Reports]', '[Download]'];

            let blockMessage = null;

            // 1. Role-Based Blocking (Admin/Notary/Business files are for internal use only)
            if (kbType === 'customer' || kbType === 'kb') {
                if (ADMIN_FILES.includes(chunkFile)) {
                    blockMessage = `This information is for eNotary On Call staff only. If you need assistance, please contact support@enotaryoncall.com.`;
                } else if (NOTARY_FILES.includes(chunkFile)) {
                    blockMessage = `This instruction is for Notaries. If you are a notary, please log in to your Notary Dashboard. If you are a customer, please visit: <a href="https://app.enotaryoncall.com/login" style="color: blue;">Customer Login</a>.`;
                } else if (BUSINESS_FILES.includes(chunkFile)) {
                    blockMessage = `This feature is for Business accounts. Please <a href="https://business.enotaryoncall.com/signup" style="color: blue;">Sign Up for a Business Account</a> to access this information.`;
                }
            }

            // 2. Stage-Based File Blocking (For RON/IPEN Support)
            if (!blockMessage) {
                if (userStage === 'guest' && (RON_SUPPORT_FILES.includes(chunkFile) || IPEN_SUPPORT_FILES.includes(chunkFile))) {
                    blockMessage = `To access detailed notarization support (RON/IPEN), you must first create an account. Please <a href="https://app.enotaryoncall.com/signup" style="color: blue;">Sign Up here</a>.`;
                } else if (userStage === 'logged-in' && RON_SUPPORT_FILES.includes(chunkFile)) {
                    blockMessage = `To access RON session support, you must first complete your identity verification. Please visit your dashboard and click "Complete Verification".`;
                }
            }

            // 3. Category-Based Blocking (Within files like customerKb.txt)
            if (!blockMessage) {
                if (userStage === 'guest' && GUEST_RESTRICTED_CATS.includes(chunkType)) {
                    const msgLow = lastUserMessage.toLowerCase();
                    const intentLow = (topChunk.intent || '').toLowerCase();
                    
                    // EXCEPTIONS: Allow guests to see certain info even if it's in a blocked category
                    const isAllowedGeneral = intentLow.includes('registration') || 
                                           msgLow.includes('cost') || 
                                           msgLow.includes('fee') || 
                                           (chunkType === '[Documents]' && (msgLow.includes('what documents') || msgLow.includes('accepted documents')));

                    if (!isAllowedGeneral) {
                        blockMessage = `To access account settings, technical requirements, or session-specific instructions, you must first create an account. Please <a href="https://app.enotaryoncall.com/signup" style="color: blue;">Sign Up here</a> to get started.`;
                    }
                } 
                else if (userStage === 'logged-in' && LOGGED_IN_RESTRICTED_CATS.includes(chunkType)) {
                    blockMessage = `To proceed with your notarization, please complete your identity verification first in your dashboard.`;
                }
                else if ((userStage === 'verified' || userStage === 'in-session') && VERIFIED_RESTRICTED_CATS.includes(chunkType)) {
                    blockMessage = `Your completed documents will be available for download once your notarization session is finished.`;
                }
            }

            if (blockMessage) {
                console.log(`[Multi-File Gate] BLOCKED ${userStage.toUpperCase()} ACCESS TO: ${chunkFile} (${chunkType})`);
                return blockMessage;
            }
            
            // Backup - Text-based keywords
            const msgLower = lastUserMessage.toLowerCase();
            if (userStage === 'guest' && ['upload', 'kba', 'download my', 'my account'].some(kw => msgLower.includes(kw))) {
                 return `To access these features, you must first create an account. Please <a href="https://app.enotaryoncall.com/signup" style="color: blue;">Sign Up here</a>.`;
            }

            const greetings = ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening', 'hola'];
            const isGreeting = greetings.some(g => lastUserMessage.toLowerCase().trim() === g || lastUserMessage.toLowerCase().trim().startsWith(g + ' '));

            if (isGreeting) {
                console.log(`[AI Request] GREETING DETECTED: "${lastUserMessage}"`);
                kbContentContext = `MANDATORY RESPONSE FOR GREETING: "Welcome to eNotary On Call — We're here to help. Let us know how we can assist you today."`;
                fallbackTriggered = false;
            } else {
                // Reuse first vector search (same query) — avoids a second embedding API call and long delay
                let relevantChunks = [...chunksForKb];

                // CRITICAL: Filter context for Guests to prevent leaking "logged-in" features
                if (userStage === 'guest') {
                    const restrictedKeywords = ['upload', 'kba', 'verification', 'reports', 'download', 'dashboard'];
                    relevantChunks = relevantChunks.filter(chunk => {
                        const contentLower = chunk.content.toLowerCase();
                        return !restrictedKeywords.some(kw => contentLower.includes(kw));
                    });
                }

                // Refined Task 6: Stricter distance threshold (0.42) for better fallback triggering
                if (relevantChunks.length > 0 && relevantChunks[0].distance > 0.42) {
                    fallbackTriggered = true;
                } else {
                    kbContentContext = relevantChunks.map((chunk, idx) => {
                        const metadata = `[Category: ${chunk.type || 'General'}, Intent: ${chunk.intent || 'General'}]`;
                        return `--- Chunk ${idx + 1} ${metadata} ---\n${chunk.content}`;
                    }).join('\n\n');
                }
            }
        } catch (err) {
            console.error('Vector Search Error:', err);
            kbContentContext = "No specific context retrieved.";
        }
    }

    console.log(`[AI Request] Stage: ${userStage} | Role: ${kbType} | Query: ${lastUserMessage}`);

    const STAGE_PROTOCOLS = {
        'guest': {
            mission: 'Answer general FAQs, pricing, company info, and registration help ONLY.',
            protocol: 'MANDATORY: If the user asks about account features (uploads, verification, downloads, billing), you MUST REFUSE to provide steps and tell them to register first. DO NOT share any "logged-in" instructions.'
        },
        'logged-in': {
            mission: 'Guide through document upload and ID verification.',
            protocol: 'Help with account setup only. If they ask about session links or downloads, inform them these are available after session completion.'
        },
        'verified': {
            mission: 'Prepare for the live session (Waiting room, tech check).',
            protocol: 'Focus on session readiness. MANDATORY: Mention that all session links are password-protected.'
        },
        'in-session': {
            mission: 'Live technical support during the call.',
            protocol: 'Troubleshoot real-time issues. !IMPORTANT: Always add: "For your security, this session link is protected by your account password."'
        },
        'completed': {
            mission: 'Help with Downloads, Receipts, and Post-Session Utility.',
            protocol: 'Provide download steps. !IMPORTANT: You MUST include this exact sentence: "Note: Your notarized document links are securely encrypted and protected by your login password."'
        }
    };

    const protocol = STAGE_PROTOCOLS[userStage] || STAGE_PROTOCOLS['guest'];

    let systemPrompt = '';
    if (fallbackTriggered) {
        systemPrompt = `You are the eNotaryOnCall AI. 
        The user asked something completely unrelated to notarization.
        Do NOT answer their question. Refuse politely and provide support details: support@enotaryoncall.com / +1 (954) 998-2469.`;
    } else {
        systemPrompt = `You are the eNotary On Call Expert AI. 

        ### MANDATORY SECURITY PROTOCOL: ${userStage.toUpperCase()} MODE
        - **Current User Stage**: ${userStage}
        - **Your Mission**: ${protocol.mission}
        - **Your Strict Instruction**: ${protocol.protocol}

        ### KNOWLEDGE BASE CONTEXT:
        ${kbContentContext || 'No specific KB context found.'}

        ### STAGE-SPECIFIC RULES (UNBENDABLE):
        1. **IF GREETING**: If the user just says "hi", "hello", or "hey", you MUST respond with: "Welcome to eNotary On Call — We're here to help. Let us know how we can assist you today."
        2. **IF GUEST (CRITICAL)**: If the userStage is 'guest', and the user asks about "Uploading", "ID Verification", "KBA", or "Reports", you MUST IGNORE the Knowledge Base context above and only state that these features require an account. Redirect them to: <a href="https://app.enotaryoncall.com/signup" style="color: blue; text-decoration: underline;">Sign Up</a>.
        3. **PASSWORD WARNING**: If the user is ${userStage === 'completed' ? 'COMPLETED' : 'IN-SESSION' || 'VERIFIED'}, you MUST append a password-protection reminder to your answer.
        4. **DOMAIN LIMIT**: Only answer notarization-related questions (except for greetings).
        5. **IF UNKNOWN**: If the KB context above doesn't have the answer, say "I don't have that info in my records, please contact support@enotaryoncall.com." Do NOT guess.

        ### VISUAL FLOW: RON PROCESS
        If the user asks about the "RON process", "How does it work", "steps to notarize", or "how to get started", you MUST format your entire response as a flow using EXACTLY this XML tag format (no markdown, no prose):
        <flow>Step 1: [Identity Verification] Describe KBA/IDV in 1 sentence|Step 2: [Document Upload] Describe uploading in 1 sentence|Step 3: [Meet Notary] Describe live session in 1 sentence|Step 4: [Sign & Complete] Describe signing in 1 sentence|Step 5: [Download] Describe downloading notarized doc in 1 sentence</flow>
        Replace the bracketed placeholders with actual content. Use | as the step separator. Do NOT add anything outside the <flow> tags for these questions.`;
    }

    const messages = [
        { role: "system", content: systemPrompt },
        ...conversation
    ];

    const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: messages,
        temperature: 0.3,
        max_tokens: 600,
    });

    return formatMessage(completion.choices[0].message.content);
}

function formatMessage(message) {
    message = message.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>'); // Bold
    message = message.replace(/\*(.*?)\*/g, '<i>$1</i>'); // Italics
    message = message.replace(/~~(.*?)~~/g, '<s>$1</s>'); // Strikethrough
    message = message.replace(/`(.*?)`/g, '<code>$1</code>'); // Inline Code
    message = message.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>'); // Code block
    message = message.replace(/\[([^\]]+)\]\((.*?)\)/g, '<a href="$2">$1</a>'); // Links
    message = message.replace(/!\[([^\]]+)\]\((.*?)\)/g, '<img src="$2" alt="$1">'); // Images
    message = message.replace(/^> (.*)$/gm, '<blockquote>$1</blockquote>'); // Blockquote
    message = message.replace(/(?:---|\*\*\*)/g, '<hr />'); // Horizontal rule

    // Remove raw <flow> tags if they somehow leak (Angular handles rendering)
    message = message.replace(/<flow>.*?<\/flow>/gs, (match) => match); // pass-through
    
    return message;
}

module.exports = { getOpenAIReply };
