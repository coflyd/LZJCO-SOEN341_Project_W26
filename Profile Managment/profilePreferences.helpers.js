const predefinedAllergies = ["milk", "eggs", "peanuts", "gluten", "soy"];

function splitCommaList(value) {
  return (value || "")
    .split(",")
    .map(item => item.trim())
    .filter(Boolean);
}

function getOtherAllergies(allergies) {
  return (allergies || []).filter(item => !predefinedAllergies.includes(item));
}

function mapProfileToForm(data) {
  const allergies = data?.preferences?.allergies || [];
  const dietPreferences = data?.preferences?.dietPreferences || [];

  return {
    name: data?.name || "",
    selectedAllergies: allergies.filter(item => predefinedAllergies.includes(item)),
    otherAllergies: getOtherAllergies(allergies).join(", "),
    dietPreferences
  };
}

function buildProfileUpdate(name, selectedAllergies, otherAllergies, dietPreferences) {
  const trimmedName = (name || "").trim();

  if (!trimmedName) {
    return { error: "Name cannot be empty." };
  }

  return {
    name: trimmedName,
    preferences: {
      allergies: [...(selectedAllergies || []), ...splitCommaList(otherAllergies)],
      dietPreferences: [...(dietPreferences || [])]
    }
  };
}

function readProfileForm(documentRef) {
  return {
    name: documentRef.getElementById("name").value,
    selectedAllergies: Array.from(
      documentRef.querySelectorAll("#allergyGroup input[type='checkbox']:checked")
    ).map(cb => cb.value),
    otherAllergies: documentRef.getElementById("Allergies")?.value || "",
    dietPreferences: Array.from(
      documentRef.querySelectorAll("#prefGroup input[type='checkbox']:checked")
    ).map(cb => cb.value)
  };
}

const profilePreferencesHelpers = {
  splitCommaList,
  getOtherAllergies,
  mapProfileToForm,
  buildProfileUpdate,
  readProfileForm
};

if (typeof window !== "undefined") {
  window.ProfilePreferencesHelpers = profilePreferencesHelpers;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = profilePreferencesHelpers;
}
