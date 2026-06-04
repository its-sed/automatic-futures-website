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
    
    console.log(`Fetching OilPriceAPI for: ${symbol}`);
    
    // Map your symbols to OilPriceAPI commodity codes
    const commodityMap: { [key: string]: string } = {
      "CLN26": "WTI_USD",           // Crude Oil WTI
      "BRN26": "BRENT_CRUDE_USD",   // Brent Crude
      "NGQ26": "NATURAL_GAS_USD",   // Natural Gas
      "GCQ26": "GOLD_USD",          // Gold
      "ESM26": "SILVER_USD"         // Silver
    };
    
    const commodityCode = commodityMap[symbol];
    
    if (!commodityCode) {
      return new Response(JSON.stringify({ error: `unknown symbol: ${symbol}` }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    
    console.log(`Commodity code: ${commodityCode}`);
    
    const apiKey = "52126229107b3404e36aa18edd3a7b4b13e61577b3b0367d0ce1ee8089e12409";
    
    // OilPriceAPI endpoint
    const apiUrl = `https://api.oilpriceapi.com/v1/prices/latest?by_code=${commodityCode}`;
    
    console.log('API URL:', apiUrl);
    
    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Token ${apiKey}`
      }
    });
    
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API error:', errorText);
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    console.log('OilPriceAPI response:', data);
    
    // Get the price from the response
    // API returns: { data: { WTI_USD: { price: 78.50, ... } } }
    const price = data.data?.[commodityCode]?.price || 0;
    
    console.log('Extracted price:', price);
    
    if (!price || price === 0) {
      console.warn('No price data for commodity:', commodityCode);
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
