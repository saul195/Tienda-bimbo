// app.js ha sido dividido en módulos separados:
// - Scripts/auth.js  → login, sesión, inactividad (compartido)
// - Scripts/pos.js   → carrito, checkout, grid (solo index.html)
// - Scripts/inventory-page.js → CRUD inventario (solo inventario.html)
// - Scripts/reports.js → reportes y estadísticas (solo reportes.html)
// 
// Cada página HTML carga solo los scripts que necesita.
// Ver: inventory.js (compartido, siempre primero)
