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
    
    console.log(`Fetching CommodityPriceAPI for: ${symbol}`);
    
    // Map your symbols to CommodityPriceAPI commodity names
    const commodityMap: { [key: string]: string } = {
      "CLN26": "WTIOIL",      // Crude Oil (WTI)
      "BRN26": "BRENT",       // Brent Oil
      "NGQ26": "NATGAS",      // Natural Gas
      "GCQ26": "GOLD",        // Gold
      "ESM26": "SILVER"       // Silver (fallback for S&P 500)
    };
    
    const commodity = commodityMap[symbol];
    
    if (!commodity) {
      return new Response(JSON.stringify({ error: `unknown symbol: ${symbol}` }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    
    console.log(`Commodity name: ${commodity}`);
    
    // CommodityPriceAPI endpoint
    const apiKey = "755371df-32e9-4940-96d3-381cd9e94d36";
    const apiUrl = `https://api.commoditypriceapi.com/v2/rates/latest?symbols=${commodity}&x-api-key=${apiKey}`;
    
    console.log('API URL:', apiUrl);
    
    const response = await fetch(apiUrl);
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API error:', errorText);
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    console.log('CommodityPriceAPI response:', data);
    
    // Get the price from the response
    // API returns: { rates: { GOLD: { price: 2034.50, ... } } }
    const price = data.rates?.[commodity]?.price || data.rates?.[commodity]?.last_price || 0;
    
    console.log('Extracted price:', price);
    
    if (!price || price === 0) {
      console.warn('No price data for commodity:', commodity);
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
