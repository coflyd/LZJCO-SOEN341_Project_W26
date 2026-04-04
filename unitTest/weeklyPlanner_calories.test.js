const {
  DEFAULT_MEAL_CALORIES,
  getMeals,
  resolveMealCalories,
  getTotalCalories,
  isOverCaloriesLimit,
  buildCaloriesSummary
} = require("../Recipe Managment/weeklyPlanner.helpers.js");

describe("weekly planner calories tests", () => {
  //Two days of meals. One meal uses default calories.
  const mealsState = {
    "2026-03-23": [
      { id: "abc1", name: "Oatmeal", type: "breakfast", calories: 350 },
      { id: "abc2", name: "Chicken Salad", type: "lunch", calories: 450 },
      { id: "abc3", name: "Pasta", type: "dinner", calories: 700 }
    ],
    "2026-03-24": [
      { id: "xyz1", name: "Avocado Toast", type: "breakfast", calories: 320 },
      { id: "xyz2", name: "Yogurt Bowl", type: "snack" }
    ]
  };

  test("returns meals for an existing day and an empty list otherwise", () => {
    expect(getMeals(mealsState, "2026-03-23")).toHaveLength(3);
    expect(getMeals(mealsState, "2026-03-30")).toEqual([]);
  });

  test("uses the default calorie fallback when calories are missing", () => {
    expect(resolveMealCalories({ name: "Yogurt Bowl" })).toBe(DEFAULT_MEAL_CALORIES);
  });

  test("uses the default calorie fallback when calories are zero, blank, or invalid", () => {
    expect(resolveMealCalories({ calories: 0 })).toBe(DEFAULT_MEAL_CALORIES);
    expect(resolveMealCalories({ calories: "" })).toBe(DEFAULT_MEAL_CALORIES);
    expect(resolveMealCalories({ calories: "abc" })).toBe(DEFAULT_MEAL_CALORIES);
  });

  test("accepts numeric strings when calculating calories", () => {
    expect(resolveMealCalories({ calories: "425" })).toBe(425);
  });

  test("sums meal calories for a day, including default fallback calories", () => {
    // Mar 24  One meal has calories, the other does not.
    expect(getTotalCalories(mealsState, "2026-03-23")).toBe(1500);
    expect(getTotalCalories(mealsState, "2026-03-24")).toBe(320 + DEFAULT_MEAL_CALORIES);
  });

  test("returns zero total calories for a day with no meals", () => {
    expect(getTotalCalories(mealsState, "2026-03-30")).toBe(0);
  });

  test("does not warn when the target is zero or missing", () => {
    expect(isOverCaloriesLimit(2200, 0)).toBe(false);
    expect(isOverCaloriesLimit(2200)).toBe(false);
  });

  test("does not warn when the total is exactly equal to the target", () => {
    expect(isOverCaloriesLimit(2000, 2000)).toBe(false);
  });

  test("warns when the total calories exceed the daily target", () => {
    // Shows warning only if total is over the limit.
    expect(isOverCaloriesLimit(2001, 2000)).toBe(true);
    expect(isOverCaloriesLimit(getTotalCalories(mealsState, "2026-03-23"), 1400)).toBe(true);
  });

  test("builds the normal summary when the total is within the target", () => {
    expect(buildCaloriesSummary(1500, 2000)).toBe("Total: 1500 cal / 2000 cal");
  });

  test("builds the over-limit warning summary when the total exceeds the target", () => {
    expect(buildCaloriesSummary(1500, 1400)).toBe("Over limit! 1500 / 1400 cal");
  });

  test("builds a summary without a target when no calorie limit is set", () => {
    expect(buildCaloriesSummary(1500, 0)).toBe("Total: 1500 cal");
  });
});
