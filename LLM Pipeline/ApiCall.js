window.generateMeals = async function () {

    const ingredients = document.getElementById("ingredients").value.trim();
    const calories = document.getElementById("calories").value.trim();

    const ingredientsError = document.getElementById("ingredientsError");
    const caloriesError = document.getElementById("caloriesError");
    const apiError = document.getElementById("apiError");

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

    try {

        const response = await fetch("https://us-central1-louay-testing.cloudfunctions.net/generateRecipes", {
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

    } catch (error) {

        console.error("AI error:", error);
        apiError.innerText = "AI request failed. Please try again.";

    }

};