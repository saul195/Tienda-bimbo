const PAGE_NAMES = {
  pos: 'Punto de Venta',
  inventory: 'Inventario',
  history: 'Historial',
  reports: 'Reportes',
};

let currentPage = null;
let initialized = {};

function navigateTo(page, focusInput = true) {
  if (page === currentPage) return false;

  const sections = document.querySelectorAll('.page-section');
  sections.forEach(s => s.style.display = 'none');

  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach(l => l.classList.remove('active'));

  const target = document.getElementById('page-' + page);
  if (target) {
    target.style.display = '';
    document.querySelector(`.nav-link[data-page="${page}"]`)?.classList.add('active');
    document.getElementById('brandText').textContent = PAGE_NAMES[page] || page;
  }

  currentPage = page;

  if (!initialized[page]) {
    initialized[page] = true;
    switch (page) {
      case 'pos':
        if (typeof initPOS === 'function') initPOS();
        break;
      case 'inventory':
        if (typeof initInventory === 'function') initInventory();
        break;
      case 'history':
        if (typeof initHistory === 'function') initHistory();
        break;
      case 'reports':
        if (typeof initReports === 'function') initReports();
        break;
    }
  }

  if (page === 'pos' && focusInput) {
    setTimeout(() => document.getElementById('barcodeInput')?.focus(), 100);
  }

  return false;
}

document.addEventListener('DOMContentLoaded', function () {
  const hash = location.hash.replace('#', '');
  if (hash && PAGE_NAMES[hash]) {
    window.__initialPage = hash;
  }
});
