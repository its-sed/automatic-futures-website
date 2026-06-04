// JARVIS Trading Platform - Complete Rebuild
// State Management
let stockPortfolio = [];
let futuresContracts = [{ symbol: 'CL', name: 'Crude Oil', contractSize: 1000, tickValue: 10 }];
let portfolioChart = null;
let analyticsChart = null;
let lastFuturesRefresh = null;
let lastNewsRefresh = null;
let chatHistory = [];

// API Keys
const FINNHUB_API_KEY = 'd8gqff9r01qhjpmp75p0d8gqff9r01qhjpmp75pg';
const ALPHA_VANTAGE_API_KEY = 'DEMO'; // Free tier for demo

// Initialize platform
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
  setInterval(updateStockPortfolioPrices, 300000); // Update every 5 minutes
});

// Tab Navigation
function initTabs() {
  const tabs = document.querySelectorAll('.tab-btn');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      const targetTab = document.getElementById(tab.dataset.tab);
      if (targetTab) targetTab.classList.add('active');
    });
  });
}

// System Time
function updateSystemTime() {
  const timeEl = document.getElementById('currentTime');
  if (timeEl) timeEl.textContent = new Date().toLocaleTimeString();
}

// ============================================
// FUTURES TAB
// ============================================

function initFuturesTab() {
  renderFuturesContracts();
  updateFuturesPrices();
  lastFuturesRefresh = new Date();
  
  const refreshTimeEl = document.getElementById('refreshTime');
  if (refreshTimeEl) refreshTimeEl.textContent = `Last updated: ${lastFuturesRefresh.toLocaleTimeString()}`;
  
  // Add futures button
  const addBtn = document.getElementById('addFuturesBtn');
  if (addBtn) {
    addBtn.addEventListener('click', addFuturesContract);
  }
  
  // Auto-refresh futures every 30 seconds
  setInterval(updateFuturesPrices, 30000);
}

function loadFuturesContracts() {
  const saved = localStorage.getItem('futuresContracts');
  if (saved) {
    futuresContracts = JSON.parse(saved);
  }
}

function saveFuturesContracts() {
  localStorage.setItem('futuresContracts', JSON.stringify(futuresContracts));
}

function renderFuturesContracts() {
  const container = document.getElementById('futuresList');
  if (!container) return;
  
  container.innerHTML = '';
  
  futuresContracts.forEach((contract, index) => {
    const card = document.createElement('div');
    card.className = 'recommendation-card';
    card.innerHTML = `
      <div class="rec-symbol">${contract.symbol}</div>
      <div class="rec-name">${contract.name}</div>
      <div class="rec-price" id="futuresPrice-${index}">$--</div>
      <div class="rec-change" id="futuresChange-${index}">--%</div>
      <div style="margin-bottom: 10px;">
        <strong style="color: #0088ff;">Contract Size:</strong> <span style="color: #00ffff;">${contract.contractSize}</span>
      </div>
      <div style="margin-bottom: 10px;">
        <strong style="color: #0088ff;">Tick Value:</strong> <span style="color: #00ffff;">$${contract.tickValue}</span>
      </div>
      <div class="support-resistance">
        <div class="support-card">
          <h4>Support</h4>
          <p id="support-${index}">$--</p>
        </div>
        <div class="resistance-card">
          <h4>Resistance</h4>
          <p id="resistance-${index}">$--</p>
        </div>
      </div>
      <div class="futures-chart-container">
        <canvas id="futuresChart-${index}"></canvas>
      </div>
      <button class="action-btn" onclick="removeFutures(${index})" style="margin-top: 15px; width: 100%; background: rgba(255, 0, 96, 0.2); border-color: #ff0060; color: #ff0060;">Remove</button>
    `;
    container.appendChild(card);
  });
}

