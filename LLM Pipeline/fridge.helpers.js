function validateMealGenerationInput(ingredients, calories) {
  const normalizedIngredients = String(ingredients || "").trim();
  const normalizedCalories = String(calories || "").trim();

  return {
    ingredients: normalizedIngredients,
    calories: normalizedCalories,
    ingredientsError: normalizedIngredients ? "" : "Please enter ingredients.",
    caloriesError: normalizedCalories ? "" : "Please enter a calorie target."
  };
}

function buildMealsRequestPayload(ingredients, calories) {
  const validated = validateMealGenerationInput(ingredients, calories);

  return {
    ingredients: validated.ingredients,
    calories: validated.calories
  };
}

function extractRecipesJson(text) {
  const jsonMatch = String(text || "").match(/```json\n([\s\S]*?)\n```/);
  return jsonMatch ? jsonMatch[1] : String(text || "");
}

function parseRecipesResponse(text) {
  const data = JSON.parse(extractRecipesJson(text));
  return data.recipes || [];
}

function renderRecipeMarkup(recipe) {
  return `
                    <h3>${recipe.name}</h3>
                    <p><strong>Calories:</strong> ${recipe.calories}</p>
                    
                    <h4>Ingredients:</h4>
                    <ul>
                        ${recipe.ingredients.map(ing => `<li>${ing.amount} ${ing.name}</li>`).join("")}
                    </ul>
                    
                    <h4>Instructions:</h4>
                    <ol>
                        ${recipe.steps.map(step => `<li>${step}</li>`).join("")}
                    </ol>
                `;
}

function renderRecipesMarkup(recipes) {
  if (!recipes || recipes.length === 0) {
    return '<p>No recipes were generated. Please try with different ingredients.</p>';
  }

  return recipes.map(renderRecipeMarkup);
}

const fridgeHelpers = {
  validateMealGenerationInput,
  buildMealsRequestPayload,
  extractRecipesJson,
  parseRecipesResponse,
  renderRecipeMarkup,
  renderRecipesMarkup
};

if (typeof window !== "undefined") {
  window.FridgeHelpers = fridgeHelpers;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = fridgeHelpers;
}
