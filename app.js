// JARVIS Trading Platform - Complete Rebuild with Gemini AI
// JARVIS Trading Platform - Complete with Cloudflare Worker
// State Management
let stockPortfolio = [];
let futuresContracts = [{ symbol: 'CL', name: 'Crude Oil', contractSize: 1000, tickValue: 10 }];
@@ -8,18 +8,11 @@ let lastFuturesRefresh = null;
let lastNewsRefresh = null;
let chatHistory = [];

// API Keys - GEMINI key stored safely
// API Keys
const FINNHUB_API_KEY = 'd8gqff9r01qhjpmp75p0d8gqff9r01qhjpmp75pg';

// Get Gemini API key from localStorage
function getGeminiKey() {
  let storedKey = localStorage.getItem('geminiApiKey');
  if (!storedKey) {
    storedKey = 'AQ.Ab8RN6KE7mzv976ME3Si1KRLGo2vI9U6LVk0jJbZpFweUCf84A';
    localStorage.setItem('geminiApiKey', storedKey);
  }
  return storedKey;
}
// Cloudflare Worker URL (Gemini API key is safe on Cloudflare!)
const JARVIS_API_URL = 'https://lingering-credit-9e25.kindredjake24.workers.dev';

// Initialize platform
document.addEventListener('DOMContentLoaded', () => {
@@ -614,7 +607,7 @@ async function fetchStockProfile(symbol) {
}

// ============================================
// JARVIS AI CHAT WITH GEMINI
// JARVIS AI CHAT WITH CLOUDFLARE WORKER
// ============================================

function initJARVISChat() {
@@ -628,7 +621,7 @@ function initJARVISChat() {
         <div style="width: 50px; height: 50px; background: radial-gradient(circle, #00d9ff, #0088ff); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2rem; box-shadow: 0 0 20px #00d9ff; margin-right: 15px; flex-shrink: 0;">🤖</div>
         <div style="flex: 1;">
           <div style="color: #00d9ff; font-weight: bold; margin-bottom: 5px;">JARVIS AI Assistant</div>
            <div style="color: #00d9ff; line-height: 1.6;">Hello! I'm JARVIS, your AI trading assistant powered by Google Gemini. I can help you with stock analysis, market news, portfolio advice, and trading strategies. What would you like to know?</div>
            <div style="color: #00d9ff; line-height: 1.6;">Hello! I'm JARVIS, your AI trading assistant powered by Google Gemini via Cloudflare. I can help you with stock analysis, market news, portfolio advice, and trading strategies. What would you like to know?</div>
         </div>
       </div>
     </div>
@@ -665,24 +658,28 @@ async function sendJARVISMessage() {
messages.scrollTop = messages.scrollHeight;

try {
    const systemPrompt = `You are JARVIS, a sophisticated AI trading assistant. Help users with stock analysis, portfolio management, market news, trading strategies, and financial education. Be concise, accurate, and provide actionable insights.`;
    
    const conversationHistory = chatHistory.slice(-10).map(msg => `${msg.role === 'user' ? 'User' : 'JARVIS'}: ${msg.content}`).join('\n');
    const fullPrompt = `${systemPrompt}\n\nConversation:\n${conversationHistory}\n\nUser: ${userMessage}\nJARVIS:`;
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${getGeminiKey()}`, {
    const response = await fetch(JARVIS_API_URL, {
method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer jarvis-trading'
      },
body: JSON.stringify({
        contents: [{ parts: [{ text: fullPrompt }] }],
        generationConfig: { temperature: 0.7, topK: 40, topP: 0.95, maxOutputTokens: 2048 }
        prompt: userMessage
})
});

    if (!response.ok) throw new Error(`API Error: ${response.status}`);
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

const data = await response.json();
    const aiResponse = data.candidates[0].content.parts[0].text;
    
    if (!data.success) {
      throw new Error(data.error);
    }
    
    const aiResponse = data.response;

chatHistory.push({ role: 'assistant', content: aiResponse });
document.getElementById(loadingId).remove();