async function updateFuturesPrices() {
  for (let i = 0; i < futuresContracts.length; i++) {
    const contract = futuresContracts[i];
    const priceEl = document.getElementById(`futuresPrice-${i}`);
    const changeEl = document.getElementById(`futuresChange-${i}`);
    const supportEl = document.getElementById(`support-${i}`);
    const resistanceEl = document.getElementById(`resistance-${i}`);
    const chartCanvas = document.getElementById(`futuresChart-${i}`);
    
    // For demo, use stock API (Finnhub doesn't have futures)
    const data = await fetchStockData(contract.symbol);
    
    if (data && priceEl && changeEl) {
      priceEl.textContent = `$${data.price.toFixed(2)}`;
      
      const changeSign = data.changePercent >= 0 ? '+' : '';
      const changeClass = data.changePercent >= 0 ? 'bull' : 'bear';
      changeEl.className = `rec-change ${changeClass}`;
      changeEl.textContent = `${changeSign}${data.changePercent.toFixed(2)}%`;
      
      // Calculate support and resistance
      const support = data.price * 0.95;
      const resistance = data.price * 1.05;
      
      if (supportEl) supportEl.textContent = `$${support.toFixed(2)}`;
      if (resistanceEl) resistanceEl.textContent = `$${resistance.toFixed(2)}`;
      
      // Create chart
      if (chartCanvas) {
        const history = await fetchStockHistory(contract.symbol);
        createFuturesChart(chartCanvas, history);
      }
    }
  }
  
  lastFuturesRefresh = new Date();
  const refreshTimeEl = document.getElementById('refreshTime');
  if (refreshTimeEl) refreshTimeEl.textContent = `Last updated: ${lastFuturesRefresh.toLocaleTimeString()}`;
  
  const jarvisEl = document.getElementById('jarvisRecommendation');
  if (jarvisEl) {
    jarvisEl.textContent = `Monitoring ${futuresContracts.length} futures contracts. Crude Oil (CL) is showing ${futuresContracts[0]?.symbol ? 'active trading' : 'no data'} volume today.`;
  }
}

function createFuturesChart(canvas, history) {
  const ctx = canvas.getContext('2d');
  
  if (analyticsChart) {
    analyticsChart.destroy();
  }
  
  analyticsChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: history.labels.slice(-30),
      datasets: [{
        label: 'Price',
        data: history.prices.slice(-30),
        borderColor: '#00d9ff',
        backgroundColor: 'rgba(0, 217, 255, 0.2)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointHoverRadius: 5
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: {
          ticks: { color: '#0088ff', maxTicksLimit: 6 },
          grid: { color: 'rgba(0, 217, 255, 0.1)' }
        },
        y: {
          ticks: { color: '#0088ff', callback: (val) => '$' + val.toFixed(2) },
          grid: { color: 'rgba(0, 217, 255, 0.1)' }
        }
      }
    }
  });
}

function addFuturesContract() {
  const symbolInput = document.getElementById('futuresSymbol');
  const symbol = symbolInput.value.trim().toUpperCase();
  
  if (!symbol) {
    alert('Please enter a futures symbol');
    return;
  }
  
  const name = prompt('Enter contract name:', symbol === 'CL' ? 'Crude Oil' : `${symbol} Futures`);
  if (!name) return;
  
  const contractSize = prompt('Enter contract size (e.g., 1000 for CL):', '1000');
  const tickValue = prompt('Enter tick value (e.g., 10 for CL):', '10');
  
  futuresContracts.push({
    symbol,
    name,
    contractSize: parseInt(contractSize) || 1000,
    tickValue: parseInt(tickValue) || 10
  });
  
  saveFuturesContracts();
  renderFuturesContracts();
  updateFuturesPrices();
  
  symbolInput.value = '';
}

function removeFutures(index) {
  if (confirm('Remove this futures contract?')) {
    futuresContracts.splice(index, 1);
    saveFuturesContracts();
    renderFuturesContracts();
    updateFuturesPrices();
  }
}

// ============================================
// STOCK PORTFOLIO TAB
// ============================================

function initStockPortfolio() {
  updatePortfolioDisplay();
}

function loadStockPortfolio() {
  const saved = localStorage.getItem('stockPortfolio');
  if (saved) {
    stockPortfolio = JSON.parse(saved);
  }
}

function saveStockPortfolio() {
  localStorage.setItem('stockPortfolio', JSON.stringify(stockPortfolio));
}

