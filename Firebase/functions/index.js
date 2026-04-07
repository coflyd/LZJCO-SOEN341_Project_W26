const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const {
  applyCorsHeaders,
  isPreflightRequest,
  hasValidMealRequest,
  buildRecipePrompt,
  buildOpenAiRequestOptions,
  parseOpenAiRecipeResponse
} = require("./recipeGeneration.helpers");

// Define the secret for OpenAI API key
const openaiApiKey = defineSecret("OPENAI_API_KEY");

exports.generateRecipes = onRequest(
  {
    invoker: "public",
    secrets: [openaiApiKey]
  },
  async (request, response) => {

    // Set CORS headers first, before any other logic
    applyCorsHeaders(response);
    
    // Handle preflight requests
    if (isPreflightRequest(request.method)) {
      console.log("Handling OPTIONS request");
      return response.status(204).send("");
    }

    console.log("Request method:", request.method);
    console.log("Request body:", request.body);

    const { ingredients, calories } = request.body;

    if (!hasValidMealRequest({ ingredients, calories })) {
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

    const prompt = buildRecipePrompt(ingredients, calories);

    console.log("About to call OpenAI API");
    console.log("Prompt:", prompt);

    try {

      const openaiResponse = await fetch(
        "https://api.openai.com/v1/chat/completions",
        buildOpenAiRequestOptions(API_KEY, prompt)
      );

      console.log("OpenAI response status:", openaiResponse.status);
      console.log("OpenAI response ok:", openaiResponse.ok);

      const result = await openaiResponse.json();
      console.log("OpenAI result:", result);

      const text = parseOpenAiRecipeResponse(result);
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
