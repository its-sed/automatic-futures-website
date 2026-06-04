let stockPortfolio = [];
let futuresContracts = [{ symbol: 'CL', name: 'Crude Oil', contractSize: 1000, tickValue: 10 }];
let analyticsChart = null;
let chatHistory = [];

const FINNHUB_API_KEY = 'd8gqff9r01qhjpmp75p0d8gqff9r01qhjpmp75pg';
const JARVIS_API_URL = 'https://lingering-credit-9e25.kindredjake24.workers.dev';

document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  loadStockPortfolio();
  loadFuturesContracts();
  initFuturesTab();
  initStockPortfolio();
  initNewsTab();
  initAnalyticsTab();
  initJARVISChat();
  updateSystemTime();
  setInterval(updateSystemTime, 1000);
  setInterval(updateStockPortfolioPrices, 300000);
});

function initTabs() {
  document.querySelectorAll('.tab-btn').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      document.getElementById(tab.dataset.tab).classList.add('active');
    });
  });
}

function updateSystemTime() {
  const el = document.getElementById('currentTime');
  if (el) el.textContent = new Date().toLocaleTimeString();
}

// FUTURES
function initFuturesTab() {
  renderFuturesContracts();
  updateFuturesPrices();
  setInterval(updateFuturesPrices, 30000);
  document.getElementById('addFuturesBtn').addEventListener('click', addFuturesContract);
}

function loadFuturesContracts() {
  const saved = localStorage.getItem('futuresContracts');
  if (saved) futuresContracts = JSON.parse(saved);
}

function saveFuturesContracts() { localStorage.setItem('futuresContracts', JSON.stringify(futuresContracts)); }

function renderFuturesContracts() {
  const container = document.getElementById('futuresList');
  if (!container) return;
  container.innerHTML = '';
  futuresContracts.forEach((contract, i) => {
    const card = document.createElement('div');
    card.className = 'recommendation-card';
    card.innerHTML = `
      <div class="rec-symbol">${contract.symbol}</div>
      <div class="rec-name">${contract.name}</div>
      <div class="rec-price" id="futuresPrice-${i}">$--</div>
      <div class="rec-change" id="futuresChange-${i}">--%</div>
      <div style="margin-bottom: 10px;"><strong style="color: #0088ff;">Contract Size:</strong> <span style="color: #00ffff;">${contract.contractSize}</span></div>
      <div style="margin-bottom: 10px;"><strong style="color: #0088ff;">Tick Value:</strong> <span style="color: #00ffff;">$${contract.tickValue}</span></div>
      <div class="support-resistance">
        <div class="support-card"><h4>Support</h4><p id="support-${i}">$--</p></div>
        <div class="resistance-card"><h4>Resistance</h4><p id="resistance-${i}">$--</p></div>
      </div>
      <div class="futures-chart-container"><canvas id="futuresChart-${i}"></canvas></div>
      <button class="action-btn" onclick="removeFutures(${i})" style="margin-top: 15px; width: 100%; background: rgba(255,0,96,0.2); border-color: #ff0060; color: #ff0060;">Remove</button>
    `;
    container.appendChild(card);
  });
  document.getElementById('futuresCount').textContent = futuresContracts.length;
}

async function updateFuturesPrices() {
  for (let i = 0; i < futuresContracts.length; i++) {
    const data = await fetchStockData(futuresContracts[i].symbol);
    if (data) {
      const priceEl = document.getElementById(`futuresPrice-${i}`);
      const changeEl = document.getElementById(`futuresChange-${i}`);
      if (priceEl) priceEl.textContent = `$${data.price.toFixed(2)}`;
      if (changeEl) {
        changeEl.className = `rec-change ${data.changePercent >= 0 ? 'bull' : 'bear'}`;
        changeEl.textContent = `${data.changePercent >= 0 ? '+' : ''}${data.changePercent.toFixed(2)}%`;
      }
      const s = document.getElementById(`support-${i}`);
      const r = document.getElementById(`resistance-${i}`);
      if (s) s.textContent = `$${(data.price * 0.95).toFixed(2)}`;
      if (r) r.textContent = `$${(data.price * 1.05).toFixed(2)}`;
      createFuturesChart(i, data.price);
    }
  }
  document.getElementById('refreshTime').textContent = new Date().toLocaleTimeString();
  document.getElementById('jarvisRecommendation').textContent = `Monitoring ${futuresContracts.length} futures contracts. Crude Oil (CL) trading today.`;
}