function updateStockPortfolioPrices() {
  stockPortfolio.forEach(async (holding, index) => {
    const data = await fetchStockData(holding.symbol);
    if (data) {
      holding.currentPrice = data.price;
      holding.change = data.change;
      holding.changePercent = data.changePercent;
    }
  });
  
  saveStockPortfolio();
  updatePortfolioDisplay();
}

function updatePortfolioDisplay() {
  const rows = document.getElementById('portfolioRows');
  const totalEl = document.getElementById('portfolioTotal');
  const dayChangeEl = document.getElementById('portfolioDayChange');
  const holdingsEl = document.getElementById('portfolioHoldings');
  
  if (!rows) return;
  
  rows.innerHTML = '';
  
  let totalValue = 0;
  let totalPL = 0;
  let totalDayChange = 0;
  
  stockPortfolio.forEach((holding, index) => {
    const currentValue = holding.shares * holding.currentPrice;
    const pl = currentValue - (holding.shares * holding.buyPrice);
    const plPercent = ((holding.currentPrice - holding.buyPrice) / holding.buyPrice) * 100;
    
    totalValue += currentValue;
    totalPL += pl;
    totalDayChange += holding.changePercent * currentValue;
    
    const row = document.createElement('tr');
    row.innerHTML = `
      <td><strong style="color: #00d9ff;">${holding.symbol}</strong></td>
      <td>${holding.shares}</td>
      <td>$${holding.buyPrice.toFixed(2)}</td>
      <td style="color: #00ffff;">$${holding.currentPrice.toFixed(2)}</td>
      <td style="color: #00d9ff; font-weight: bold;">$${currentValue.toFixed(2)}</td>
      <td class="${holding.changePercent >= 0 ? 'positive-change' : 'negative-change'}">
        ${holding.changePercent >= 0 ? '+' : ''}${holding.changePercent.toFixed(2)}%
      </td>
      <td class="${plPercent >= 0 ? 'positive-change' : 'negative-change'}">
        $${pl.toFixed(2)} (${plPercent >= 0 ? '+' : ''}${plPercent.toFixed(2)}%)
      </td>
      <td>
        <button class="action-btn" onclick="removeHolding(${index})">Remove</button>
      </td>
    `;
    rows.appendChild(row);
  });
  
  if (totalValue > 0) {
    totalDayChange = (totalDayChange / totalValue) * 100;
  }
  
  if (totalEl) totalEl.textContent = `$${totalValue.toFixed(2)}`;
  if (dayChangeEl) {
    dayChangeEl.textContent = `${totalDayChange >= 0 ? '+' : ''}${totalDayChange.toFixed(2)}%`;
    dayChangeEl.className = totalDayChange >= 0 ? 'summary-number positive-change' : 'summary-number negative-change';
  }
  if (holdingsEl) holdingsEl.textContent = stockPortfolio.length;
}

// Search Stock
const searchBtn = document.getElementById('searchStockBtn');
const searchInput = document.getElementById('stockSearchInput');

if (searchBtn && searchInput) {
  searchBtn.addEventListener('click', async () => {
    const symbol = searchInput.value.trim().toUpperCase();
    if (!symbol) {
      alert('Please enter a stock symbol');
      return;
    }
    
    const data = await fetchStockData(symbol);
    if (!data) {
      alert('Stock not found');
      return;
    }
    
    const results = document.getElementById('searchResults');
    const form = document.getElementById('addHoldingForm');
    const selectedSymbol = document.getElementById('selectedSymbol');
    const selectedName = document.getElementById('selectedName');
    const selectedPrice = document.getElementById('selectedPrice');
    const buyPriceInput = document.getElementById('buyPriceInput');
    
    if (results) {
      results.innerHTML = `
        <div class="stock-result">
          <div class="symbol">${data.symbol}</div>
          <div class="name">${data.name}</div>
          <div>Price: $${data.price.toFixed(2)} | Change: ${data.change >= 0 ? '+' : ''}${data.change}%</div>
        </div>
      `;
    }
    
    if (selectedSymbol) selectedSymbol.textContent = data.symbol;
    if (selectedName) selectedName.textContent = data.name;
    if (selectedPrice) selectedPrice.textContent = `$${data.price.toFixed(2)}`;
    if (buyPriceInput) buyPriceInput.value = data.price;
    if (form) form.style.display = 'block';
  });
}

