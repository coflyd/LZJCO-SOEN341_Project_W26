const {
  splitCommaList,
  getOtherAllergies,
  mapProfileToForm,
  buildProfileUpdate,
  readProfileForm
} = require('../Profile Managment/profilePreferences.helpers.js');

describe('profilemanagement unit tests', () => {
  test('splits other allergies', () => {
    expect(splitCommaList('shellfish, tree nuts, , soy')).toEqual([
      'shellfish',
      'tree nuts',
      'soy'
    ]);
  });

  test('find allergies that are not in the list', () => {
    expect(getOtherAllergies(['milk', 'shellfish', 'gluten', 'sesame'])).toEqual([
      'shellfish',
      'sesame'
    ]);
  });

  test('maps saved profile data back ', () => {
    expect(
      mapProfileToForm({
        name: 'Alex',
        preferences: {
          allergies: ['milk', 'shellfish', 'gluten'],
          dietPreferences: ['vegetarian', 'high-protein']
        }
      })
    ).toEqual({
      name: 'Alex',
      selectedAllergies: ['milk', 'gluten'],
      otherAllergies: 'shellfish',
      dietPreferences: ['vegetarian', 'high-protein']
    });
  });

  test('returns an error when the name is empty', () => {
    expect(buildProfileUpdate('   ', ['milk'], 'shellfish', ['vegetarian'])).toEqual({
      error: 'Name cannot be empty.'
    });
  });

  test('builds the profile update payload', () => {
    expect(
      buildProfileUpdate(
        'Casey Updated',
        ['milk'],
        'shellfish, tree nuts',
        ['high-protein']
      )
    ).toEqual({
      name: 'Casey Updated',
      preferences: {
        allergies: ['milk', 'shellfish', 'tree nuts'],
        dietPreferences: ['high-protein']
      }
    });
  });

  test('reads the current values from the page', () => {
    const fakeDocument = {
      getElementById(id) {
        const fields = {
          name: { value: 'Casey' },
          Allergies: { value: 'shellfish, sesame' }
        };
        return fields[id];
      },
      querySelectorAll(selector) {
        if (selector === "#allergyGroup input[type='checkbox']:checked") {
          return [{ value: 'milk' }, { value: 'gluten' }];
        }
        if (selector === "#prefGroup input[type='checkbox']:checked") {
          return [{ value: 'vegetarian' }];
        }
        return [];
      }
    };

    expect(readProfileForm(fakeDocument)).toEqual({
      name: 'Casey',
      selectedAllergies: ['milk', 'gluten'],
      otherAllergies: 'shellfish, sesame',
      dietPreferences: ['vegetarian']
    });
  });
});
