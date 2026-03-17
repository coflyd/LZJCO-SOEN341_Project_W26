const { onRequest } = require("firebase-functions/v2/https");
const fetch = require("node-fetch");
require("dotenv").config();

exports.generateRecipes = onRequest(
  {
    invoker: "public"
  },
  async (request, response) => {

    // Super aggressive CORS headers - allow everything
    response.set("Access-Control-Allow-Origin", "*");
    response.set("Access-Control-Allow-Methods", "*");
    response.set("Access-Control-Allow-Headers", "*");
    response.set("Access-Control-Max-Age", "3600");
    
    // Handle preflight requests
    if (request.method === "OPTIONS") {
      response.status(204).send("");
      return;
    }

    const { ingredients, calories } = request.body;

    if (!ingredients || !calories) {
      return response.status(400).json({
        error: "Ingredients and calories are required"
      });
    }

    const API_KEY = process.env.OPENAI_API_KEY;

    if (!API_KEY) {
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

    try {

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
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

      const result = await response.json();

      if (!result.choices || result.choices.length === 0) {
        throw new Error("Invalid OpenAI response");
      }

      const text = result.choices[0].message.content;

      return response.json({ text });

    } catch (error) {

      console.error("AI generation failed:", error);

      return response.status(500).json({
        error: "AI generation failed"
      });
    }
  }
);