// Add Holding
const addHoldingBtn = document.getElementById('addHoldingBtn');

if (addHoldingBtn) {
  addHoldingBtn.addEventListener('click', async () => {
    const selectedSymbol = document.getElementById('selectedSymbol');
    const selectedName = document.getElementById('selectedName');
    const sharesInput = document.getElementById('sharesInput');
    const buyPriceInput = document.getElementById('buyPriceInput');
    
    const symbol = selectedSymbol.textContent;
    const name = selectedName.textContent;
    const shares = parseInt(sharesInput.value);
    const buyPrice = parseFloat(buyPriceInput.value);
    
    if (!shares || shares <= 0) {
      alert('Please enter valid shares');
      return;
    }
    
    if (!buyPrice || buyPrice <= 0) {
      alert('Please enter valid buy price');
      return;
    }
    
    const data = await fetchStockData(symbol);
    
    stockPortfolio.push({
      symbol,
      name,
      shares,
      buyPrice,
      currentPrice: data ? data.price : buyPrice,
      change: data ? data.change : 0,
      changePercent: data ? data.changePercent : 0
    });
    
    saveStockPortfolio();
    updatePortfolioDisplay();
    
    // Reset form
    document.getElementById('addHoldingForm').style.display = 'none';
    document.getElementById('searchResults').innerHTML = '';
    searchInput.value = '';
    sharesInput.value = '';
    buyPriceInput.value = '';
    
    alert(`${symbol} added to portfolio!`);
  });
}

function removeHolding(index) {
  if (confirm('Remove this holding?')) {
    stockPortfolio.splice(index, 1);
    saveStockPortfolio();
    updatePortfolioDisplay();
  }
}

// ============================================
// NEWS REVIEW TAB
// ============================================

function initNewsTab() {
  fetchNews();
  
  const refreshBtn = document.getElementById('refreshNewsBtn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', fetchNews);
  }
  
  // Auto-refresh news every 15 minutes
  setInterval(fetchNews, 900000);
}

async function fetchNews() {
  const container = document.getElementById('newsContainer');
  if (!container) return;
  
  container.innerHTML = '<p style="color: #0088ff; text-align: center;">Loading news...</p>';
  
  try {
    // Fetch news from multiple free sources
    const [financeNews, warNews, earningsNews] = await Promise.all([
      fetchFinanceNews(),
      fetchWarNews(),
      fetchEarningsNews()
    ]);
    
    const allNews = [...financeNews, ...warNews, ...earningsNews].slice(0, 15);
    
    if (allNews.length === 0) {
      container.innerHTML = '<p style="color: #ff0060; text-align: center;">No news available at this time</p>';
      return;
    }
    
    container.innerHTML = allNews.map(news => `
      <div class="news-card">
        <div class="news-headline">${news.headline}</div>
        <div class="news-source">${news.source}</div>
        <div class="news-summary">${news.summary}</div>
        <div class="news-date">${news.date}</div>
        ${news.url ? `<a href="${news.url}" target="_blank" style="display: inline-block; margin-top: 10px; color: #00ffff; text-decoration: none; font-size: 0.9rem;">Read more →</a>` : ''}
      </div>
    `).join('');
    
    lastNewsRefresh = new Date();
  } catch (error) {
    console.error('News fetch error:', error);
    container.innerHTML = '<p style="color: #ff0060; text-align: center;">Error loading news. Please try again.</p>';
  }
}

