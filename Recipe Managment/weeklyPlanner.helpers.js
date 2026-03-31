const DEFAULT_MEAL_CALORIES = 200;

function getMeals(mealsState, dateKey) {
  return mealsState[dateKey] || [];
}

function isDuplicateMeal(mealsState, dateKey, name, type, excludeId = null) {
  const normalizedName = String(name || "").trim().toLowerCase();

  return getMeals(mealsState, dateKey).some(meal =>
    String(meal.name || "").trim().toLowerCase() === normalizedName &&
    meal.type === type &&
    meal.id !== excludeId
  );
}

function resolveMealCalories(meal, fallback = DEFAULT_MEAL_CALORIES) {
  const parsedCalories = Number.parseInt(meal && meal.calories, 10);
  return parsedCalories > 0 ? parsedCalories : fallback;
}

function getTotalCalories(mealsState, dateKey, fallback = DEFAULT_MEAL_CALORIES) {
  return getMeals(mealsState, dateKey).reduce(
    (sum, meal) => sum + resolveMealCalories(meal, fallback),
    0
  );
}

function isOverCaloriesLimit(totalCalories, targetCalories) {
  return targetCalories > 0 && totalCalories > targetCalories;
}

function buildCaloriesSummary(totalCalories, targetCalories) {
  if (isOverCaloriesLimit(totalCalories, targetCalories)) {
    return `Over limit! ${totalCalories} / ${targetCalories} cal`;
  }

  return `Total: ${totalCalories} cal${
    targetCalories > 0 ? " / " + targetCalories + " cal" : ""
  }`;
}

const weeklyPlannerHelpers = {
  DEFAULT_MEAL_CALORIES,
  getMeals,
  isDuplicateMeal,
  resolveMealCalories,
  getTotalCalories,
  isOverCaloriesLimit,
  buildCaloriesSummary
};

if (typeof window !== "undefined") {
  window.WeeklyPlannerHelpers = weeklyPlannerHelpers;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = weeklyPlannerHelpers;
}
