const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");

// Define the secret for OpenAI API key
const openaiApiKey = defineSecret("OPENAI_API_KEY");

exports.generateRecipes = onRequest(
  {
    invoker: "public",
    secrets: [openaiApiKey]
  },
  async (request, response) => {

    // Set CORS headers first, before any other logic
    response.set("Access-Control-Allow-Origin", "*");
    response.set("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    response.set("Access-Control-Allow-Headers", "Content-Type,Authorization,X-Requested-With,Accept,Origin,Referer,User-Agent");
    response.set("Access-Control-Max-Age", "3600");
    
    // Handle preflight requests
    if (request.method === "OPTIONS") {
      console.log("Handling OPTIONS request");
      return response.status(204).send("");
    }

    console.log("Request method:", request.method);
    console.log("Request body:", request.body);

    const { ingredients, calories } = request.body;

    if (!ingredients || !calories) {
      console.log("Missing ingredients or calories:", { ingredients, calories });
      return response.status(400).json({
        error: "Ingredients and calories are required"
      });
    }

    const API_KEY = openaiApiKey.value();

    console.log("API_KEY exists:", !!API_KEY);
    console.log("API_KEY starts with:", API_KEY ? API_KEY.substring(0, 10) + "..." : "null");

    if (!API_KEY) {
      console.log("OpenAI API key not configured");
      return response.status(500).json({
        error: "OpenAI API key not configured"
      });
    }

    const prompt = `
Generate 3 healthy meal recipes.

Ingredients available: ${ingredients}
Target calories per meal: ${calories}

Return ONLY JSON in this format:

{
 "recipes":[
  {
   "name":"",
   "ingredients":[{"name":"","amount":""}],
   "steps":[],
   "calories":0
  }
 ]
}
`;

    console.log("About to call OpenAI API");
    console.log("Prompt:", prompt);

    try {

      const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.7
        })
      });

      console.log("OpenAI response status:", openaiResponse.status);
      console.log("OpenAI response ok:", openaiResponse.ok);

      const result = await openaiResponse.json();
      console.log("OpenAI result:", result);

      if (!result.choices || result.choices.length === 0) {
        console.log("Invalid OpenAI response - no choices:", result);
        throw new Error("Invalid OpenAI response");
      }

      const text = result.choices[0].message.content;
      console.log("Generated text:", text);

      return response.json({ text });

    } catch (error) {

      console.error("AI generation failed:", error);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);

      return response.status(500).json({
        error: "AI generation failed: " + error.message
      });
    }
  }
);