async function fetchFinanceNews() {
  try {
    const response = await fetch(`https://finnhub.io/api/v1/news?category=general&token=${FINNHUB_API_KEY}`);
    if (!response.ok) throw new Error('Failed');
    const data = await response.json();
    
    return data.slice(0, 5).map(news => ({
      headline: news.headline || 'News Headline',
      source: news.source || 'Unknown',
      summary: (news.summary || 'No summary available').substring(0, 200),
      date: new Date(news.datetime * 1000).toLocaleDateString(),
      url: news.url
    }));
  } catch (error) {
    // Fallback mock news
    return [
      {
        headline: 'Stock Market Rallies on Strong Economic Data',
        source: 'MarketWatch',
        summary: 'Major indices surged as investors digested positive economic indicators and corporate earnings reports.',
        date: new Date().toLocaleDateString(),
        url: '#'
      },
      {
        headline: 'Federal Reserve Signals Potential Rate Cut',
        source: 'Bloomberg',
        summary: 'Fed officials hint at monetary policy shift amid cooling inflation and stable employment.',
        date: new Date().toLocaleDateString(),
        url: '#'
      }
    ];
  }
}

async function fetchWarNews() {
  try {
    const response = await fetch(`https://newsapi.org/v2/everything?q=war+military+conflict&language=en&sortBy=publishedAt&apiKey=DEMO`);
    if (!response.ok) throw new Error('Failed');
    const data = await response.json();
    
    return data.articles.slice(0, 3).map(article => ({
      headline: article.title || 'Breaking News',
      source: article.source?.name || 'Unknown',
      summary: (article.description || 'No description').substring(0, 200),
      date: new Date(article.publishedAt).toLocaleDateString(),
      url: article.url
    }));
  } catch (error) {
    return [
      {
        headline: 'Geopolitical Tensions Rise in Middle East',
        source: 'Reuters',
        summary: 'International observers express concern as diplomatic talks stall in the region.',
        date: new Date().toLocaleDateString(),
        url: '#'
      }
    ];
  }
}

async function fetchEarningsNews() {
  try {
    const response = await fetch(`https://finnhub.io/api/v1/company-news?symbol=AAPL&from=${new Date(Date.now() - 7*24*60*60*1000).toISOString().split('T')[0]}&to=${new Date().toISOString().split('T')[0]}&token=${FINNHUB_API_KEY}`);
    if (!response.ok) throw new Error('Failed');
    const data = await response.json();
    
    return data.slice(0, 4).map(news => ({
      headline: news.headline || 'Earnings Report',
      source: news.source || 'Unknown',
      summary: (news.summary || 'No summary').substring(0, 200),
      date: new Date(news.datetime * 1000).toLocaleDateString(),
      url: news.url
    }));
  } catch (error) {
    return [
      {
        headline: 'Tech Earnings Beat Expectations',
        source: 'CNBC',
        summary: 'Major technology companies report stronger-than-expected quarterly earnings, driving market gains.',
        date: new Date().toLocaleDateString(),
        url: '#'
      }
    ];
  }
}

// ============================================
// ANALYTICS TAB
// ============================================

function initAnalyticsTab() {
  const searchBtn = document.getElementById('analyticsSearchBtn');
  const searchInput = document.getElementById('analyticsSearch');
  
  if (searchBtn && searchInput) {
    searchBtn.addEventListener('click', () => analyzeStock());
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') analyzeStock();
    });
  }
}

