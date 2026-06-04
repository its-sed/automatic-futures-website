const contracts = [
  { name: "Crude Oil", symbol: "CLN26" },
  { name: "Brent Oil", symbol: "BRN26" },
  { name: "Natural Gas", symbol: "NGQ26" },
  { name: "Gold", symbol: "GCQ26" },
  { name: "S&P 500 E-mini", symbol: "ESM26" }
];

const data = {};
const rowsEl = document.getElementById("rows");
const connDot = document.getElementById("connDot");
const connText = document.getElementById("connText");
const symbolInput = document.getElementById("symbolInput");
const addBtn = document.getElementById("addBtn");
const refreshBtn = document.getElementById("refreshBtn");

function nowTime() {
  return new Date().toLocaleTimeString();
}

function calcLevels(price) {
  const p = Number(price);
  return {
    s1: (p * 0.99).toFixed(2),
    s2: (p * 0.97).toFixed(2),
    r1: (p * 1.01).toFixed(2),
    r2: (p * 1.03).toFixed(2)
  };
}

function rowClass(price, s1, r1) {
  const p = Number(price);
  const support = Number(s1);
  const resistance = Number(r1);
  if (p <= support * 1.005) return "support";
  if (p >= resistance * 0.995) return "resistance";
  return "";
}

function render() {
  rowsEl.innerHTML = contracts.map(c => {
    const row = data[c.symbol] || {};
    const price = row.price ?? "--";
    const levels = row.levels || { s1: "--", s2: "--", r1: "--", r2: "--" };
    const cls = rowClass(price, levels.s1, levels.r1);

    return `
      <tr class="${cls}">
        <td>${c.name}</td>
        <td>${c.symbol}</td>
        <td class="${cls === "support" ? "green" : cls === "resistance" ? "red" : ""}">${price}</td>
        <td>${levels.s1}</td>
        <td>${levels.s2}</td>
        <td>${levels.r1}</td>
        <td>${levels.r2}</td>
        <td>${row.updated || "--"}</td>
      </tr>
    `;
  }).join("");
}

async function fetchPrice(symbol) {
  const res = await fetch(`/api/price?symbol=${encodeURIComponent(symbol)}`);
  if (!res.ok) throw new Error("price fetch failed");
  return await res.json();
}

async function updateSymbol(symbol) {
  try {
    const json = await fetchPrice(symbol);
    const price = Number(json.price);
    data[symbol] = {
      price: price.toFixed(2),
      levels: calcLevels(price),
      updated: nowTime()
    };
    connDot.className = "dot online";
    connText.textContent = "Live";
  } catch (e) {
    data[symbol] = data[symbol] || {};
    data[symbol].updated = "fetch error";
    connDot.className = "dot offline";
    connText.textContent = "API error";
  }
  render();
}

async function refreshAll() {
  await Promise.all(contracts.map(c => updateSymbol(c.symbol)));
}

function addSymbol() {
  const symbol = symbolInput.value.trim().toUpperCase();
  if (!symbol) return;
  if (contracts.some(c => c.symbol === symbol)) return;
  contracts.push({ name: symbol, symbol });
  symbolInput.value = "";
  render();
  updateSymbol(symbol);
}

addBtn.addEventListener("click", addSymbol);
refreshBtn.addEventListener("click", refreshAll);
symbolInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") addSymbol();
});

render();
refreshAll();
setInterval(refreshAll, 15000);
