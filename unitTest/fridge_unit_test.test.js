const {
  validateMealGenerationInput,
  buildMealsRequestPayload,
  extractRecipesJson,
  parseRecipesResponse,
  renderRecipeMarkup
} = require("../LLM Pipeline/fridge.helpers.js");

describe("fridge unit tests", () => {
  test("shows the ingredients error when ingredients are empty", () => {
    // No ingredients entered here.
    const result = validateMealGenerationInput("   ", "500");

    expect(result.ingredientsError).toBe("Please enter ingredients.");
    expect(result.caloriesError).toBe("");
  });

  test("shows the calories error when calories are empty", () => {
    // Ingredients are fine, but calories are missing.
    const result = validateMealGenerationInput("eggs, spinach", "   ");

    expect(result.ingredientsError).toBe("");
    expect(result.caloriesError).toBe("Please enter a calorie target.");
  });

  test("builds the request payload from trimmed valid input", () => {
    // This is the data we send to the API.
    expect(buildMealsRequestPayload(" eggs, spinach ", " 500 ")).toEqual({
      ingredients: "eggs, spinach",
      calories: "500"
    });
  });

  test("extracts and parses recipe JSON wrapped in markdown fences", () => {
    // Sometimes the API sends the JSON inside ```json ... ```.
    const text = `\`\`\`json
{
  "recipes": [
    {
      "name": "Veggie Omelette",
      "calories": 420,
      "ingredients": [{ "amount": "2", "name": "eggs" }],
      "steps": ["Cook and serve"]
    }
  ]
}
\`\`\``;

    expect(extractRecipesJson(text)).toContain('"name": "Veggie Omelette"');
    expect(parseRecipesResponse(text)).toEqual([
      {
        name: "Veggie Omelette",
        calories: 420,
        ingredients: [{ amount: "2", name: "eggs" }],
        steps: ["Cook and serve"]
      }
    ]);
  });

  test("renders recipe details into the expected markup", () => {
    // Check that the important recipe info shows up.
    const markup = renderRecipeMarkup({
      name: "Veggie Omelette",
      calories: 420,
      ingredients: [{ amount: "2", name: "eggs" }],
      steps: ["Cook and serve"]
    });

    expect(markup).toContain("Veggie Omelette");
    expect(markup).toContain("420");
    expect(markup).toContain("2 eggs");
    expect(markup).toContain("Cook and serve");
  });
});