async function analyzeStock() {
  const symbol = document.getElementById('analyticsSearch').value.trim().toUpperCase();
  if (!symbol) {
    alert('Please enter a stock symbol');
    return;
  }
  
  const results = document.getElementById('analyticsResults');
  if (results) results.style.display = 'block';
  
  document.getElementById('analyticsSymbol').textContent = symbol;
  document.getElementById('analyticsName').textContent = 'Loading...';
  
  try {
    // Fetch stock data
    const [stockData, history, news, profile] = await Promise.all([
      fetchStockData(symbol),
      fetchStockHistory(symbol),
      fetchStockNews(symbol),
      fetchStockProfile(symbol)
    ]);
    
    if (!stockData) {
      alert('Stock not found');
      if (results) results.style.display = 'none';
      return;
    }
    
    // Update basic info
    document.getElementById('analyticsName').textContent = profile.name || stockData.symbol;
    document.getElementById('analyticsPrice').textContent = `$${stockData.price.toFixed(2)}`;
    
    const changeSign = stockData.changePercent >= 0 ? '+' : '';
    const changeEl = document.getElementById('analyticsChange');
    changeEl.textContent = `${changeSign}${stockData.changePercent.toFixed(2)}%`;
    changeEl.className = stockData.changePercent >= 0 ? 'summary-number positive-change' : 'summary-number negative-change';
    
    document.getElementById('analyticsOpen').textContent = `$${stockData.open.toFixed(2)}`;
    document.getElementById('analyticsHL').textContent = `$${stockData.high.toFixed(2)} / $${stockData.low.toFixed(2)}`;
    
    // Update metrics
    document.getElementById('analyticsMarketCap').textContent = profile.marketCap ? formatMarketCap(profile.marketCap) : '--';
    document.getElementById('analyticsPE').textContent = profile.pe || '--';
    document.getElementById('analyticsEPS').textContent = profile.eps || '--';
    document.getElementById('analyticsDividend').textContent = profile.dividendYield ? `${(profile.dividendYield * 100).toFixed(2)}%` : '--';
    document.getElementById('analytics52High').textContent = `$${stockData.high || '--'}`;
    document.getElementById('analytics52Low').textContent = `$${stockData.low || '--'}`;
    
    // Create chart
    const chartCanvas = document.getElementById('analyticsChart');
    if (chartCanvas && history.prices.length > 0) {
      const ctx = chartCanvas.getContext('2d');
      
      if (analyticsChart) analyticsChart.destroy();
      
      analyticsChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: history.labels.slice(-60),
          datasets: [{
            label: 'Price',
            data: history.prices.slice(-60),
            borderColor: '#00d9ff',
            backgroundColor: 'rgba(0, 217, 255, 0.2)',
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointRadius: 3,
            pointHoverRadius: 5
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            x: {
              ticks: { color: '#0088ff', maxTicksLimit: 8 },
              grid: { color: 'rgba(0, 217, 255, 0.1)' }
            },
            y: {
              ticks: { color: '#0088ff', callback: (val) => '$' + val.toFixed(2) },
              grid: { color: 'rgba(0, 217, 255, 0.1)' }
            }
          }
        }
      });
    }
    
    // Update news
    const newsContainer = document.getElementById('analyticsNews');
    if (newsContainer) {
      newsContainer.innerHTML = news.slice(0, 3).map(n => `
        <div class="news-card">
          <div class="news-headline">${n.headline || 'News'}</div>
          <div class="news-source">${n.source || 'Unknown'}</div>
          <div class="news-summary">${(n.summary || '').substring(0, 150)}...</div>
        </div>
      `).join('');
    }
    
    // Upcoming events (mock)
    const eventsContainer = document.getElementById('analyticsEvents');
    if (eventsContainer) {
      eventsContainer.innerHTML = `
        <div class="insight-card">
          <h3>Next Earnings Date</h3>
          <p>${new Date(Date.now() + 30*24*60*60*1000).toLocaleDateString()}</p>
        </div>
        <div class="insight-card">
          <h3>Ex-Dividend Date</h3>
          <p>${new Date(Date.now() + 15*24*60*60*1000).toLocaleDateString()}</p>
        </div>
        <div class="insight-card">
          <h3>FDA Decision</h3>
          <p>Not Applicable</p>
        </div>
      `;
    }
    
  } catch (error) {
    console.error('Analytics error:', error);
    alert('Error loading analytics');
    if (results) results.style.display = 'none';
  }
}

function formatMarketCap(cap) {
  if (cap >= 1e12) return `$${(cap / 1e12).toFixed(2)}T`;
  if (cap >= 1e9) return `$${(cap / 1e9).toFixed(2)}B`;
  if (cap >= 1e6) return `$${(cap / 1e6).toFixed(2)}M`;
  return `$${cap.toFixed(2)}`;
}

// ============================================
// API FUNCTIONS
// ============================================

