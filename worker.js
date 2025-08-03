// Cloudflare Worker for the L'Oréal Routine Builder

export default {
  /**
   * @param {Request} request
   * @param {any} env
   * @param {any} ctx
   */
  async fetch(request, env, ctx) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Content-Type": "application/json",
    };

    // Handle CORS preflight requests
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const apiKey = env.OPENAI_API_KEY; // Make sure to set this in the Cloudflare Workers dashboard
    const apiUrl = "https://api.openai.com/v1/chat/completions";
    const userInput = await request.json();

    // Add web search capability to the system message
    const messages = [...userInput.messages];
    
    // Update the first message (system message) to include web search capability
    if (messages[0] && messages[0].role === "system") {
      messages[0] = {
        role: "system",
        content: messages[0].content + " When appropriate, search the web for current information about L'Oréal products or routines. Always include links or citations in your responses."
      };
    } else {
      messages.unshift({
        role: "system",
        content: "You are a beauty expert helping customers with skincare, haircare, makeup, fragrance, and other beauty-related topics. When appropriate, search the web for current information about L'Oréal products or routines. Always include links or citations in your responses."
      });
    }

    const requestBody = {
      model: "gpt-4o",
      messages: messages,
      max_tokens: 500
    };

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();
    return new Response(JSON.stringify(data), { headers: corsHeaders });
  },
};
