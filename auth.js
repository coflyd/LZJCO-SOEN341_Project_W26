window.register = async function () {
    const nameInput = document.getElementById("name");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const confirmInput = document.getElementById("confirm-password");

    const nameError = document.getElementById("name-error");
    const emailError = document.getElementById("email-error");
    const passwordError = document.getElementById("password-error");
    const formError = document.getElementById("form-error");

    clearErrors({
        inputs: [nameInput, emailInput, passwordInput, confirmInput],
        errors: [nameError, emailError, passwordError, formError]
    });

    if (!verifyFields({
        nameInput,
        emailInput,
        passwordInput,
        confirmInput,
        nameError,
        emailError,
        passwordError
    })) {
        return;
    }

};






window.login = async function () {
    const email = document.getElementById("email");
    const password = document.getElementById("password");
    const emailError = document.getElementById("email-error");
    const passwordError = document.getElementById("password-error");
    const formError = document.getElementById("form-error");

    clearErrors({
        inputs: [email, password],
        errors: [emailError, passwordError, formError]
    });

    // check if either field is empty
    if (!email.value) {
        setFieldError(email, emailError, "Email is required");
        return;
    }
    if (!password.value) {
        setFieldError(password, passwordError, "Password is required");
        return;
    }

    // login will happen here if there user entered wrong credentials call setFieldError(email, emailError, "Invalid email or password");
};


//========================Helpers========================//
function verifyFields({nameInput, emailInput, passwordInput, confirmInput, nameError, emailError, passwordError}) {
    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const confirm = confirmInput.value;

    // NAME
    if (!name) {
        setFieldError(nameInput, nameError, "Name is required");
        return false;
    }

    // EMAIL
    if (!isValidEmail(email)) {
        setFieldError(emailInput, emailError, "Invalid email");
        return false;
    }

    // PASSWORD STRENGTH
    if (!isStrongPassword(password)) {
        setFieldError(
            passwordInput,
            passwordError,
            "Min 6 chars, 1 uppercase letter, 1 number"
        );
        confirmInput.classList.add("error");
        return false;
    }

    // PASSWORD MATCH
    if (password !== confirm) {
        setFieldError(passwordInput, passwordError, "Passwords do not match");
        confirmInput.classList.add("error");
        return false;
    }

    return true;
}

function clearErrors({ inputs = [], errors = [] }) {
    inputs.forEach(input => input.classList.remove("error"));
    errors.forEach(err => err.textContent = "");
}

function setFieldError(input, errorElement, message) {
    errorElement.textContent = message;
    input.classList.add("error");
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function isStrongPassword(password) {
    // Min 6 chars, 1 uppercase, 1 digit
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{6,}$/;
    return passwordRegex.test(password);
}
