// ===============================
// CONFIG
// ===============================
const AUTH_KEYS = {
  AUTH: "auth",
  USER: "user",
  ROLE: "rol",
  EXPIRES: "expires_at"
};

const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 horas

const USERS = [
  { user: "admin", pass: "1234", rol: "admin" },
  { user: "doctor", pass: "1234", rol: "medico" },
  { user: "enfermera", pass: "1234", rol: "enfermeria" }
];


// ===============================
// UTILIDADES
// ===============================
const now = () => Date.now();

function isExpired() {
  const exp = parseInt(localStorage.getItem(AUTH_KEYS.EXPIRES) || "0", 10);
  return !exp || now() > exp;
}

function setSession({ user, rol }) {
  localStorage.setItem(AUTH_KEYS.AUTH, "true");
  localStorage.setItem(AUTH_KEYS.USER, user);
  localStorage.setItem(AUTH_KEYS.ROLE, rol);
  localStorage.setItem(AUTH_KEYS.EXPIRES, (now() + SESSION_TTL_MS).toString());
}

function clearSession() {
  Object.values(AUTH_KEYS).forEach(key => localStorage.removeItem(key));
}

function isAuthenticated() {
  return localStorage.getItem(AUTH_KEYS.AUTH) === "true" && !isExpired();
}

function getUser() {
  return localStorage.getItem(AUTH_KEYS.USER) || "";
}

function getRole() {
  return localStorage.getItem(AUTH_KEYS.ROLE) || "";
}


// ===============================
// LOGIN
// ===============================
function login() {
  const userInput = document.getElementById("user");
  const passInput = document.getElementById("pass");
  const errorEl = document.getElementById("error");
  const btn = document.getElementById("btn-login");

  const user = (userInput?.value || "").trim();
  const pass = (passInput?.value || "").trim();

  // limpiar error
  if (errorEl) errorEl.innerText = "";

  // validación
  if (!user || !pass) {
    if (errorEl) errorEl.innerText = "Debes ingresar usuario y contraseña";
    return;
  }

  // loading UX
  if (btn) {
    btn.disabled = true;
    btn.innerText = "Ingresando...";
  }

  // simulación backend
  setTimeout(() => {

    const found = USERS.find(u => u.user === user && u.pass === pass);

    if (found) {
      setSession(found);
      window.location.href = "dashboard.html";
      return;
    }

    // error
    if (errorEl) errorEl.innerText = "Credenciales incorrectas";

    if (btn) {
      btn.disabled = false;
      btn.innerText = "Ingresar";
    }

  }, 500);
}


// ===============================
// DEMO LOGIN
// ===============================
function demoLogin(role) {
  const user = USERS.find(u => u.rol === role);

  if (user) {
    setSession(user);
    window.location.href = "dashboard.html";
  }
}


// ===============================
// LOGOUT
// ===============================
function logout() {
  clearSession();
  window.location.href = "index.html";
}


// ===============================
// GUARD DE RUTAS
// ===============================
function requireAuth(redirect = "login.html") {
  if (!isAuthenticated()) {
    clearSession();
    window.location.href = redirect;
  }
}

function requireRole(roles = []) {
  const role = getRole();

  if (!roles.includes(role)) {
    alert("No tienes permisos para acceder a esta sección");
    window.location.href = "dashboard.html";
  }
}


// ===============================
// UI HELPERS
// ===============================
function renderUser() {
  const el = document.getElementById("usuario");

  if (el && getUser()) {
    el.innerText = `👤 ${getUser()} (${getRole()})`;
  }
}


// ===============================
// SESSION WATCHER
// ===============================
function startSessionWatcher(interval = 30000) {
  setInterval(() => {
    if (!isAuthenticated()) {
      clearSession();
      window.location.href = "login.html";
    }
  }, interval);
}


// ===============================
// INIT PROTECTED PAGE
// ===============================
function initProtectedPage() {
  requireAuth();
  renderUser();
  startSessionWatcher();
}


// ===============================
// UX MEJORADA
// ===============================

// Enter para login
document.addEventListener("DOMContentLoaded", () => {

  const passInput = document.getElementById("pass");

  if (passInput) {
    passInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        login();
      }
    });
  }

});


// ===============================
// 📱 SISTEMA RESPONSIVE MÓVIL
// ===============================
document.addEventListener("DOMContentLoaded", () => {
  const sidebar = document.querySelector(".sidebar");
  const topbarDiv = document.querySelector(".topbar > div:first-child");

  // Solo inyectar si estamos en una página con layout (no en el login)
  if (sidebar && topbarDiv) {
    // 1. Crear y agregar el botón hamburguesa
    const btnMenu = document.createElement("button");
    btnMenu.className = "btn-menu";
    btnMenu.innerHTML = "☰";
    topbarDiv.insertBefore(btnMenu, topbarDiv.firstChild);

    // 2. Crear y agregar el overlay oscuro
    const overlay = document.createElement("div");
    overlay.className = "sidebar-overlay";
    document.body.appendChild(overlay);

    // 3. Eventos para abrir/cerrar
    btnMenu.addEventListener("click", () => {
      sidebar.classList.add("active");
      overlay.classList.add("active");
    });

    overlay.addEventListener("click", () => {
      sidebar.classList.remove("active");
      overlay.classList.remove("active");
    });

    // 4. Cerrar sidebar al hacer clic en un enlace del menú (útil en móviles)
    const menuItems = document.querySelectorAll("#menu li[data-page]");
    menuItems.forEach(item => {
      item.addEventListener("click", () => {
        if (window.innerWidth <= 900) {
          sidebar.classList.remove("active");
          overlay.classList.remove("active");
        }
      });
    });
  }
});