const {
  isValidEmail,
  isStrongPassword,
  verifyFields,
  handleAuthError
} =require('../Authentification Managment/authHelpers');

describe('AUTH UNIT TESTS', () => {

  //email unit test
  test('valid email should return true', () => {
    expect(isValidEmail('test@mail.com')).toBe(true);
  });

  test('invalid email (no @) should return false', () => {
    expect(isValidEmail('testmail.com')).toBe(false);
  });

  test('invalid email (no dot) should return false', () => {
    expect(isValidEmail('test@mail')).toBe(false);
  });

  //password  unit test
  test('strong password should return true', () => {
    expect(isStrongPassword('123456')).toBe(true);
  });

  test('weak password should return false', () => {
    expect(isStrongPassword('123')).toBe(false);
  });

  //field validation
  test('valid fields should return true', () => {
    expect(verifyFields('test@mail.com', '123456')).toBe(true);
  });

  test('empty email should return false', () => {
    expect(verifyFields('', '123456')).toBe(false);
  });

  test('empty password should return false', () => {
    expect(verifyFields('test@mail.com', '')).toBe(false);
  });

  // error handling
  test('user not found error', () => {
    expect(handleAuthError('auth/user-not-found')).toBe('User not found');
  });

  test('wrong password error', () => {
    expect(handleAuthError('auth/wrong-password')).toBe('Wrong password');
  });

  test('email already used error', () => {
    expect(handleAuthError('auth/email-already-in-use')).toBe('Email already used');
  });

  test('unknown error', () => {
    expect(handleAuthError('random-error')).toBe('Unknown error');
  });

});