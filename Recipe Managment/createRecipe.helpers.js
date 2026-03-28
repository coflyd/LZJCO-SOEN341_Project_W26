function normalizeTextList(items) {
  return (items || []).map(item => item.trim()).filter(Boolean);
}

function validateRecipeInput({ name, ingredients, steps, user }) {
  if (!(name || "").trim()) {
    return "Please enter a recipe name";
  }

  if (normalizeTextList(ingredients).length === 0) {
    return "Please add at least one ingredient";
  }

  if (normalizeTextList(steps).length === 0) {
    return "Please add at least one step";
  }

  if (!user) {
    return "You must be logged in to save recipes.";
  }

  return null;
}

function buildRecipeData(formValues, user, timestamp) {
  return {
    name: (formValues.name || "").trim(),
    ownerUid: user.uid,
    cookingTime: Number(formValues.cookingTime) || 0,
    portions: Number(formValues.portions) || 0,
    category: formValues.category || "",
    mediaUrl: (formValues.mediaUrl || "").trim(),
    ingredients: normalizeTextList(formValues.ingredients),
    steps: normalizeTextList(formValues.steps),
    notes: (formValues.notes || "").trim(),
    createdAt: timestamp
  };
}

function getMediaPreview(url) {
  const trimmedUrl = (url || "").trim();

  if (!trimmedUrl) {
    return { type: "placeholder" };
  }

  const youtubeMatch = trimmedUrl.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/
  );

  if (youtubeMatch) {
    return { type: "youtube", videoId: youtubeMatch[1] };
  }

  if (trimmedUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
    return { type: "image", url: trimmedUrl };
  }

  return { type: "none" };
}

function buildRecipePreview({ name, time, portions, category, ingredients }) {
  const cleanIngredients = normalizeTextList(ingredients);
  let preview = "";

  if (name) {
    preview += `<h3>${name}</h3>`;
  }

  if (category || time || portions) {
    preview += "<p>";
    if (category) preview += `<strong>Category:</strong> ${category} `;
    if (time) preview += `<strong>Time:</strong> ${time} min `;
    if (portions) preview += `<strong>Servings:</strong> ${portions}`;
    preview += "</p>";
  }

  if (cleanIngredients.length > 0) {
    preview +=
      "<p><strong>Ingredients:</strong><br>" + cleanIngredients.join("<br>") + "</p>";
  }

  return preview || "<p><em>Your recipe preview will appear here as you type.</em></p>";
}

function readRecipeForm(documentRef) {
  return {
    name: documentRef.getElementById("recipe-name").value,
    cookingTime: documentRef.getElementById("cooking-time").value,
    portions: documentRef.getElementById("portions").value,
    category: documentRef.getElementById("selected-category").value,
    mediaUrl: documentRef.getElementById("media-url").value,
    notes: documentRef.getElementById("notes").value,
    ingredients: Array.from(documentRef.querySelectorAll(".ingredient-input")).map(
      input => input.value
    ),
    steps: Array.from(documentRef.querySelectorAll(".step-input")).map(
      input => input.value
    )
  };
}

const createRecipeHelpers = {
  normalizeTextList,
  validateRecipeInput,
  buildRecipeData,
  getMediaPreview,
  buildRecipePreview,
  readRecipeForm
};

if (typeof window !== "undefined") {
  window.CreateRecipeHelpers = createRecipeHelpers;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = createRecipeHelpers;
}