async function fetchStockData(symbol) {
  try {
    const response = await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`);
    if (!response.ok) throw new Error();
    const data = await response.json();
    
    if (data.c) {
      return {
        symbol,
        name: symbol,
        price: data.c,
        change: data.d,
        changePercent: data.dp,
        high: data.h,
        low: data.l,
        open: data.o,
        previousClose: data.pc
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching stock:', error);
    return null;
  }
}

async function fetchStockHistory(symbol) {
  try {
    const toDate = Math.floor(Date.now() / 1000);
    const fromDate = Math.floor((Date.now() - 60*24*60*60*1000) / 1000);
    
    const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=2mo&interval=1d`);
    if (!response.ok) throw new Error();
    
    const data = await response.json();
    
    if (data.chart?.result?.[0]) {
      const result = data.chart.result[0];
      const timestamps = result.timestamp || [];
      const prices = result.indicators.quote[0].close || [];
      
      if (timestamps.length > 0 && prices.length > 0) {
        const labels = timestamps.map(ts => {
          const date = new Date(ts * 1000);
          return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        });
        return { labels, prices };
      }
    }
    
    return { labels: [], prices: [] };
  } catch (error) {
    console.error('Error fetching history:', error);
    return { labels: [], prices: [] };
  }
}

async function fetchStockNews(symbol) {
  try {
    const toDate = new Date().toISOString().split('T')[0];
    const fromDate = new Date(Date.now() - 7*24*60*60*1000).toISOString().split('T')[0];
    
    const response = await fetch(`https://finnhub.io/api/v1/company-news?symbol=${symbol}&from=${fromDate}&to=${toDate}&token=${FINNHUB_API_KEY}`);
    if (!response.ok) throw new Error();
    const data = await response.json();
    
    return data.slice(0, 5).map(news => ({
      headline: news.headline || 'News',
      source: news.source || 'Unknown',
      summary: news.summary || '',
      url: news.url
    }));
  } catch (error) {
    return [];
  }
}

async function fetchStockProfile(symbol) {
  try {
    const response = await fetch(`https://finnhub.io/api/v1/company-profile2?symbol=${symbol}&token=${FINNHUB_API_KEY}`);
    if (!response.ok) throw new Error();
    const data = await response.json();
    
    return {
      name: data.name || symbol,
      marketCap: data.metric?.marketCap || 0,
      pe: data.metric?.PE || '--',
      eps: data.metric?.EPS || '--',
      dividendYield: data.metric?.dividendYield || 0
    };
  } catch (error) {
    return { name: symbol, marketCap: 0, pe: '--', eps: '--', dividendYield: 0 };
  }
}

// ============================================
// JARVIS AI CHAT
// ============================================

