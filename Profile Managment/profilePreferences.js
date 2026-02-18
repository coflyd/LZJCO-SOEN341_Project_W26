import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import {
  getDatabase,
  ref,
  get,
  update
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const auth = getAuth();
const database = getDatabase();

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
        const data = snapshot.val();

        nameInput.value = data.name || "";

        const allergies = data.preferences?.allergies || [];
        const dietPreferences = data.preferences?.dietPreferences || [];

        // Allergies checkboxes
        document
          .querySelectorAll("#allergyGroup input[type='checkbox']")
          .forEach(cb => {
            cb.checked = allergies.includes(cb.value);
          });

        // Other allergies
        const predefined = ["milk", "eggs", "peanuts", "gluten", "soy"];
        const other = allergies.filter(a => !predefined.includes(a));
        if (other.length && otherAllergyInput) {
          otherAllergyInput.value = other.join(", ");
        }

        // Preferences checkboxes
        document
          .querySelectorAll("#prefGroup input[type='checkbox']")
          .forEach(cb => {
            cb.checked = dietPreferences.includes(cb.value);
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

      const name = nameInput.value.trim();
      if (!name) {
        message.textContent = "Name cannot be empty.";
        message.classList.add("error");
        return;
      }

      const allergies = [];
      const dietPreferences = [];

      document
        .querySelectorAll("#allergyGroup input[type='checkbox']:checked")
        .forEach(cb => allergies.push(cb.value));

      const otherText = otherAllergyInput?.value.trim();
      if (otherText) {
        otherText
          .split(",")
          .map(a => a.trim())
          .filter(Boolean)
          .forEach(a => allergies.push(a));
      }

      document
        .querySelectorAll("#prefGroup input[type='checkbox']:checked")
        .forEach(cb => dietPreferences.push(cb.value));

      try {
        await update(ref(database, `users/${user.uid}`), {
          name,
          preferences: { allergies, dietPreferences }
        });

        message.textContent = "Profile updated successfully!";
        message.classList.add("success");
      } catch {
        message.textContent = "Failed to update profile.";
        message.classList.add("error");
      }
    });
  });
});
