const {
    validateMealGenerationInput,
    buildMealsRequestPayload,
    parseRecipesResponse,
    renderRecipeMarkup,
    renderRecipesMarkup
} = window.FridgeHelpers;

window.generateMeals = async function () {

    const rawIngredients = document.getElementById("ingredients").value;
    const rawCalories = document.getElementById("calories").value;

    const ingredientsError = document.getElementById("ingredientsError");
    const caloriesError = document.getElementById("caloriesError");
    const apiError = document.getElementById("apiError");

    // Get the button element
    const button = document.querySelector('button[onclick="generateMeals()"]');
    
    const validation = validateMealGenerationInput(rawIngredients, rawCalories);

    ingredientsError.innerText = validation.ingredientsError;
    caloriesError.innerText = validation.caloriesError;
    apiError.innerText = "";

    if (validation.ingredientsError || validation.caloriesError) {
        return;
    }

    // Disable button and change text
    button.disabled = true;
    const originalText = button.textContent;
    button.textContent = "Generating...";

    try {

        const payload = buildMealsRequestPayload(rawIngredients, rawCalories);

        const response = await fetch("https://generaterecipes-yraqufr7gq-uc.a.run.app", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || "Request failed");
        }

        const text = result.text;

        displayRecipes(text);

        // Re-enable button and restore text
        button.disabled = false;
        button.textContent = originalText;

    } catch (error) {

        console.error("AI error:", error);
        apiError.innerText = "AI request failed. Please try again.";

        // Re-enable button and restore text
        button.disabled = false;
        button.textContent = originalText;

    }

};

window.displayRecipes = function(text) {
    try {
        const recipes = parseRecipesResponse(text);
        
        const resultsDiv = document.getElementById("results");
        resultsDiv.innerHTML = "";
        
        if (recipes && recipes.length > 0) {
            recipes.forEach(recipe => {
                const recipeDiv = document.createElement("div");
                recipeDiv.className = "recipe";
                recipeDiv.innerHTML = renderRecipeMarkup(recipe);
                
                resultsDiv.appendChild(recipeDiv);
            });
        } else {
            resultsDiv.innerHTML = renderRecipesMarkup(recipes);
        }
        
    } catch (error) {
        console.error("Error parsing recipes:", error);
        document.getElementById("results").innerHTML = '<p>Error displaying recipes. Please try again.</p>';
    }
};
