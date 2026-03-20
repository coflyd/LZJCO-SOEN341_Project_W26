function isValidEmail(email) {
  return email.includes("@") && email.includes(".");
}

function isStrongPassword(password) {
  return password.length >= 6;
}

function verifyFields(email, password) {
  return email !== "" && password !== "";
}

function handleAuthError(errorCode) {
  if (errorCode === "auth/user-not-found") {
    return "User not found";
  }
  if (errorCode === "auth/wrong-password") {
    return "Wrong password";
  }
  if (errorCode === "auth/email-already-in-use") {
    return "Email already used";
  }
  return "Unknown error";
}

module.exports = {
  isValidEmail,
  isStrongPassword,
  verifyFields,
  handleAuthError
};