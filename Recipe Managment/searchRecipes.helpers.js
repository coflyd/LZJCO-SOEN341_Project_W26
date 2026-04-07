function formatCategory(category) {
  if (!category) return "";
  return String(category).replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

function getYoutubeId(url) {
  const match = String(url || "").match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
  return match ? match[1] : "";
}

function getRecipeThumbnail(recipe) {
  const mediaUrl = recipe && recipe.mediaUrl;
  if (!mediaUrl) return "";

  const isYoutube = mediaUrl.includes("youtube") || mediaUrl.includes("youtu.be");
  const isImage = mediaUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i);

  if (isYoutube) {
    const videoId = getYoutubeId(mediaUrl);
    if (videoId) {
      return `<img class="card-thumbnail" src="https://img.youtube.com/vi/${videoId}/hqdefault.jpg" alt="${recipe.name}" onerror="this.style.display='none'">`;
    }
  } else if (isImage) {
    return `<img class="card-thumbnail" src="${mediaUrl}" alt="${recipe.name}" onerror="this.style.display='none'">`;
  }

  return "";
}

function sortRecipes(recipes, sortBy) {
  const sorted = [...recipes];

  switch (sortBy) {
    case "name":
      return sorted.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    case "name-desc":
      return sorted.sort((a, b) => (b.name || "").localeCompare(a.name || ""));
    case "time-asc":
      return sorted.sort((a, b) => (a.cookingTime || 0) - (b.cookingTime || 0));
    case "time-desc":
      return sorted.sort((a, b) => (b.cookingTime || 0) - (a.cookingTime || 0));
    case "servings-asc":
      return sorted.sort((a, b) => (a.portions || 0) - (b.portions || 0));
    case "servings-desc":
      return sorted.sort((a, b) => (b.portions || 0) - (a.portions || 0));
    default:
      return sorted;
  }
}

function applyRecipeFilters(recipes, {
  searchTerm = "",
  servings = "",
  prepTime = "",
  totalTime = "",
  selectedCategories = [],
  sortBy = ""
} = {}) {
  let filtered = [...recipes];
  const normalizedSearch = String(searchTerm).toLowerCase().trim();

  if (normalizedSearch) {
    filtered = filtered.filter(recipe => {
      const nameMatch = recipe.name?.toLowerCase().includes(normalizedSearch);
      const ingredientMatch = recipe.ingredients?.some(ing =>
        ing.toLowerCase().includes(normalizedSearch)
      );
      return nameMatch || ingredientMatch;
    });
  }

  if (servings) {
    filtered = filtered.filter(recipe => {
      const portions = recipe.portions || 0;
      switch (servings) {
        case "1-2": return portions >= 1 && portions <= 2;
        case "3-4": return portions >= 3 && portions <= 4;
        case "5-6": return portions >= 5 && portions <= 6;
        case "7+": return portions >= 7;
        default: return true;
      }
    });
  }

  if (prepTime) {
    filtered = filtered.filter(recipe => {
      const time = recipe.cookingTime || 0;
      switch (prepTime) {
        case "0-15": return time >= 0 && time <= 15;
        case "16-30": return time >= 16 && time <= 30;
        case "31-60": return time >= 31 && time <= 60;
        case "61+": return time > 60;
        default: return true;
      }
    });
  }

  if (totalTime) {
    filtered = filtered.filter(recipe => {
      const time = recipe.cookingTime || 0;
      switch (totalTime) {
        case "0-30": return time >= 0 && time <= 30;
        case "31-60": return time >= 31 && time <= 60;
        case "61-90": return time >= 61 && time <= 90;
        case "91+": return time > 90;
        default: return true;
      }
    });
  }

  if (selectedCategories.length > 0) {
    filtered = filtered.filter(recipe => selectedCategories.includes(recipe.category));
  }

  if (sortBy) {
    filtered = sortRecipes(filtered, sortBy);
  }

  return filtered;
}

function buildClearedFiltersState() {
  return {
    search: "",
    servings: "",
    prepTime: "",
    totalTime: "",
    sort: "name",
    selectedCategories: []
  };
}

const searchRecipesHelpers = {
  formatCategory,
  getYoutubeId,
  getRecipeThumbnail,
  sortRecipes,
  applyRecipeFilters,
  buildClearedFiltersState
};

if (typeof window !== "undefined") {
  window.SearchRecipesHelpers = searchRecipesHelpers;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = searchRecipesHelpers;
}
