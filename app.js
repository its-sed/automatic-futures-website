// JARVIS AI Trading Platform
// State Management
let portfolio = [];
let recommendations = [];
let portfolioChart = null;

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
});

// Tab Navigation
function initTabs() {
  const tabs = document.querySelectorAll('.tab-btn');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      document.getElementById(tab.dataset.tab).classList.add('active');
    });
  });
}

// System Time
function updateSystemTime() {
  document.getElementById('currentTime').textContent = new Date().toLocaleTimeString();
}

// Initialize Portfolio Chart
function initChart() {
  const ctx = document.getElementById('portfolioChart').getContext('2d');
  
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
      changePercent: data.dp || 0
    };
  } catch (error) {
    console.error('Error fetching stock:', error);
    return null;
  }
}

// Update Portfolio Display
function updatePortfolioDisplay() {
  const rows = document.getElementById('portfolioRows');
  rows.innerHTML = '';
  
  let totalValue = 0;
  let totalGain = 0;
  let dayChange = 0;
  let bestPerformer = { symbol: '-', gain: 0 };
  
  portfolio.forEach((stock, index) => {
    const currentValue = stock.shares * stock.currentPrice;
    const gain = currentValue - (stock.shares * stock.buyPrice);
    const gainPercent = ((stock.currentPrice - stock.buyPrice) / stock.buyPrice) * 100;
    const dayChangePercent = stock.changePercent;
    
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
  dayChange = (dayChange / totalValue) * 100;
  
  document.getElementById('totalValue').textContent = `$${totalValue.toFixed(2)}`;
  document.getElementById('dayChange').textContent = `${dayChange >= 0 ? '+' : ''}${dayChange.toFixed(2)}%`;
  document.getElementById('dayChange').className = dayChange >= 0 ? 'summary-number positive-change' : 'summary-number negative-change';
  document.getElementById('stockCount').textContent = portfolio.length;
  document.getElementById('bestPerformer').textContent = bestPerformer.symbol;
  
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
document.getElementById('searchBtn').addEventListener('click', async () => {
  const symbol = document.getElementById('stockSearch').value.trim().toUpperCase();
  if (!symbol) return;
  
  const stock = await fetchStockData(symbol);
  if (!stock) {
    alert('Stock not found');
    return;
  }
  
  document.getElementById('searchResults').innerHTML = `
    <div class="stock-result" onclick="selectStock('${stock.symbol}', '${stock.name}', ${stock.price})">
      <div class="symbol">${stock.symbol}</div>
      <div class="name">${stock.name}</div>
      <div>Price: $${stock.price.toFixed(2)} | Change: ${stock.change >= 0 ? '+' : ''}${stock.change}%</div>
    </div>
  `;
});

// Select Stock for Adding
function selectStock(symbol, name, price) {
  document.getElementById('selectedSymbol').textContent = symbol;
  document.getElementById('selectedName').textContent = name;
  document.getElementById('selectedPrice').textContent = `$${price.toFixed(2)}`;
  document.getElementById('buyPriceInput').value = price;
  document.getElementById('addForm').style.display = 'block';
}

// Add Stock to Portfolio
document.getElementById('addStockBtn').addEventListener('click', async () => {
  const symbol = document.getElementById('selectedSymbol').textContent;
  const name = document.getElementById('selectedName').textContent;
  const shares = parseInt(document.getElementById('sharesInput').value);
  const buyPrice = parseFloat(document.getElementById('buyPriceInput').value);
  
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
  document.getElementById('addForm').style.display = 'none';
  document.getElementById('stockSearch').value = '';
  document.getElementById('sharesInput').value = '';
  document.getElementById('buyPriceInput').value = '';
  document.getElementById('searchResults').innerHTML = '';
  
  alert(`${symbol} added to portfolio!`);
});

// Fetch JARVIS Recommendations
async function fetchRecommendations() {
  const popupBadge = document.getElementById('jarvisRecommendation');
  popupBadge.textContent = 'Analyzing market data for best opportunities...';
  
  // Top recommended stocks (simulated based on market data)
  const topStocks = [
    { symbol: 'NVDA', name: 'NVIDIA Corporation', sector: 'Technology' },
    { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Technology' },
    { symbol: 'MSFT', name: 'Microsoft Corporation', sector: 'Technology' },
    { symbol: 'TSLA', name: 'Tesla Inc.', sector: 'Automotive' },
    { symbol: 'GOOGL', name: 'Google Inc.', sector: 'Technology' },
    { symbol: 'AMZN', name: 'Amazon.com Inc.', sector: 'Consumer' }
  ];
  
  recommendations = [];
  
  for (const stock of topStocks) {
    const data = await fetchStockData(stock.symbol);
    if (data) {
      const rating = data.changePercent > 2 ? 5 : data.changePercent > 1 ? 4 : data.changePercent > 0 ? 3 : 2;
      const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating);
      
      recommendations.push({
        ...data,
        name: stock.name,
        rating,
        stars,
        sector: stock.sector
      });
    }
  }
  
  // Sort by change percent
  recommendations.sort((a, b) => b.changePercent - a.changePercent);
  
  displayRecommendations();
  updateMarketInsights();
  
  popupBadge.textContent = `I've identified ${recommendations.length} strong opportunities. Top pick: ${recommendations[0]?.symbol} with ${recommendations[0]?.changePercent.toFixed(2)}% gain today.`;
}

// Display Recommendations
function displayRecommendations() {
  const grid = document.getElementById('recommendationsGrid');
  grid.innerHTML = '';
  
  recommendations.slice(0, 6).forEach(rec => {
    const card = document.createElement('div');
    card.className = 'recommendation-card';
    card.innerHTML = `
      <div class="rec-symbol">${rec.symbol}</div>
      <div class="rec-name">${rec.name}</div>
      <div class="rec-price">$${rec.price.toFixed(2)}</div>
      <div class="rec-change ${rec.changePercent >= 0 ? 'bull' : 'bear'}">
        ${rec.changePercent >= 0 ? '+' : ''}${rec.changePercent.toFixed(2)}%
      </div>
      <div class="rec-rating">
        JARVIS Rating: <span class="stars">${rec.stars}</span>
      </div>
      <button class="add-stock-btn" onclick="quickAddStock('${rec.symbol}')">ADD TO PORTFOLIO</button>
    `;
    grid.appendChild(card);
  });
}

// Quick Add Stock
async function quickAddStock(symbol) {
  const stockData = await fetchStockData(symbol);
  if (!stockData) {
    alert('Failed to fetch stock data');
    return;
  }
  
  const shares = prompt(`How many shares of ${symbol} do you want to add?`, '10');
  if (!shares) return;
  
  const numShares = parseInt(shares);
  if (!numShares || numShares <= 0) {
    alert('Please enter valid shares');
    return;
  }
  
  const newStock = {
    symbol: stockData.symbol,
    name: stockData.name,
    shares: numShares,
    buyPrice: stockData.price,
    currentPrice: stockData.price,
    change: stockData.change,
    changePercent: stockData.changePercent
  };
  
  portfolio.push(newStock);
  savePortfolio();
  updatePortfolioDisplay();
  
  // Switch to portfolio tab
  document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
  document.querySelector('.tab-btn[data-tab="current"]').classList.add('active');
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  document.getElementById('current').classList.add('active');
  
  alert(`${symbol} added to portfolio!`);
}

// Update Market Insights
function updateMarketInsights() {
  const techStocks = recommendations.filter(r => r.sector === 'Technology');
  const avgTechChange = techStocks.reduce((sum, r) => sum + r.changePercent, 0) / techStocks.length;
  
  document.getElementById('bestSector').textContent = 'Technology';
  document.getElementById('marketTrend').textContent = avgTechChange > 0 ? 'Upward' : 'Downward';
  document.getElementById('vixIndex').textContent = '18.5';
  
  const topGainer = recommendations[0];
  if (topGainer) {
    document.getElementById('topGainer').textContent = `${topGainer.symbol} +${topGainer.changePercent.toFixed(1)}%`;
  }
}
