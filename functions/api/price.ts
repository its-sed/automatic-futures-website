export async function onRequestGet({ request, env }) {
  try {
    const url = new URL(request.url);
    const symbol = url.searchParams.get("symbol");
    
    if (!symbol) {
      return new Response(JSON.stringify({ error: "symbol required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    
    console.log(`Fetching price for: ${symbol}`);
    
    // Finnhub API for stock/ETF quotes
    // Note: Finnhub free tier works best for stocks/ETFs, not commodity futures
    // Using symbol as-is (you may need to adjust for specific futures contracts)
    const apiUrl = `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${env.FINNHUB_API_KEY}`;
    
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Finnhub response:', data);
    
    // Finnhub returns 'c' for current price
    const price = data.c || data.price || 0;
    
    if (!price || price === 0) {
      console.warn('No price data for symbol:', symbol);
      // Return a default/mock price if no data
      return new Response(JSON.stringify({ price: 50 }), {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }
    
    return new Response(JSON.stringify({ price }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