function initJARVISChat() {
  const container = document.getElementById('jarvisChatContainer');
  if (!container) return;
  
  container.innerHTML = `
    <div style="height: calc(100vh - 250px); display: flex; flex-direction: column;">
      <div id="jarvisChatMessages" style="flex: 1; overflow-y: auto; padding: 20px; background: rgba(0, 10, 20, 0.8); border-radius: 10px; margin-bottom: 20px;">
        <div style="display: flex; margin-bottom: 20px;">
          <div style="width: 50px; height: 50px; background: radial-gradient(circle, #00d9ff, #0088ff); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2rem; box-shadow: 0 0 20px #00d9ff; margin-right: 15px; flex-shrink: 0;">🤖</div>
          <div style="flex: 1;">
            <div style="color: #00d9ff; font-weight: bold; margin-bottom: 5px;">JARVIS AI Assistant</div>
            <div style="color: #00d9ff; line-height: 1.6;">Hello! I'm JARVIS, your AI trading assistant. I can help you with stock analysis, market news, portfolio advice, and trading strategies. What would you like to know?</div>
          </div>
        </div>
      </div>
      <div style="display: flex; gap: 10px;">
        <input type="text" id="jarvisChatInput" placeholder="Ask JARVIS about stocks, markets, or trading..." style="flex: 1; padding: 15px 20px; font-size: 1rem; background: rgba(0, 10, 20, 0.9); border: 2px solid rgba(0, 217, 255, 0.5); color: #00d9ff; border-radius: 8px; outline: none;" onkeypress="if(event.key === 'Enter') sendJARVISMessage()" />
        <button id="sendJARVISBtn" onclick="sendJARVISMessage()" style="padding: 15px 30px; background: rgba(0, 217, 255, 0.3); border: 2px solid #00d9ff; color: #00d9ff; border-radius: 8px; cursor: pointer; font-size: 1rem; font-weight: bold;">SEND</button>
      </div>
    </div>
  `;
  
  chatHistory = [];
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
  
  messages.innerHTML += `
    <div style="display: flex; margin-bottom: 20px; justify-content: flex-end;">
      <div style="flex: 1; max-width: 70%; margin-left: 15px;">
        <div style="color: #0088ff; font-weight: bold; margin-bottom: 5px; text-align: right;">You</div>
        <div style="background: rgba(0, 217, 255, 0.1); border: 1px solid rgba(0, 217, 255, 0.3); border-radius: 10px; padding: 15px; color: #00d9ff; line-height: 1.6;">${escapeHtml(userMessage)}</div>
      </div>
      <div style="width: 50px; height: 50px; background: radial-gradient(circle, #00ffff, #00d9ff); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; box-shadow: 0 0 20px #00ffff; margin-left: 15px; flex-shrink: 0;">👤</div>
    </div>
  `;
  
  chatHistory.push({ role: 'user', content: userMessage });
  messages.scrollTop = messages.scrollHeight;
  input.value = '';
  
  const loadingId = 'loading-' + Date.now();
  messages.innerHTML += `
    <div id="${loadingId}" style="display: flex; margin-bottom: 20px;">
      <div style="width: 50px; height: 50px; background: radial-gradient(circle, #00d9ff, #0088ff); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2rem; box-shadow: 0 0 20px #00d9ff; margin-right: 15px; flex-shrink: 0;">🤖</div>
      <div style="flex: 1;">
        <div style="color: #00d9ff; font-weight: bold; margin-bottom: 5px;">JARVIS AI Assistant</div>
        <div style="color: #0088ff; line-height: 1.6;"><span style="animation: blink 1s infinite;">JARVIS is thinking...</span></div>
      </div>
    </div>
  `;
  
  messages.scrollTop = messages.scrollHeight;
  
  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer pplx-YOUR-API-KEY-HERE'
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-large-128k-online',
        messages: [
          { role: 'system', content: 'You are JARVIS, a sophisticated AI trading assistant. Help users with stock analysis, market research, portfolio advice, and trading strategies.' },
          ...chatHistory.slice(-10)
        ]
      })
    });
    
    if (!response.ok) throw new Error(`API Error: ${response.status}`);
    
    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    
    chatHistory.push({ role: 'assistant', content: aiResponse });
    document.getElementById(loadingId).remove();
    
    messages.innerHTML += `
      <div style="display: flex; margin-bottom: 20px;">
        <div style="width: 50px; height: 50px; background: radial-gradient(circle, #00d9ff, #0088ff); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2rem; box-shadow: 0 0 20px #00d9ff; margin-right: 15px; flex-shrink: 0;">🤖</div>
        <div style="flex: 1;">
          <div style="color: #00d9ff; font-weight: bold; margin-bottom: 5px;">JARVIS AI Assistant</div>
          <div style="color: #00d9ff; line-height: 1.6; white-space: pre-wrap;">${formatJARVISResponse(aiResponse)}</div>
        </div>
      </div>
    `;
  } catch (error) {
    console.error('JARVIS Chat Error:', error);
    document.getElementById(loadingId).remove();
    
    messages.innerHTML += `
      <div style="display: flex; margin-bottom: 20px;">
        <div style="width: 50px; height: 50px; background: radial-gradient(circle, #ff0060, #ff4080); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2rem; box-shadow: 0 0 20px #ff0060; margin-right: 15px; flex-shrink: 0;">⚠️</div>
        <div style="flex: 1;">
          <div style="color: #ff0060; font-weight: bold; margin-bottom: 5px;">JARVIS Error</div>
          <div style="color: #ff4080; line-height: 1.6;">Technical difficulty. Error: ${error.message}</div>
        </div>
      </div>
    `;
  }
  
  input.disabled = false;
  sendBtn.disabled = false;
  sendBtn.textContent = 'SEND';
  input.focus();
  messages.scrollTop = messages.scrollHeight;
}

function formatJARVISResponse(text) {
  let html = escapeHtml(text);
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\n/g, '<br>');
  return html;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
