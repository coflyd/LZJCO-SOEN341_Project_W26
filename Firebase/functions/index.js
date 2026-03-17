const functions = require("firebase-functions");
const fetch = require("node-fetch");

exports.generateRecipes = functions.https.onCall(async (data, context) => {
  const ingredients = data.ingredients;
  const calories = data.calories;
  const API_KEY = "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";

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

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "mistralai/mistral-7b-instruct",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    }),
  });

  const result = await response.json();

  return result;
});
