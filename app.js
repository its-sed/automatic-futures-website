// NEW: Use Cloudflare Worker (API key is safe on Cloudflare)
const JARVIS_API_URL = 'https://jarvis-gemini-api.your-username.workers.dev'; // REPLACE WITH YOUR URL

function getGeminiKey() {
  // No need for key - it's on Cloudflare!
  return null;
}

async function sendJARVISMessage() {
  const input = document.getElementById('jarvisChatInput');
  const messages = document.getElementById('jarvisChatMessages');
  const sendBtn = document.getElementById('sendJARVISBtn');
  
  const userMessage = input.value.trim();
  if (!userMessage) return;
  
  input.disabled = true;
  sendBtn.disabled = true;
  sendBtn.textContent = '...';
  
  // Add user message
  messages.innerHTML += `<div style="display: flex; margin-bottom: 20px; justify-content: flex-end;"><div style="flex: 1; max-width: 70%; margin-left: 15px;"><div style="color: #0088ff; font-weight: bold; margin-bottom: 5px; text-align: right;">You</div><div style="background: rgba(0, 217, 255, 0.1); border: 1px solid rgba(0, 217, 255, 0.3); border-radius: 10px; padding: 15px; color: #00d9ff; line-height: 1.6;">${escapeHtml(userMessage)}</div></div><div style="width: 50px; height: 50px; background: radial-gradient(circle, #00ffff, #00d9ff); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; box-shadow: 0 0 20px #00ffff; margin-left: 15px; flex-shrink: 0;">👤</div></div>`;
  
  chatHistory.push({ role: 'user', content: userMessage });
  messages.scrollTop = messages.scrollHeight;
  input.value = '';
  
  // Add loading
  const loadingId = 'loading-' + Date.now();
  messages.innerHTML += `<div id="${loadingId}" style="display: flex; margin-bottom: 20px;"><div style="width: 50px; height: 50px; background: radial-gradient(circle, #00d9ff, #0088ff); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2rem; box-shadow: 0 0 20px #00d9ff; margin-right: 15px; flex-shrink: 0;">🤖</div><div style="flex: 1;"><div style="color: #00d9ff; font-weight: bold; margin-bottom: 5px;">JARVIS AI Assistant</div><div style="color: #0088ff; line-height: 1.6;"><span style="animation: blink 1s infinite;">JARVIS is thinking...</span></div></div></div>`;
  messages.scrollTop = messages.scrollHeight;
  
  try {
    // Call Cloudflare Worker instead of Gemini directly
    const response = await fetch(JARVIS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer jarvis-trading' // Simple auth
      },
      body: JSON.stringify({
        prompt: userMessage
      })
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error);
    }
    
    const aiResponse = data.response;
    
    chatHistory.push({ role: 'assistant', content: aiResponse });
    document.getElementById(loadingId).remove();
    
    messages.innerHTML += `<div style="display: flex; margin-bottom: 20px;"><div style="width: 50px; height: 50px; background: radial-gradient(circle, #00d9ff, #0088ff); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2rem; box-shadow: 0 0 20px #00d9ff; margin-right: 15px; flex-shrink: 0;">🤖</div><div style="flex: 1;"><div style="color: #00d9ff; font-weight: bold; margin-bottom: 5px;">JARVIS AI Assistant</div><div style="color: #00d9ff; line-height: 1.6; white-space: pre-wrap;">${formatJARVISResponse(aiResponse)}</div></div></div>`;
    
  } catch (error) {
    console.error('JARVIS Chat Error:', error);
    document.getElementById(loadingId).remove();
    messages.innerHTML += `<div style="display: flex; margin-bottom: 20px;"><div style="width: 50px; height: 50px; background: radial-gradient(circle, #ff0060, #ff4080); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2rem; box-shadow: 0 0 20px #ff0060; margin-right: 15px; flex-shrink: 0;">⚠️</div><div style="flex: 1;"><div style="color: #ff0060; font-weight: bold; margin-bottom: 5px;">JARVIS Error</div><div style="color: #ff4080; line-height: 1.6;">Error: ${error.message}</div></div></div>`;
  }
  
  input.disabled = false;
  sendBtn.disabled = false;
  sendBtn.textContent = 'SEND';
  input.focus();
  messages.scrollTop = messages.scrollHeight;
}
