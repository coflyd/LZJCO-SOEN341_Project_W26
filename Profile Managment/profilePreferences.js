import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import {
  getDatabase,
  ref,
  get,
  update
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const auth = getAuth();
const database = getDatabase();
const { mapProfileToForm, buildProfileUpdate, readProfileForm } =
  window.ProfilePreferencesHelpers;

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("settingsForm");
  const message = document.getElementById("save-message");
  const nameInput = document.getElementById("name");
  const otherAllergyInput = document.getElementById("Allergies");

  if (!form || !message || !nameInput) return;

  // WAIT for auth to be ready
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      message.textContent = "Please log in to access your profile.";
      message.classList.add("error");
      return;
    }

    /* ================= LOAD USER DATA ================= */
    try {
      const snapshot = await get(ref(database, `users/${user.uid}`));
      if (snapshot.exists()) {
        const formData = mapProfileToForm(snapshot.val());

        nameInput.value = formData.name;

        // Allergies checkboxes
        document
          .querySelectorAll("#allergyGroup input[type='checkbox']")
          .forEach(cb => {
            cb.checked = formData.selectedAllergies.includes(cb.value);
          });

        // Other allergies
        if (formData.otherAllergies && otherAllergyInput) {
          otherAllergyInput.value = formData.otherAllergies;
        }

        // Preferences checkboxes
        document
          .querySelectorAll("#prefGroup input[type='checkbox']")
          .forEach(cb => {
            cb.checked = formData.dietPreferences.includes(cb.value);
          });
      }
    } catch {
      message.textContent = "Failed to load profile data.";
      message.classList.add("error");
    }

    /* ================= SAVE HANDLER ================= */
    form.addEventListener("submit", async () => {
      message.textContent = "";
      message.className = "save-message";

      const formValues = readProfileForm(document);
      const profileUpdate = buildProfileUpdate(
        formValues.name,
        formValues.selectedAllergies,
        formValues.otherAllergies,
        formValues.dietPreferences
      );

      if (profileUpdate.error) {
        message.textContent = "Name cannot be empty.";
        message.classList.add("error");
        return;
      }

      try {
        await update(ref(database, `users/${user.uid}`), profileUpdate);

        message.textContent = "Profile updated successfully!";
        message.classList.add("success");
      } catch {
        message.textContent = "Failed to update profile.";
        message.classList.add("error");
      }
    });
  });
});
