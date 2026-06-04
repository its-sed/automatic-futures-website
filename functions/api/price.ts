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
      "CLN26": "WTI_USD",
      "BRN26": "BRENT_CRUDE_USD",
      "NGQ26": "NATURAL_GAS_USD",
      "GCQ26": "GOLD_USD",
      "ESM26": "SILVER_USD"
    };
    
    const commodityCode = commodityMap[symbol];
    
    if (!commodityCode) {
      return new Response(JSON.stringify({ error: `unknown symbol: ${symbol}` }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    
    console.log(`Commodity code: ${commodityCode}`);
    
    // Use demo API (no auth required)
    const apiUrl = "https://api.oilpriceapi.com/v1/demo/prices";
    
    console.log('Fetching from OilPriceAPI...');
    
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Find the price for this commodity in the prices array
    const commodityData = data.data.prices.find((p: any) => p.code === commodityCode);
    
    console.log('Found commodity data:', commodityData);
    
    if (!commodityData) {
      console.warn('Commodity not found:', commodityCode);
      return new Response(JSON.stringify({ price: 50 }), {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }
    
    const price = commodityData.price;
    
    console.log(`Price for ${commodityCode}: ${price}`);
    
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
