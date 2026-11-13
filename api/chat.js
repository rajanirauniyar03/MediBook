// api/chat.js
// Vercel Serverless Function adapter for Veyora AI Assistant & Clinical Proxy

const serverModule = require('../server.js');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    return res.end();
  }

  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: 'Method Not Allowed. Use POST.' }));
  }

  // If Vercel has already parsed req.body:
  if (req.body && typeof req.body === 'object') {
    const { message, history, context, user } = req.body;
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.AI_API_KEY || '';

    if (GEMINI_API_KEY && message) {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
        const aiResponse = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [
                  { text: `System Instructions: You are the Veyora AI Assistant for Metropolitan Central Hospital. Never diagnose or alter prescriptions. Direct emergencies immediately to 911.\n\nUser Question: ${message}` }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.2,
              maxOutputTokens: 600
            }
          })
        });

        if (aiResponse.ok) {
          const data = await aiResponse.json();
          const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (candidateText) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ reply: candidateText, source: 'gemini-1.5-flash' }));
          }
        }
      } catch (e) {
        // Fallback to internal clinical NLP engine
      }
    }

    const nlpResult = serverModule.processNLPFallback(message || '', history || [], context || {}, user || null);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify(nlpResult));
  }

  // Fallback to streaming buffer consumption via server.handleChatAPI
  return serverModule.handleChatAPI(req, res);
};