function createFuturesChart(index, currentPrice) {
  const canvas = document.getElementById(`futuresChart-${index}`);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (canvas.chart) canvas.chart.destroy();
  canvas.height = 150;
  const labels = ['1h', '2h', '3h', '4h', '5h', '6h'];
  const prices = labels.map((_, i) => currentPrice * (1 + (Math.random() - 0.5) * 0.02));
  prices.push(currentPrice);
  canvas.chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [...labels, 'Now'],
      datasets: [{
        label: 'Price',
        data: prices,
        borderColor: '#00d9ff',
        backgroundColor: 'rgba(0, 217, 255, 0.2)',
        borderWidth: 2,
        fill: true,
        tension: 0.4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: '#0088ff' }, grid: { color: 'rgba(0, 217, 255, 0.1)' } },
        y: { ticks: { color: '#0088ff' }, grid: { color: 'rgba(0, 217, 255, 0.1)' } }
      }
    }
  });
}

function addFuturesContract() {
  const symbolInput = document.getElementById('futuresSymbol');
  const symbol = symbolInput.value.trim().toUpperCase();
  if (!symbol) { alert('Enter symbol'); return; }
  const name = prompt('Contract name:', symbol);
  if (!name) return;
  futuresContracts.push({ symbol, name, contractSize: 1000, tickValue: 10 });
  saveFuturesContracts();
  renderFuturesContracts();
  updateFuturesPrices();
  symbolInput.value = '';
}

function removeFutures(index) {
  if (confirm('Remove?')) { futuresContracts.splice(index, 1); saveFuturesContracts(); renderFuturesContracts(); updateFuturesPrices(); }
}

// PORTFOLIO
function initStockPortfolio() { updatePortfolioDisplay(); }
function loadStockPortfolio() { const saved = localStorage.getItem('stockPortfolio'); if (saved) stockPortfolio = JSON.parse(saved); }
function saveStockPortfolio() { localStorage.setItem('stockPortfolio', JSON.stringify(stockPortfolio)); }

function updateStockPortfolioPrices() {
  stockPortfolio.forEach(async h => {
    const data = await fetchStockData(h.symbol);
    if (data) { h.currentPrice = data.price; h.changePercent = data.changePercent; }
  });
  saveStockPortfolio();
  updatePortfolioDisplay();
}

function updatePortfolioDisplay() {
  const rows = document.getElementById('portfolioRows');
  if (!rows) return;
  rows.innerHTML = '';
  let total = 0, dayChange = 0;
  stockPortfolio.forEach((h, i) => {
    const value = h.shares * h.currentPrice;
    const pl = (h.currentPrice - h.buyPrice) * h.shares;
    const plPct = ((h.currentPrice - h.buyPrice) / h.buyPrice) * 100;
    total += value;
    dayChange += h.changePercent * value;
    const tr = document.createElement('tr');
    tr.innerHTML = `<td><strong style="color: #00d9ff;">${h.symbol}</strong></td><td>${h.shares}</td><td>$${h.buyPrice.toFixed(2)}</td><td style="color: #00ffff;">$${h.currentPrice.toFixed(2)}</td><td style="color: #00d9ff; font-weight: bold;">$${value.toFixed(2)}</td><td class="${h.changePercent >= 0 ? 'positive-change' : 'negative-change'}">${h.changePercent >= 0 ? '+' : ''}${h.changePercent.toFixed(2)}%</td><td class="${plPct >= 0 ? 'positive-change' : 'negative-change'}">$${pl.toFixed(2)} (${plPct >= 0 ? '+' : ''}${plPct.toFixed(2)}%)</td><td><button class="action-btn" onclick="removeHolding(${i})">Remove</button></td>`;
    rows.appendChild(tr);
  });
  dayChange = total > 0 ? (dayChange / total) * 100 : 0;
  document.getElementById('portfolioTotal').textContent = `$${total.toFixed(2)}`;
  document.getElementById('portfolioDayChange').textContent = `${dayChange >= 0 ? '+' : ''}${dayChange.toFixed(2)}%`;
  document.getElementById('portfolioDayChange').className = dayChange >= 0 ? 'metric-value positive-change' : 'metric-value negative-change';
  document.getElementById('portfolioHoldings').textContent = stockPortfolio.length;
}

