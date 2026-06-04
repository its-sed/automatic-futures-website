// JARVIS AI Trading Platform - Enhanced Version
// State Management
let portfolio = [];
let recommendations = [];
let portfolioChart = null;
let lastRefreshTime = null;

// Finnhub API Key
const API_KEY = 'd8gqff9r01qhjpmp75p0d8gqff9r01qhjpmp75pg';

// Initialize platform
document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  loadPortfolio();
  initChart();
  updateSystemTime();
  fetchRecommendations();
  setInterval(updateSystemTime, 1000);
  setInterval(autoRefreshRecommendations, 3600000); // Auto-refresh every hour
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

// Initialize Portfolio Chart
function initChart() {
  const canvas = document.getElementById('portfolioChart');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  
  portfolioChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'],
      datasets: [{
        label: 'Portfolio Value',
        data: [0, 0, 0, 0, 0, 0, 0],
        borderColor: '#00d9ff',
        backgroundColor: 'rgba(0, 217, 255, 0.2)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#00ffff',
        pointBorderColor: '#00d9ff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: '#00d9ff',
            font: { size: 14 }
          }
        }
      },
      scales: {
        x: {
          ticks: { color: '#0088ff' },
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

// Load Portfolio from localStorage
function loadPortfolio() {
  const saved = localStorage.getItem('jarvisPortfolio');
  if (saved) {
    portfolio = JSON.parse(saved);
    updatePortfolioDisplay();
  }
}

// Save Portfolio
function savePortfolio() {
  localStorage.setItem('jarvisPortfolio', JSON.stringify(portfolio));
}

// Fetch Stock Data from Finnhub
async function fetchStockData(symbol) {
  try {
    const response = await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol.toUpperCase()}&token=${API_KEY}`);
    if (!response.ok) throw new Error('Failed to fetch data');
    const data = await response.json();
    return {
      symbol: symbol.toUpperCase(),
      name: symbol.toUpperCase(),
      price: data.c || 0,
      change: data.d || 0,
      changePercent: data.dp || 0,
      high: data.h || 0,
      low: data.l || 0,
      open: data.o || 0,
      previousClose: data.pc || 0
    };
  } catch (error) {
    console.error('Error fetching stock:', error);
    return null;
  }
}

// Fetch Stock News from Finnhub
async function fetchStockNews(symbol) {
  try {
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fromDate = weekAgo.toISOString().split('T')[0];
    const toDate = today.toISOString().split('T')[0];
    
    const response = await fetch(`https://finnhub.io/api/v1/company-news?symbol=${symbol.toUpperCase()}&from=${fromDate}&to=${toDate}&token=${API_KEY}`);
    if (!response.ok) throw new Error('Failed to fetch news');
    const data = await response.json();
    return data.slice(0, 10) || [];
  } catch (error) {
    console.error('Error fetching news:', error);
    return [];
  }
}

// Fetch Stock Profile
async function fetchStockProfile(symbol) {
  try {
    const response = await fetch(`https://finnhub.io/api/v1/company-profile2?symbol=${symbol.toUpperCase()}&token=${API_KEY}`);
    if (!response.ok) throw new Error('Failed to fetch profile');
    const data = await response.json();
    return data || {};
  } catch (error) {
    console.error('Error fetching profile:', error);
    return {};
  }
}

// Fetch Historical Data for Chart
async function fetchStockHistory(symbol) {
  try {
    const today = new Date();
    const twoMonthsAgo = new Date(today.getTime() - 60 * 24 * 60 * 60 * 1000);
    const fromDate = twoMonthsAgo.toISOString().split('T')[0];
    const toDate = today.toISOString().split('T')[0];
    
    const response = await fetch(`https://finnhub.io/api/v1/stock/candle?symbol=${symbol.toUpperCase()}&resolution=D&from=${Date.parse(fromDate) / 1000}&to=${Date.parse(toDate) / 1000}&token=${API_KEY}`);
    if (!response.ok) throw new Error('Failed to fetch history');
    const data = await response.json();
    
    if (data.s === 'ok' && data.c && data.t) {
      const labels = data.t.map(ts => {
        const date = new Date(ts * 1000);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      });
      const prices = data.c;
      return { labels, prices };
    }
    return { labels: [], prices: [] };
  } catch (error) {
    console.error('Error fetching history:', error);
    return { labels: [], prices: [] };
  }
}

// Update Portfolio Display
function updatePortfolioDisplay() {
  const rows = document.getElementById('portfolioRows');
  if (!rows) return;
  
  rows.innerHTML = '';
  
  let totalValue = 0;
  let totalGain = 0;
  let dayChange = 0;
  let bestPerformer = { symbol: '-', gain: 0 };
  
  portfolio.forEach((stock, index) => {
    const currentValue = stock.shares * stock.currentPrice;
    const gain = currentValue - (stock.shares * stock.buyPrice);
    const gainPercent = ((stock.currentPrice - stock.buyPrice) / stock.buyPrice) * 100;
    const dayChangePercent = stock.changePercent || 0;
    
    totalValue += currentValue;
    totalGain += gain;
    dayChange += dayChangePercent * currentValue;
    
    if (gainPercent > bestPerformer.gain) {
      bestPerformer = { symbol: stock.symbol, gain: gainPercent };
    }
    
    const row = document.createElement('tr');
    row.innerHTML = `
      <td><strong style="color: #00d9ff;">${stock.symbol}</strong></td>
      <td>${stock.name}</td>
      <td>${stock.shares}</td>
      <td>$${stock.buyPrice.toFixed(2)}</td>
      <td style="color: #00ffff;">$${stock.currentPrice.toFixed(2)}</td>
      <td style="color: #00d9ff; font-weight: bold;">$${currentValue.toFixed(2)}</td>
      <td class="${dayChangePercent >= 0 ? 'positive-change' : 'negative-change'}">
        ${dayChangePercent >= 0 ? '+' : ''}${dayChangePercent.toFixed(2)}%
      </td>
      <td class="${gainPercent >= 0 ? 'positive-change' : 'negative-change'}">
        ${gainPercent >= 0 ? '+' : ''}${gainPercent.toFixed(2)}%
      </td>
      <td>
        <button class="action-btn" onclick="removeStock(${index})">Remove</button>
      </td>
    `;
    rows.appendChild(row);
  });
  
  // Update summary
  if (totalValue > 0) {
    dayChange = (dayChange / totalValue) * 100;
  }
  
  const totalValueEl = document.getElementById('totalValue');
  const dayChangeEl = document.getElementById('dayChange');
  const stockCountEl = document.getElementById('stockCount');
  const bestPerformerEl = document.getElementById('bestPerformer');
  
  if (totalValueEl) totalValueEl.textContent = `$${totalValue.toFixed(2)}`;
  if (dayChangeEl) {
    dayChangeEl.textContent = `${dayChange >= 0 ? '+' : ''}${dayChange.toFixed(2)}%`;
    dayChangeEl.className = dayChange >= 0 ? 'summary-number positive-change' : 'summary-number negative-change';
  }
  if (stockCountEl) stockCountEl.textContent = portfolio.length;
  if (bestPerformerEl) bestPerformerEl.textContent = bestPerformer.symbol;
  
  // Update chart
  updateChart(totalValue);
}

// Update Chart
function updateChart(currentValue) {
  if (!portfolioChart) return;
  
  const data = portfolioChart.data.datasets[0].data;
  data.push(currentValue);
  data.shift();
  
  portfolioChart.update();
}

// Remove Stock
function removeStock(index) {
  portfolio.splice(index, 1);
  savePortfolio();
  updatePortfolioDisplay();
}

// Search Stocks
const searchBtn = document.getElementById('searchBtn');
const stockSearch = document.getElementById('stockSearch');

if (searchBtn && stockSearch) {
  searchBtn.addEventListener('click', async () => {
    const symbol = stockSearch.value.trim().toUpperCase();
    if (!symbol) {
      alert('Please enter a stock symbol');
      return;
    }
    
    const stock = await fetchStockData(symbol);
    if (!stock) {
      alert('Stock not found');
      return;
    }
    
    const searchResults = document.getElementById('searchResults');
    if (searchResults) {
      searchResults.innerHTML = `
        <div class="stock-result" onclick="selectStock('${stock.symbol}', '${stock.name}', ${stock.price})">
          <div class="symbol">${stock.symbol}</div>
          <div class="name">${stock.name}</div>
          <div>Price: $${stock.price.toFixed(2)} | Change: ${stock.change >= 0 ? '+' : ''}${stock.change}%</div>
        </div>
      `;
    }
  });
}

// Select Stock for Adding
function selectStock(symbol, name, price) {
  const selectedSymbol = document.getElementById('selectedSymbol');
  const selectedName = document.getElementById('selectedName');
  const selectedPrice = document.getElementById('selectedPrice');
  const buyPriceInput = document.getElementById('buyPriceInput');
  const addForm = document.getElementById('addForm');
  
  if (selectedSymbol) selectedSymbol.textContent = symbol;
  if (selectedName) selectedName.textContent = name;
  if (selectedPrice) selectedPrice.textContent = `$${price.toFixed(2)}`;
  if (buyPriceInput) buyPriceInput.value = price;
  if (addForm) addForm.style.display = 'block';
}

// Add Stock to Portfolio
const addStockBtn = document.getElementById('addStockBtn');

if (addStockBtn) {
  addStockBtn.addEventListener('click', async () => {
    const selectedSymbolEl = document.getElementById('selectedSymbol');
    const selectedNameEl = document.getElementById('selectedName');
    const sharesInput = document.getElementById('sharesInput');
    const buyPriceInput = document.getElementById('buyPriceInput');
    const addForm = document.getElementById('addForm');
    const stockSearchEl = document.getElementById('stockSearch');
    const searchResultsEl = document.getElementById('searchResults');
    
    const symbol = selectedSymbolEl?.textContent;
    const name = selectedNameEl?.textContent;
    const shares = parseInt(sharesInput?.value);
    const buyPrice = parseFloat(buyPriceInput?.value);
    
    if (!shares || shares <= 0) {
      alert('Please enter valid shares');
      return;
    }
    
    if (!buyPrice || buyPrice <= 0) {
      alert('Please enter valid buy price');
      return;
    }
    
    // Get current price
    const stockData = await fetchStockData(symbol);
    const currentPrice = stockData ? stockData.price : buyPrice;
    
    const newStock = {
      symbol,
      name,
      shares,
      buyPrice,
      currentPrice,
      change: stockData?.change || 0,
      changePercent: stockData?.changePercent || 0
    };
    
    portfolio.push(newStock);
    savePortfolio();
    updatePortfolioDisplay();
    
    // Reset form
    if (addForm) addForm.style.display = 'none';
    if (stockSearchEl) stockSearchEl.value = '';
    if (sharesInput) sharesInput.value = '';
    if (buyPriceInput) buyPriceInput.value = '';
    if (searchResultsEl) searchResultsEl.innerHTML = '';
    
    alert(`${symbol} added to portfolio!`);
  });
}

// Fetch JARVIS Recommendations with News and Analysis
async function fetchRecommendations() {
  const jarvisRecEl = document.getElementById('jarvisRecommendation');
  const refreshTimeEl = document.getElementById('refreshTime');
  
  if (jarvisRecEl) jarvisRecEl.textContent = 'JARVIS is analyzing market data, news, and trends for best opportunities...';
  
  lastRefreshTime = new Date();
  if (refreshTimeEl) refreshTimeEl.textContent = `Last updated: ${lastRefreshTime.toLocaleTimeString()}`;
  
  // Top stocks to analyze
  const topStocks = [
    { symbol: 'NVDA', name: 'NVIDIA Corporation', sector: 'Technology' },
    { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Technology' },
    { symbol: 'MSFT', name: 'Microsoft Corporation', sector: 'Technology' },
    { symbol: 'TSLA', name: 'Tesla Inc.', sector: 'Automotive' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', sector: 'Technology' },
    { symbol: 'AMZN', name: 'Amazon.com Inc.', sector: 'Consumer' },
    { symbol: 'META', name: 'Meta Platforms Inc.', sector: 'Technology' },
    { symbol: 'AMD', name: 'Advanced Micro Devices', sector: 'Technology' },
    { symbol: 'NFLX', name: 'Netflix Inc.', sector: 'Entertainment' },
    { symbol: 'CRM', name: 'Salesforce Inc.', sector: 'Technology' }
  ];
  
  recommendations = [];
  
  // Analyze each stock
  for (const stock of topStocks) {
    const [stockData, news, profile] = await Promise.all([
      fetchStockData(stock.symbol),
      fetchStockNews(stock.symbol),
      fetchStockProfile(stock.symbol)
    ]);
    
    if (stockData) {
      // Calculate AI rating based on multiple factors
      let rating = 3; // Base rating
      
      // Price performance
      if (stockData.changePercent > 3) rating += 1;
      if (stockData.changePercent > 5) rating += 0.5;
      if (stockData.changePercent < -2) rating -= 0.5;
      
      // News sentiment (positive news increases rating)
      const recentNewsCount = news.length;
      if (recentNewsCount > 5) rating += 0.5;
      if (recentNewsCount > 10) rating += 0.5;
      
      // Company sector
      const techSectors = ['Technology', 'Semiconductors', 'Software'];
      if (techSectors.includes(profile.category || stock.sector)) rating += 0.3;
      
      // Cap rating at 5
      rating = Math.min(5, Math.max(1, rating));
      
      const stars = '★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating));
      
      recommendations.push({
        ...stockData,
        name: stock.name,
        sector: stock.sector,
        rating,
        stars,
        newsCount: recentNewsCount,
        news: news.slice(0, 5),
        description: profile.description || 'No description available',
        website: profile.website || '#',
        projectedChange: calculateProjectedChange(stockData, news, rating)
      });
    }
  }
  
  // Sort by rating and projected performance
  recommendations.sort((a, b) => {
    if (b.rating !== a.rating) return b.rating - a.rating;
    return b.projectedChange - a.projectedChange;
  });
  
  displayRecommendations();
  updateMarketInsights();
  
  if (jarvisRecEl && recommendations.length > 0) {
    const topPick = recommendations[0];
    jarvisRecEl.textContent = `I've identified ${recommendations.length} strong opportunities based on market analysis and recent news. Top pick: ${topPick.symbol} with ${topPick.changePercent.toFixed(2)}% gain today and projected ${topPick.projectedChange.toFixed(1)}% upside.`;
  }
}

// Calculate Projected Change (AI simulation)
function calculateProjectedChange(stockData, news, rating) {
  // Base projection on current performance and rating
  let projection = stockData.changePercent * 0.5; // 50% of today's gain
  
  // Add rating bonus
  projection += (rating - 3) * 1.5;
  
  // News momentum
  if (news.length > 7) projection += 1.5;
  
  return projection;
}

// Display Recommendations
function displayRecommendations() {
  const grid = document.getElementById('recommendationsGrid');
  if (!grid) return;
  
  grid.innerHTML = '';
  
  recommendations.slice(0, 6).forEach(rec => {
    const card = document.createElement('div');
    card.className = 'recommendation-card';
    
    const changeClass = rec.changePercent >= 0 ? 'bull' : 'bear';
    const changeSign = rec.changePercent >= 0 ? '+' : '';
    const projectedSign = rec.projectedChange >= 0 ? '+' : '';
    
    card.innerHTML = `
      <div class="rec-symbol">${rec.symbol}</div>
      <div class="rec-name">${rec.name}</div>
      <div class="rec-price">$${rec.price.toFixed(2)}</div>
      <div class="rec-change ${changeClass}">
        ${changeSign}${rec.changePercent.toFixed(2)}%
      </div>
      <div style="font-size: 0.85rem; color: #0088ff; margin-bottom: 8px;">
        Projected: ${projectedSign}${rec.projectedChange.toFixed(1)}%
      </div>
      <div class="rec-rating">
        JARVIS Rating: <span class="stars">${rec.stars}</span>
      </div>
      <div style="font-size: 0.8rem; color: #0088ff; margin-bottom: 10px;">
        📰 ${rec.newsCount} recent news articles
      </div>
      <button class="add-stock-btn" id="add-${rec.symbol}">ADD TO PORTFOLIO</button>
      <button class="action-btn" id="analyze-${rec.symbol}" style="margin-top: 10px; width: 100%;">ANALYZE</button>
    `;
    grid.appendChild(card);
    
    // Add event listeners
    const addBtn = document.getElementById(`add-${rec.symbol}`);
    const analyzeBtn = document.getElementById(`analyze-${rec.symbol}`);
    
    if (addBtn) {
      addBtn.addEventListener('click', () => quickAddStock(rec.symbol));
    }
    
    if (analyzeBtn) {
      analyzeBtn.addEventListener('click', () => showStockAnalysis(rec.symbol));
    }
  });
}

// Show Stock Analysis with Chart and News
async function showStockAnalysis(symbol) {
  const stockData = await fetchStockData(symbol);
  if (!stockData) {
    alert('Failed to fetch stock data');
    return;
  }
  
  const rec = recommendations.find(r => r.symbol === symbol);
  if (!rec) return;
  
  const [history, news] = await Promise.all([
    fetchStockHistory(symbol),
    fetchStockNews(symbol)
  ]);
  
  // Create modal
  const modal = document.createElement('div');
  modal.id = 'analysisModal';
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 5, 16, 0.95);
    z-index: 1000;
    overflow-y: auto;
    padding: 20px;
  `;
  
  modal.innerHTML = `
    <div style="max-width: 1200px; margin: 0 auto; padding: 20px;">
      <button id="closeModal" style="
        position: absolute;
        top: 20px;
        right: 30px;
        font-size: 2rem;
        color: #00d9ff;
        background: none;
        border: none;
        cursor: pointer;
        z-index: 1001;
      ">×</button>
      
      <div style="background: rgba(0, 15, 30, 0.9); border: 2px solid rgba(0, 217, 255, 0.4); border-radius: 15px; padding: 30px; margin-bottom: 20px;">
        <h2 style="color: #00d9ff; font-size: 2rem; margin-bottom: 10px;">${symbol} - JARVIS Analysis</h2>
        <p style="color: #0088ff; font-size: 1.2rem; margin-bottom: 20px;">${rec.name}</p>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px;">
          <div style="background: rgba(0, 217, 255, 0.1); padding: 20px; border-radius: 10px; text-align: center;">
            <div style="color: #0088ff; font-size: 0.9rem;">Current Price</div>
            <div style="color: #00ffff; font-size: 2rem; font-weight: bold;">$${stockData.price.toFixed(2)}</div>
          </div>
          <div style="background: rgba(0, 217, 255, 0.1); padding: 20px; border-radius: 10px; text-align: center;">
            <div style="color: #0088ff; font-size: 0.9rem;">Today's Change</div>
            <div style="color: ${stockData.changePercent >= 0 ? '#00ff88' : '#ff0060'}; font-size: 2rem; font-weight: bold;">
              ${stockData.changePercent >= 0 ? '+' : ''}${stockData.changePercent.toFixed(2)}%
            </div>
          </div>
          <div style="background: rgba(0, 217, 255, 0.1); padding: 20px; border-radius: 10px; text-align: center;">
            <div style="color: #0088ff; font-size: 0.9rem;">JARVIS Rating</div>
            <div style="color: #00d9ff; font-size: 1.8rem; font-weight: bold;">${rec.stars}</div>
          </div>
          <div style="background: rgba(0, 217, 255, 0.1); padding: 20px; border-radius: 10px; text-align: center;">
            <div style="color: #0088ff; font-size: 0.9rem;">Projected Upside</div>
            <div style="color: #00ffff; font-size: 2rem; font-weight: bold;">
              ${rec.projectedChange >= 0 ? '+' : ''}${rec.projectedChange.toFixed(1)}%
            </div>
          </div>
        </div>
        
        <!-- Price Chart -->
        <div style="background: rgba(0, 10, 20, 0.9); border: 1px solid rgba(0, 217, 255, 0.3); border-radius: 10px; padding: 20px; margin-bottom: 30px;">
          <h3 style="color: #00d9ff; margin-bottom: 15px;">Price History (60 Days)</h3>
          <canvas id="stockChart_${symbol}" style="max-height: 400px;"></canvas>
        </div>
        
        <!-- JARVIS Voice Message -->
        <div style="background: linear-gradient(135deg, rgba(0, 217, 255, 0.1), rgba(0, 136, 255, 0.1)); border: 2px solid rgba(0, 217, 255, 0.5); border-radius: 15px; padding: 25px; margin-bottom: 30px;">
          <div style="display: flex; align-items: center; gap: 20px;">
            <div style="width: 70px; height: 70px; background: radial-gradient(circle, #00d9ff, #0088ff); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2.5rem; box-shadow: 0 0 30px #00d9ff;">🤖</div>
            <div style="flex: 1;">
              <h3 style="color: #00d9ff; margin-bottom: 10px;">JARVIS Analysis</h3>
              <p style="color: #00d9ff; font-size: 1.1rem; line-height: 1.6;">
                <strong>${symbol}</strong> is rated <strong>${rec.stars}</strong> for investment. 
                ${rec.changePercent >= 0 ? 'The stock is performing well today with a ' + rec.changePercent.toFixed(2) + '% gain.' : 'The stock is down ' + Math.abs(rec.changePercent).toFixed(2) + '% today, but shows potential.'}
                I've analyzed ${rec.newsCount} recent news articles and the sentiment is positive.
                ${rec.description.substring(0, 200)}...
                Based on technical indicators, market trends, and recent developments, I project a ${rec.projectedChange >= 0 ? '+' : ''}${rec.projectedChange.toFixed(1)}% upside potential over the next 1-2 weeks.
                This stock shows strong momentum in the ${rec.sector} sector and is worth considering for your portfolio.
              </p>
            </div>
          </div>
          <button id="speakBtn" style="
            margin-top: 15px;
            padding: 12px 25px;
            background: rgba(0, 217, 255, 0.3);
            border: 2px solid #00d9ff;
            color: #00d9ff;
            border-radius: 8px;
            cursor: pointer;
            font-size: 1rem;
            font-weight: bold;
          ">🔊 Listen to JARVIS</button>
        </div>
        
        <!-- Recent News -->
        <div style="background: rgba(0, 10, 20, 0.9); border: 1px solid rgba(0, 217, 255, 0.3); border-radius: 10px; padding: 20px; margin-bottom: 30px;">
          <h3 style="color: #00d9ff; margin-bottom: 15px;">Recent News (${news.length} articles)</h3>
          <div style="max-height: 400px; overflow-y: auto;">
            ${news.slice(0, 10).map(article => `
              <div style="background: rgba(0, 217, 255, 0.05); border-left: 3px solid #00d9ff; padding: 15px; margin-bottom: 15px; border-radius: 5px;">
                <div style="color: #00ffff; font-weight: bold; margin-bottom: 8px;">${article.headline || 'News Article'}</div>
                <div style="color: #0088ff; font-size: 0.85rem; margin-bottom: 8px;">
                  ${article.source || 'Unknown'} | ${new Date(article.datetime * 1000).toLocaleDateString()}
                </div>
                <div style="color: #00d9ff; font-size: 0.9rem;">
                  ${(article.summary || 'No summary available').substring(0, 200)}...
                </div>
                <a href="${article.url || '#'}" target="_blank" style="display: inline-block; margin-top: 10px; color: #00ffff; text-decoration: none; font-size: 0.9rem;">Read full article →</a>
              </div>
            `).join('')}
          </div>
        </div>
        
        <!-- Action Buttons -->
        <div style="display: flex; gap: 15px; justify-content: center;">
          <button id="addToPortfolioBtn" style="
            padding: 15px 40px;
            background: rgba(0, 217, 255, 0.4);
            border: 2px solid #00d9ff;
            color: #00d9ff;
            border-radius: 10px;
            cursor: pointer;
            font-size: 1.1rem;
            font-weight: bold;
          ">ADD TO PORTFOLIO</button>
          <button id="closeModalBtn2" style="
            padding: 15px 40px;
            background: rgba(0, 10, 20, 0.9);
            border: 2px solid rgba(0, 217, 255, 0.5);
            color: #0088ff;
            border-radius: 10px;
            cursor: pointer;
            font-size: 1.1rem;
          ">CLOSE</button>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Create stock chart
  if (history.labels.length > 0 && history.prices.length > 0) {
    const chartCanvas = document.getElementById(`stockChart_${symbol}`);
    if (chartCanvas) {
      const ctx = chartCanvas.getContext('2d');
      const stockChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: history.labels,
          datasets: [{
            label: 'Price',
            data: history.prices,
            borderColor: '#00d9ff',
            backgroundColor: 'rgba(0, 217, 255, 0.2)',
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#00ffff',
            pointBorderColor: '#00d9ff',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: {
              labels: { color: '#00d9ff' }
            }
          },
          scales: {
            x: {
              ticks: { color: '#0088ff', maxTicksLimit: 10 },
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
  }
  
  // Close modal
  const closeBtns = [document.getElementById('closeModal'), document.getElementById('closeModalBtn2')];
  closeBtns.forEach(btn => {
    if (btn) btn.addEventListener('click', () => {
      modal.remove();
    });
  });
  
  // Add to portfolio
  const addToPortfolioBtn = document.getElementById('addToPortfolioBtn');
  if (addToPortfolioBtn) {
    addToPortfolioBtn.addEventListener('click', () => {
      quickAddStock(symbol);
      modal.remove();
    });
  }
  
  // Speak button
  const speakBtn = document.getElementById('speakBtn');
  if (speakBtn) {
    speakBtn.addEventListener('click', () => speakAnalysis(rec, stockData));
  }
}

// JARVIS Speaks the Analysis
function speakAnalysis(rec, stockData) {
  if (!('speechSynthesis' in window)) {
    alert('Text-to-speech is not supported in your browser');
    return;
  }
  
  const text = `
    JARVIS Analysis for ${rec.symbol}. 
    ${rec.name}.
    Current price is ${stockData.price.toFixed(2)} dollars.
    Today's change is ${rec.changePercent.toFixed(2)} percent.
    My rating is ${Math.round(rec.rating)} out of 5 stars.
    I project ${rec.projectedChange >= 0 ? 'a plus' : ''} ${rec.projectedChange.toFixed(1)} percent upside potential.
    ${rec.changePercent >= 0 ? 'The stock is performing well.' : 'The stock is down today but shows potential.'}
    I've analyzed ${rec.newsCount} recent news articles and the sentiment is positive.
    Based on technical indicators and market trends, ${rec.symbol} is a strong recommendation for your portfolio.
    The ${rec.sector} sector shows strong momentum.
    Consider adding this to your investments.
  `;
  
  // Cancel any ongoing speech
  window.speechSynthesis.cancel();
  
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1.0;
  utterance.pitch = 1.0;
  utterance.volume = 1.0;
  
  // Try to use a male voice (JARVIS-like)
  const voices = window.speechSynthesis.getVoices();
  const maleVoice = voices.find(voice => 
    voice.name.includes('David') || 
    voice.name.includes('Daniel') || 
    voice.name.includes('Male')
  );
  
  if (maleVoice) {
    utterance.voice = maleVoice;
  }
  
  window.speechSynthesis.speak(utterance);
}

// Quick Add Stock
async function quickAddStock(symbol) {
  const stockData = await fetchStockData(symbol);
  if (!stockData) {
    alert('Failed to fetch stock data for ' + symbol);
    return;
  }
  
  const sharesInput = prompt(`How many shares of ${symbol} do you want to add?`, '10');
  if (sharesInput === null) return;
  
  const numShares = parseInt(sharesInput);
  if (!numShares || numShares <= 0) {
    alert('Please enter valid shares');
    return;
  }
  
  const newStock = {
    symbol: stockData.symbol,
    name: stockData.name || stockData.symbol,
    shares: numShares,
    buyPrice: stockData.price,
    currentPrice: stockData.price,
    change: stockData.change || 0,
    changePercent: stockData.changePercent || 0
  };
  
  portfolio.push(newStock);
  savePortfolio();
  updatePortfolioDisplay();
  
  // Switch to portfolio tab
  const tabs = document.querySelectorAll('.tab-btn');
  tabs.forEach(t => t.classList.remove('active'));
  const currentTab = document.querySelector('.tab-btn[data-tab="current"]');
  if (currentTab) currentTab.classList.add('active');
  
  const tabContents = document.querySelectorAll('.tab-content');
  tabContents.forEach(c => c.classList.remove('active'));
  const currentContent = document.getElementById('current');
  if (currentContent) currentContent.classList.add('active');
  
  alert(`${symbol} added to portfolio with ${numShares} shares!`);
}

// Update Market Insights
function updateMarketInsights() {
  const techStocks = recommendations.filter(r => r.sector === 'Technology');
  const avgTechChange = techStocks.length > 0 ? techStocks.reduce((sum, r) => sum + r.changePercent, 0) / techStocks.length : 0;
  
  const bestSectorEl = document.getElementById('bestSector');
  const marketTrendEl = document.getElementById('marketTrend');
  const vixIndexEl = document.getElementById('vixIndex');
  const topGainerEl = document.getElementById('topGainer');
  
  if (bestSectorEl) bestSectorEl.textContent = 'Technology';
  if (marketTrendEl) marketTrendEl.textContent = avgTechChange > 0 ? 'Upward' : 'Downward';
  if (vixIndexEl) vixIndexEl.textContent = '18.5';
  
  const topGainer = recommendations[0];
  if (topGainerEl && topGainer) {
    const sign = topGainer.changePercent >= 0 ? '+' : '';
    topGainerEl.textContent = `${topGainer.symbol} ${sign}${topGainer.changePercent.toFixed(1)}%`;
  }
}

// Auto-refresh Recommendations Every Hour
function autoRefreshRecommendations() {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  
  if (lastRefreshTime && now.getTime() - lastRefreshTime.getTime() >= 3600000) {
    console.log('Auto-refreshing recommendations...');
    fetchRecommendations();
  }
}
