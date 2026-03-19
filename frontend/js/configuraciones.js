document.addEventListener("DOMContentLoaded", () => {

  const darkToggle = document.getElementById("darkMode");
  const notifToggle = document.getElementById("notifications");
  const animToggle = document.getElementById("animations");

  // =========================
  // CARGAR CONFIG
  // =========================
  const config = JSON.parse(localStorage.getItem("config")) || {};

  if (config.darkMode) {
    document.body.classList.add("dark");
    darkToggle.checked = true;
  }

  notifToggle.checked = config.notifications || false;
  animToggle.checked = config.animations !== false;

  // =========================
  // EVENTOS
  // =========================
  darkToggle.addEventListener("change", () => {
    toggleDarkMode(darkToggle.checked);
    saveConfig();
  });

  notifToggle.addEventListener("change", saveConfig);
  animToggle.addEventListener("change", saveConfig);

});


function toggleDarkMode(enabled) {
  if (enabled) {
    document.body.classList.add("dark");
  } else {
    document.body.classList.remove("dark");
  }
}


function saveConfig() {
  const config = {
    darkMode: document.getElementById("darkMode").checked,
    notifications: document.getElementById("notifications").checked,
    animations: document.getElementById("animations").checked
  };

  localStorage.setItem("config", JSON.stringify(config));
}