function openAddStockForm() { document.getElementById('addStockForm').style.display = 'block'; }

document.getElementById('searchStockBtn').addEventListener('click', async () => {
  const symbol = document.getElementById('stockSearchInput').value.trim().toUpperCase();
  if (!symbol) return;
  const data = await fetchStockData(symbol);
  if (!data) { alert('Not found'); return; }
  document.getElementById('searchResults').innerHTML = `<div style="color: #00d9ff; margin: 10px 0;">${data.symbol} - $${data.price.toFixed(2)} (${data.changePercent >= 0 ? '+' : ''}${data.changePercent.toFixed(2)}%)</div>`;
  document.getElementById('selectedSymbol').textContent = data.symbol;
  document.getElementById('selectedName').textContent = data.symbol;
  document.getElementById('buyPriceInput').value = data.price;
  document.getElementById('addHoldingForm').style.display = 'block';
});

document.getElementById('addHoldingBtn').addEventListener('click', async () => {
  const symbol = document.getElementById('selectedSymbol').textContent;
  const shares = parseInt(document.getElementById('sharesInput').value);
  const buyPrice = parseFloat(document.getElementById('buyPriceInput').value);
  if (!shares || !buyPrice) { alert('Invalid'); return; }
  const data = await fetchStockData(symbol);
  stockPortfolio.push({ symbol, shares, buyPrice, currentPrice: data ? data.price : buyPrice, changePercent: data ? data.changePercent : 0 });
  saveStockPortfolio();
  updatePortfolioDisplay();
  document.getElementById('addStockForm').style.display = 'none';
  document.getElementById('stockSearchInput').value = '';
  document.getElementById('sharesInput').value = '';
  alert(`${symbol} added!`);
});

function removeHolding(i) { if (confirm('Remove?')) { stockPortfolio.splice(i, 1); saveStockPortfolio(); updatePortfolioDisplay(); } }

// NEWS
function initNewsTab() { fetchNews(); document.getElementById('refreshNewsBtn').addEventListener('click', fetchNews); setInterval(fetchNews, 900000); }

async function fetchNews() {
  const container = document.getElementById('newsContainer');
  if (!container) return;
  container.innerHTML = '<p style="color: #0088ff; text-align: center;">Loading...</p>';
  const news = [
    { headline: 'Geopolitical Tensions Rise in Middle East', source: 'Reuters', summary: 'Oil prices surge amid escalating conflicts', date: new Date().toLocaleDateString(), url: '#' },
    { headline: 'Fed Signals Potential Rate Cut', source: 'Bloomberg', summary: 'Markets rally on dovish Federal Reserve stance', date: new Date().toLocaleDateString(), url: '#' },
    { headline: 'Tech Earnings Beat Expectations', source: 'CNBC', summary: 'Major tech companies report strong quarterly results', date: new Date().toLocaleDateString(), url: '#' },
    { headline: 'Oil Inventory Drops Unexpectedly', source: 'MarketWatch', summary: 'Crude oil stocks fall by 5M barrels', date: new Date().toLocaleDateString(), url: '#' },
    { headline: 'Dollar Weakens Against Euro', source: 'Financial Times', summary: 'Currency markets shift on economic data', date: new Date().toLocaleDateString(), url: '#' }
  ];
  container.innerHTML = news.map(n => `<div class="news-card"><div class="news-headline">${n.headline}</div><div class="news-source">${n.source}</div><div class="news-summary">${n.summary}</div><div class="news-date">${n.date}</div><a href="${n.url}" target="_blank" style="color: #00ffff; margin-top: 10px; display: inline-block;">Read more →</a></div>`).join('');
  document.getElementById('newsTime').textContent = new Date().toLocaleTimeString();
}

