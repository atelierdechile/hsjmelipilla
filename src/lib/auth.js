export const AUTH_KEYS = {
  auth: "auth",
  user: "user",
  role: "rol",
  expiresAt: "expires_at",
};

const SESSION_TTL_MS = 8 * 60 * 60 * 1000;

const USERS = [
  { user: "admin", pass: "1234", rol: "admin" },
  { user: "doctor", pass: "1234", rol: "medico" },
  { user: "enfermera", pass: "1234", rol: "enfermeria" },
];

export function loginWithCredentials(user, pass) {
  const found = USERS.find((item) => item.user === user && item.pass === pass);
  if (!found) return null;
  setSession(found);
  return found;
}

export function demoLogin(role) {
  const found = USERS.find((item) => item.rol === role);
  if (!found) return null;
  setSession(found);
  return found;
}

export function setSession({ user, rol }) {
  localStorage.setItem(AUTH_KEYS.auth, "true");
  localStorage.setItem(AUTH_KEYS.user, user);
  localStorage.setItem(AUTH_KEYS.role, rol);
  localStorage.setItem(AUTH_KEYS.expiresAt, String(Date.now() + SESSION_TTL_MS));
}

export function clearSession() {
  Object.values(AUTH_KEYS).forEach((key) => localStorage.removeItem(key));
}

export function isAuthenticated() {
  const expiresAt = Number(localStorage.getItem(AUTH_KEYS.expiresAt) || 0);
  return localStorage.getItem(AUTH_KEYS.auth) === "true" && expiresAt > Date.now();
}

export function getSession() {
  return {
    user: localStorage.getItem(AUTH_KEYS.user) || "",
    role: localStorage.getItem(AUTH_KEYS.role) || "",
  };
}
