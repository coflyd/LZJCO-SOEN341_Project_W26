//  DUPLICATE MEAL UNIT TESTS

function getMeals(mealsState, dateKey) {
    return mealsState[dateKey] || [];
}
function isDuplicateMeal(mealsState, dateKey, name, type, excludeId = null) {
    const meals = getMeals(mealsState, dateKey);
    return meals.some(meal =>
        meal.name.toLowerCase() === name.toLowerCase() &&
        meal.type === type &&
        meal.id !== excludeId
    );
}
// Returns meals from the previous week offset
function getLastWeekMeals(mealsState, currentWeekOffset) {
    const lastWeekOffset = currentWeekOffset - 1;
    return mealsState[`week_${lastWeekOffset}`] || {}; // In a Firebase context this would be an async call  we simulate it with a second state object passed in
}

describe('WEEKLY PLANNER - DUPLICATE MEAL TESTS', () => {

    // Create meals state
    const mealsState = {
        '2026-03-23': [
            { id: 'abc1', name: 'Oatmeal',       type: 'breakfast' },
            { id: 'abc2', name: 'Chicken Salad',  type: 'lunch'     },
            { id: 'abc3', name: 'Pasta',          type: 'dinner'    },
        ],
        '2026-03-24': [
            { id: 'xyz1', name: 'Avocado Toast',  type: 'breakfast' },
        ],
    };

    // isDuplicateMeal 
    test('same name and same type on same day → duplicate detected', () => {
        expect(isDuplicateMeal(mealsState, '2026-03-23', 'Oatmeal', 'breakfast')).toBe(true);
    });

    test('same name but DIFFERENT type on same day → not a duplicate', () => {
        // "Oatmeal" exists as breakfast; adding it as snack should be allowed
        expect(isDuplicateMeal(mealsState, '2026-03-23', 'Oatmeal', 'snack')).toBe(false);
    });

    test('different name, same type on same day → not a duplicate', () => {
        expect(isDuplicateMeal(mealsState, '2026-03-23', 'Granola', 'breakfast')).toBe(false);
    });

    test('name check is case-insensitive → duplicate detected', () => {
        expect(isDuplicateMeal(mealsState, '2026-03-23', 'oatmeal', 'breakfast')).toBe(true);
        expect(isDuplicateMeal(mealsState, '2026-03-23', 'OATMEAL', 'breakfast')).toBe(true);
    });

    test('meal on a DIFFERENT day with same name and type → not a duplicate', () => {
        // Oatmeal exists on 2026-03-23 but not on 2026-03-25
        expect(isDuplicateMeal(mealsState, '2026-03-25', 'Oatmeal', 'breakfast')).toBe(false);
    });

    test('day with no meals → never a duplicate', () => {
        expect(isDuplicateMeal(mealsState, '2026-03-30', 'Anything', 'dinner')).toBe(false);
    });

    // excludeId (edit mode: a meal should not conflict with itself)
    test('editing a meal: same name+type excluded by its own id → not a duplicate', () => {
        // We are updating 'Oatmeal' (id='abc1') → it must NOT flag itself
        expect(isDuplicateMeal(mealsState, '2026-03-23', 'Oatmeal', 'breakfast', 'abc1')).toBe(false);
    });

    test('editing a meal: new name collides with another meal on same day → duplicate detected', () => {
        // We are editing 'abc1' and renaming it to 'Chicken Salad' (already a lunch)
        // but we are changing type to lunch too → collision with abc2
        expect(isDuplicateMeal(mealsState, '2026-03-23', 'Chicken Salad', 'lunch', 'abc1')).toBe(true);
    });

    //Reuse last week: no duplicate across weeks
    test('same meal name added to same weekday next week → NOT flagged as duplicate (different dateKey)', () => {
        // Week 1: Monday 2026-03-23 has Oatmeal/breakfast
        // Week 2: Monday 2026-03-30 — should be allowed
        expect(isDuplicateMeal(mealsState, '2026-03-30', 'Oatmeal', 'breakfast')).toBe(false);
    });
});
