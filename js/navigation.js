document.addEventListener("DOMContentLoaded", () => {

  // =========================
  // CONFIG
  // =========================
  const MENU_SELECTOR = "#menu li[data-page]";
  const ACTIVE_CLASS = "active";

  // =========================
  // OBTENER PÁGINA ACTUAL (ROBUSTO)
  // =========================
  function getCurrentPage() {
    let page = window.location.pathname.split("/").pop();

    if (!page || page === "") {
      page = "dashboard.html";
    }

    return page.split("?")[0].split("#")[0].toLowerCase();
  }

  const currentPage = getCurrentPage();

  // =========================
  // LIMPIAR MODALES
  // =========================
  function cerrarModales() {
    document.querySelectorAll(".modal-overlay").forEach(modal => {
      modal.remove();
    });
  }

  // =========================
  // ACTIVAR MENÚ (FIX REAL 🔥)
  // =========================
  function activarMenu() {
    const items = document.querySelectorAll(MENU_SELECTOR);

    items.forEach(item => {
      const targetPage = (item.dataset.page || "").toLowerCase();

      // Reset
      item.classList.remove(ACTIVE_CLASS);

      // ✅ FIX: comparación flexible
      if (currentPage.includes(targetPage)) {
        item.classList.add(ACTIVE_CLASS);
      }
    });
  }

  // =========================
  // NAVEGACIÓN
  // =========================
  function configurarNavegacion() {
    const items = document.querySelectorAll(MENU_SELECTOR);

    items.forEach(item => {

      const targetPage = item.dataset.page;

      // Evitar duplicación
      item.onclick = null;

      item.addEventListener("click", (e) => {
        e.preventDefault();

        if (!targetPage) return;

        // ❌ Evitar recargar misma página
        if (currentPage.includes(targetPage.toLowerCase())) return;

        // 🔥 UX: transición suave
        document.body.style.transition = "opacity 0.2s ease";
        document.body.style.opacity = "0.6";

        cerrarModales();

        setTimeout(() => {
          window.location.href = targetPage;
        }, 150);
      });

      item.style.cursor = "pointer";
    });
  }

  // =========================
  // HOVER EFFECT PRO (SUAVE)
  // =========================
  function hoverEffect() {
    const items = document.querySelectorAll(MENU_SELECTOR);

    items.forEach(item => {

      item.addEventListener("mouseenter", () => {
        if (!item.classList.contains(ACTIVE_CLASS)) {
          item.style.transform = "translateX(6px)";
          item.style.transition = "all 0.2s ease";
        }
      });

      item.addEventListener("mouseleave", () => {
        item.style.transform = "translateX(0)";
      });

    });
  }

  // =========================
  // ANIMACIÓN ENTRADA (PRO)
  // =========================
  function animacionEntrada() {
    document.body.style.opacity = "0";
    document.body.style.transition = "opacity 0.25s ease";

    setTimeout(() => {
      document.body.style.opacity = "1";
    }, 50);
  }

  // =========================
  // INIT
  // =========================
  activarMenu();
  configurarNavegacion();
  hoverEffect();
  animacionEntrada();

});