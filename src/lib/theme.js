const STORAGE_KEY = "config";

export function readConfig() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function writeConfig(config) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  window.dispatchEvent(new CustomEvent("configchange", { detail: config }));
}

export function isDarkModeEnabled() {
  return Boolean(readConfig().darkMode);
}

export function applyTheme(darkMode) {
  document.body.classList.toggle("dark", darkMode);
  document.documentElement.style.colorScheme = darkMode ? "dark" : "light";
  window.dispatchEvent(new CustomEvent("themechange", { detail: { darkMode } }));
}

export function setDarkMode(darkMode) {
  const nextConfig = { ...readConfig(), darkMode };
  writeConfig(nextConfig);
  applyTheme(darkMode);
  return nextConfig;
}

export function initializeTheme() {
  applyTheme(isDarkModeEnabled());
}
