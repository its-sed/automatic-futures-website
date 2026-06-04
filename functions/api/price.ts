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
    
    console.log(`Fetching API Ninjas price for: ${symbol}`);
    
    // Map your symbols to API Ninjas commodity names
    const commodityMap: { [key: string]: string } = {
      "CLN26": "crude_oil",
      "BRN26": "brent_crude_oil", 
      "NGQ26": "natural_gas",
      "GCQ26": "gold",
      "ESM26": "silver"
    };
    
    const commodity = commodityMap[symbol];
    
    if (!commodity) {
      return new Response(JSON.stringify({ error: `unknown symbol: ${symbol}` }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    
    console.log(`Commodity name: ${commodity}`);
    
    // CORRECTED API URL: api.api-ninjas.com/v1/commodityprice?name=
    const apiUrl = `https://api.api-ninjas.com/v1/commodityprice?name=${commodity}`;
    
    console.log('API URL:', apiUrl);
    
    const response = await fetch(apiUrl, {
      headers: {
        "X-Api-Key": "AGZ2PrJO8iBeOQ7OP1RnuQJ5wOp5ez8qutAsPnM6"
      }
    });
    
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API error:', errorText);
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    console.log('API Ninjas response:', data);
    
    // Get the price from the response
    const price = data.price || 0;
    
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
