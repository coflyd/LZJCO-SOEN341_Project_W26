window.generateMeals = async function () {

    const ingredients = document.getElementById("ingredients").value.trim();
    const calories = document.getElementById("calories").value.trim();

    const ingredientsError = document.getElementById("ingredientsError");
    const caloriesError = document.getElementById("caloriesError");
    const apiError = document.getElementById("apiError");

    // Get the button element
    const button = document.querySelector('button[onclick="generateMeals()"]');
    
    ingredientsError.innerText = "";
    caloriesError.innerText = "";
    apiError.innerText = "";

    if (!ingredients) {
        ingredientsError.innerText = "Please enter ingredients.";
        return;
    }

    if (!calories) {
        caloriesError.innerText = "Please enter a calorie target.";
        return;
    }

    // Disable button and change text
    button.disabled = true;
    const originalText = button.textContent;
    button.textContent = "Generating...";

    try {

        const response = await fetch("https://generaterecipes-yraqufr7gq-uc.a.run.app", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                ingredients: ingredients,
                calories: calories
            })
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
        // Extract JSON from the response (remove code block markers)
        const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
        const jsonText = jsonMatch ? jsonMatch[1] : text;
        
        const data = JSON.parse(jsonText);
        const recipes = data.recipes;
        
        const resultsDiv = document.getElementById("results");
        resultsDiv.innerHTML = "";
        
        if (recipes && recipes.length > 0) {
            recipes.forEach(recipe => {
                const recipeDiv = document.createElement("div");
                recipeDiv.className = "recipe";
                
                recipeDiv.innerHTML = `
                    <h3>${recipe.name}</h3>
                    <p><strong>Calories:</strong> ${recipe.calories}</p>
                    
                    <h4>Ingredients:</h4>
                    <ul>
                        ${recipe.ingredients.map(ing => `<li>${ing.amount} ${ing.name}</li>`).join('')}
                    </ul>
                    
                    <h4>Instructions:</h4>
                    <ol>
                        ${recipe.steps.map(step => `<li>${step}</li>`).join('')}
                    </ol>
                `;
                
                resultsDiv.appendChild(recipeDiv);
            });
        } else {
            resultsDiv.innerHTML = '<p>No recipes were generated. Please try with different ingredients.</p>';
        }
        
    } catch (error) {
        console.error("Error parsing recipes:", error);
        document.getElementById("results").innerHTML = '<p>Error displaying recipes. Please try again.</p>';
    }
};