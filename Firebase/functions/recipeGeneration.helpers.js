function applyCorsHeaders(response) {
  response.set("Access-Control-Allow-Origin", "*");
  response.set("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
  response.set("Access-Control-Allow-Headers", "Content-Type,Authorization,X-Requested-With,Accept,Origin,Referer,User-Agent");
  response.set("Access-Control-Max-Age", "3600");
}

function isPreflightRequest(method) {
  return method === "OPTIONS";
}

function hasValidMealRequest(body = {}) {
  return Boolean(body.ingredients && body.calories);
}

function buildRecipePrompt(ingredients, calories) {
  return `
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
}

function buildOpenAiRequestOptions(apiKey, prompt) {
  return {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
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
  };
}

function parseOpenAiRecipeResponse(result) {
  if (!result.choices || result.choices.length === 0) {
    throw new Error("Invalid OpenAI response");
  }

  return result.choices[0].message.content;
}

const recipeGenerationHelpers = {
  applyCorsHeaders,
  isPreflightRequest,
  hasValidMealRequest,
  buildRecipePrompt,
  buildOpenAiRequestOptions,
  parseOpenAiRecipeResponse
};

module.exports = recipeGenerationHelpers;