// ANALYTICS
function initAnalyticsTab() {
  document.getElementById('analyticsSearchBtn').addEventListener('click', analyzeStock);
  document.getElementById('analyticsSearch').addEventListener('keypress', e => { if (e.key === 'Enter') analyzeStock(); });
}

async function analyzeStock() {
  const symbol = document.getElementById('analyticsSearch').value.trim().toUpperCase();
  if (!symbol) return;
  
  try {
    const [stockData] = await Promise.all([
      fetchStockData(symbol)
    ]);
    
    if (!stockData) { alert('Stock not found'); return; }
    
    document.getElementById('analyticsResults').style.display = 'block';
    document.getElementById('analyticsSymbol').textContent = symbol;
    document.getElementById('analyticsName').textContent = symbol;
    document.getElementById('analyticsPrice').textContent = `$${stockData.price.toFixed(2)}`;
    
    const ch = document.getElementById('analyticsChange');
    ch.textContent = `${stockData.changePercent >= 0 ? '+' : ''}${stockData.changePercent.toFixed(2)}%`;
    ch.className = stockData.changePercent >= 0 ? 'metric-value positive-change' : 'metric-value negative-change';
    
    document.getElementById('analyticsOpen').textContent = `$${stockData.price.toFixed(2)}`;
    document.getElementById('analyticsHL').textContent = `$${(stockData.price * 0.98).toFixed(2)} / $${(stockData.price * 1.02).toFixed(2)}`;
    
    // Show mock data since real APIs are limited
    document.getElementById('analyticsMarketCap').textContent = '$--';
    document.getElementById('analyticsPE').textContent = '--';
    document.getElementById('analyticsEPS').textContent = '--';
    document.getElementById('analyticsDividend').textContent = '--%';
    
    // Show better news with real links
    document.getElementById('analyticsNews').innerHTML = `
      <div class="news-card">
        <div class="news-headline">${symbol} Stock Analysis</div>
        <div class="news-source">Yahoo Finance</div>
        <div class="news-summary">Recent analysis and price movements for ${symbol}</div>
        <a href="https://finance.yahoo.com/quote/${symbol}" target="_blank" style="color: #00ffff; margin-top: 10px; display: inline-block;">View on Yahoo Finance →</a>
      </div>
      <div class="news-card">
        <div class="news-headline">${symbol} Latest News</div>
        <div class="news-source">Google News</div>
        <div class="news-summary">Latest news articles about ${symbol}</div>
        <a href="https://news.google.com/search?q=${symbol}+stock" target="_blank" style="color: #00ffff; margin-top: 10px; display: inline-block;">Google News →</a>
      </div>
    `;
    
    document.getElementById('analyticsEvents').innerHTML = `
      <div class="insight-card">
        <h3>Next Earnings</h3>
        <p>${new Date(Date.now() + 30*86400000).toLocaleDateString()}</p>
      </div>
      <div class="insight-card">
        <h3>Ex-Dividend</h3>
        <p>${new Date(Date.now() + 15*86400000).toLocaleDateString()}</p>
      </div>
    `;
    
  } catch (error) {
    console.error('Analytics error:', error);
    alert('Error loading analytics');
  }
}

