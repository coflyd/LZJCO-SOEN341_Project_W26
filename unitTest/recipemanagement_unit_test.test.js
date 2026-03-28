const {
  normalizeTextList,
  validateRecipeInput,
  buildRecipeData,
  getMediaPreview,
  buildRecipePreview,
  readRecipeForm
} = require('../Recipe Managment/createRecipe.helpers.js');

describe('recipemanagement unit tests', () => {
  test('trims ingredient and steps', () => {
    expect(normalizeTextList(['  flour  ', '', ' sugar ', '   '])).toEqual([
      'flour',
      'sugar'
    ]);
  });

  test('requires a recipe name', () => {
    expect(
      validateRecipeInput({
        name: '   ',
        ingredients: ['flour'],
        steps: ['mix'],
        user: { uid: 'chef-1' }
      })
    ).toBe('Please enter a recipe name');
  });

  test('requires a loggedin user', () => {
    expect(
      validateRecipeInput({
        name: 'Pasta',
        ingredients: ['noodles'],
        steps: ['boil water'],
        user: null
      })
    ).toBe('You must be logged in to save recipes.');
  });

  test('requires at least one ingredient', () => {
    expect(
      validateRecipeInput({
        name: 'Pasta',
        ingredients: ['   ', ''],
        steps: ['boil water'],
        user: { uid: 'chef-1' }
      })
    ).toBe('Please add at least one ingredient');
  });

  test('requires at least one step', () => {
    expect(
      validateRecipeInput({
        name: 'Pasta',
        ingredients: ['noodles'],
        steps: ['   ', ''],
        user: { uid: 'chef-1' }
      })
    ).toBe('Please add at least one step');
  });

  test('builds recipe', () => {
    expect(
      buildRecipeData(
        {
          name: 'Chocolate Cake',
          cookingTime: '45',
          portions: '8',
          category: 'dessert',
          mediaUrl: ' https://example.com/cake.jpg ',
          notes: ' Serve chilled ',
          ingredients: [' 2 cups flour ', '', ' 1 cup sugar '],
          steps: [' Bake for 45 minutes ', '']
        },
        { uid: 'chef-2' },
        '2026-03-28T12:00:00.000Z'
      )
    ).toEqual({
      name: 'Chocolate Cake',
      ownerUid: 'chef-2',
      cookingTime: 45,
      portions: 8,
      category: 'dessert',
      mediaUrl: 'https://example.com/cake.jpg',
      ingredients: ['2 cups flour', '1 cup sugar'],
      steps: ['Bake for 45 minutes'],
      notes: 'Serve chilled',
      createdAt: '2026-03-28T12:00:00.000Z'
    });
  });

  test('detects youtube previews', () => {
    expect(getMediaPreview('https://youtu.be/abc123')).toEqual({
      type: 'youtube',
      videoId: 'abc123'
    });
  });

  test('detects image previews', () => {
    expect(getMediaPreview(' https://example.com/cake.jpg ')).toEqual({
      type: 'image',
      url: 'https://example.com/cake.jpg'
    });
  });

  test('builds the quick preview', () => {
    expect(
      buildRecipePreview({
        name: 'Cake',
        time: '45',
        portions: '8',
        category: 'Dessert',
        ingredients: [' flour ', '', ' sugar ']
      })
    ).toContain('<strong>Ingredients:</strong><br>flour<br>sugar');
  });

  test('reads the current recipe', () => {
    const fakeDocument = {
      getElementById(id) {
        const fields = {
          'recipe-name': { value: 'Cake' },
          'cooking-time': { value: '45' },
          portions: { value: '8' },
          'selected-category': { value: 'dessert' },
          'media-url': { value: 'https://example.com/cake.jpg' },
          notes: { value: 'Serve chilled' }
        };
        return fields[id];
      },
      querySelectorAll(selector) {
        if (selector === '.ingredient-input') {
          return [{ value: 'flour' }, { value: 'sugar' }];
        }
        if (selector === '.step-input') {
          return [{ value: 'mix' }, { value: 'bake' }];
        }
        return [];
      }
    };

    expect(readRecipeForm(fakeDocument)).toEqual({
      name: 'Cake',
      cookingTime: '45',
      portions: '8',
      category: 'dessert',
      mediaUrl: 'https://example.com/cake.jpg',
      notes: 'Serve chilled',
      ingredients: ['flour', 'sugar'],
      steps: ['mix', 'bake']
    });
  });
});
