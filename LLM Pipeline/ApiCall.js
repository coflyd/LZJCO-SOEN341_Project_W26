async function generateMeals() {

  const ingredients =
    document.getElementById("ingredients").value;

  const calories =
    document.getElementById("calories").value;

  const prompt = `
Generate 3 meal recipes.

Ingredients available: ${ingredients}
Target calories per meal: ${calories}

Return ONLY JSON:

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

  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Authorization": "Bearer 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",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "mistralai/mistral-7b-instruct",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ]
      })
    }
  );

  const data = await response.json();

  console.log(data);

}