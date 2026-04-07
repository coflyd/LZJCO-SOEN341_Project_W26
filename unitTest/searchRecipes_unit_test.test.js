const {
  formatCategory,
  getRecipeThumbnail,
  sortRecipes,
  applyRecipeFilters,
  buildClearedFiltersState
} = require("../Recipe Managment/searchRecipes.helpers.js");

describe("search recipes unit tests", () => {
  const recipes = [
    {
      id: "r1",
      name: "Chicken Pasta",
      ingredients: ["chicken", "pasta", "garlic"],
      cookingTime: 25,
      portions: 4,
      category: "main-course",
      mediaUrl: "https://example.com/pasta.jpg"
    },
    {
      id: "r2",
      name: "Berry Smoothie",
      ingredients: ["berries", "milk", "banana"],
      cookingTime: 10,
      portions: 2,
      category: "beverage",
      mediaUrl: "https://youtu.be/abc123"
    },
    {
      id: "r3",
      name: "Veggie Bowl",
      ingredients: ["rice", "broccoli", "tofu"],
      cookingTime: 35,
      portions: 3,
      category: "entree"
    }
  ];

  test("formats categories into readable labels", () => {
    expect(formatCategory("main-course")).toBe("Main Course");
  });

  test("sorts recipes by name", () => {
    const sorted = sortRecipes(recipes, "name");
    expect(sorted.map(recipe => recipe.name)).toEqual([
      "Berry Smoothie",
      "Chicken Pasta",
      "Veggie Bowl"
    ]);
  });

  test("sorts recipes by cooking time", () => {
    const sorted = sortRecipes(recipes, "time-asc");
    expect(sorted.map(recipe => recipe.name)).toEqual([
      "Berry Smoothie",
      "Chicken Pasta",
      "Veggie Bowl"
    ]);
  });

  test("filters recipes by recipe name or ingredient", () => {
    expect(
      applyRecipeFilters(recipes, { searchTerm: "garlic" }).map(recipe => recipe.name)
    ).toEqual(["Chicken Pasta"]);

    expect(
      applyRecipeFilters(recipes, { searchTerm: "smoothie" }).map(recipe => recipe.name)
    ).toEqual(["Berry Smoothie"]);
  });

  test("filters recipes by selected category", () => {
    expect(
      applyRecipeFilters(recipes, { selectedCategories: ["beverage"] }).map(recipe => recipe.name)
    ).toEqual(["Berry Smoothie"]);
  });

  test("combines search and category filters", () => {
    expect(
      applyRecipeFilters(recipes, {
        searchTerm: "bowl",
        selectedCategories: ["entree"]
      }).map(recipe => recipe.name)
    ).toEqual(["Veggie Bowl"]);
  });

  test("returns all recipes when search is empty", () => {
    expect(applyRecipeFilters(recipes, { searchTerm: "" })).toHaveLength(3);
  });

  test("builds image thumbnails correctly", () => {
    expect(getRecipeThumbnail(recipes[0])).toContain("example.com/pasta.jpg");
  });

  test("builds youtube thumbnails correctly", () => {
    expect(getRecipeThumbnail(recipes[1])).toContain("img.youtube.com/vi/abc123/hqdefault.jpg");
  });

  test("builds the default cleared filter state", () => {
    expect(buildClearedFiltersState()).toEqual({
      search: "",
      servings: "",
      prepTime: "",
      totalTime: "",
      sort: "name",
      selectedCategories: []
    });
  });
});