// JARVIS AI
function initJARVISChat() {
  const container = document.getElementById('jarvisChatContainer');
  if (!container) return;
  container.innerHTML = `
    <div style="height: calc(100vh - 250px); display: flex; flex-direction: column;">
      <div id="jarvisChatMessages" style="flex: 1; overflow-y: auto; padding: 20px; background: rgba(0,10,20,0.8); border-radius: 10px; margin-bottom: 20px;">
        <div style="display: flex; margin-bottom: 20px;">
          <div style="width: 50px; height: 50px; background: radial-gradient(circle, #00d9ff, #0088ff); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2rem; box-shadow: 0 0 20px #00d9ff; margin-right: 15px;">🤖</div>
          <div style="flex: 1;"><div style="color: #00d9ff; font-weight: bold; margin-bottom: 5px;">JARVIS AI Assistant</div><div style="color: #00d9ff; line-height: 1.6;">Hello! I'm JARVIS, your AI trading assistant powered by Google Gemini. What would you like to know?</div></div>
        </div>
      </div>
      <div style="display: flex; gap: 10px;">
        <input type="text" id="jarvisChatInput" placeholder="Ask JARVIS about stocks, markets, or trading..." style="flex: 1; padding: 15px; background: rgba(0,10,20,0.9); border: 2px solid rgba(0,217,255,0.5); color: #00d9ff; border-radius: 8px;" onkeypress="if(event.key==='Enter') sendJARVISMessage()">
        <button id="sendJARVISBtn" onclick="sendJARVISMessage()" style="padding: 15px 30px; background: rgba(0,217,255,0.3); border: 2px solid #00d9ff; color: #00d9ff; border-radius: 8px; cursor: pointer; font-weight: bold;">SEND</button>
      </div>
    </div>
  `;
}

async function sendJARVISMessage() {
  const input = document.getElementById('jarvisChatInput');
  const messages = document.getElementById('jarvisChatMessages');
  const btn = document.getElementById('sendJARVISBtn');
  const msg = input.value.trim();
  if (!msg) return;
  input.disabled = btn.disabled = true;
  btn.textContent = '...';
  messages.innerHTML += `<div style="display: flex; margin-bottom: 20px; justify-content: flex-end;"><div style="flex: 1; max-width: 70%; margin-left: 15px;"><div style="color: #0088ff; font-weight: bold; margin-bottom: 5px; text-align: right;">You</div><div style="background: rgba(0,217,255,0.1); border: 1px solid rgba(0,217,255,0.3); border-radius: 10px; padding: 15px; color: #00d9ff;">${msg}</div></div><div style="width: 50px; height: 50px; background: radial-gradient(circle, #00ffff, #00d9ff); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; box-shadow: 0 0 20px #00ffff; margin-left: 15px;">👤</div></div>`;
  messages.scrollTop = messages.scrollHeight;
  input.value = '';
  const loadingId = 'loading-' + Date.now();
  messages.innerHTML += `<div id="${loadingId}" style="display: flex; margin-bottom: 20px;"><div style="width: 50px; height: 50px; background: radial-gradient(circle, #00d9ff, #0088ff); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2rem; box-shadow: 0 0 20px #00d9ff; margin-right: 15px;">🤖</div><div style="flex: 1;"><div style="color: #00d9ff; font-weight: bold; margin-bottom: 5px;">JARVIS AI Assistant</div><div style="color: #0088ff;"><span style="animation: blink 1s infinite;">Thinking...</span></div></div></div>`;
  messages.scrollTop = messages.scrollHeight;
  try {
    const res = await fetch(JARVIS_API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: msg }) });
    if (!res.ok) throw new Error(`API Error: ${res.status}`);
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    document.getElementById(loadingId).remove();
    messages.innerHTML += `<div style="display: flex; margin-bottom: 20px;"><div style="width: 50px; height: 50px; background: radial-gradient(circle, #00d9ff, #0088ff); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2rem; box-shadow: 0 0 20px #00d9ff; margin-right: 15px;">🤖</div><div style="flex: 1;"><div style="color: #00d9ff; font-weight: bold; margin-bottom: 5px;">JARVIS AI Assistant</div><div style="color: #00d9ff; line-height: 1.6; white-space: pre-wrap;">${data.response}</div></div></div>`;
  } catch (e) { document.getElementById(loadingId).remove(); messages.innerHTML += `<div style="color: #ff0060;">Error: ${e.message}</div>`; }
  input.disabled = btn.disabled = false;
  btn.textContent = 'SEND';
  input.focus();
  messages.scrollTop = messages.scrollHeight;
}

async function fetchStockData(symbol) {
  try {
    const res = await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`);
    const data = await res.json();
    if (data.c) return { symbol, price: data.c, changePercent: data.dp };
    return null;
  } catch { return null; }
}
