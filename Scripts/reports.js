Store.seedIfEmpty();
Store.seedSampleSales();
Store.seedCategories();

function onAppReady() {
    renderReports();
}

function renderReports() {
    const summary = Store.getSalesSummary();
    document.getElementById('todaySales').textContent = summary.todayCount;
    document.getElementById('todayRevenue').textContent = '$' + summary.todayRevenue.toFixed(2);
    document.getElementById('totalSales').textContent = summary.totalSales;
    document.getElementById('totalRevenue').textContent = '$' + summary.totalRevenue.toFixed(2);
    const topBody = document.getElementById('topProductsBody');
    const noTop = document.getElementById('noTopProducts');
    if (summary.topProducts.length === 0) {
        topBody.innerHTML = '';
        noTop.style.display = 'block';
    } else {
        noTop.style.display = 'none';
        topBody.innerHTML = summary.topProducts.map((p, i) => `
            <tr>
                <td>${i + 1}</td>
                <td><strong>${p.name}</strong></td>
                <td>${p.qty}</td>
            </tr>
        `).join('');
    }
    const products = Store.getAll();
    document.getElementById('totalProducts').textContent = products.length;
    document.getElementById('totalStock').textContent = products.reduce((s, p) => s + p.stock, 0);
    document.getElementById('totalValue').textContent = '$' + products.reduce((s, p) => s + (p.stock * p.price), 0).toFixed(2);
    const expiringSoonList = Store.getExpiringSoon(7);
    const expiredList = Store.getExpired();
    const lowStockList = Store.getLowStock();
    document.getElementById('expiringSoon').textContent = expiringSoonList.length;
    document.getElementById('expired').textContent = expiredList.length;
    document.getElementById('lowStock').textContent = lowStockList.length;
    const expiringBody = document.getElementById('expiringBody');
    const noExpiring = document.getElementById('noExpiring');
    if (expiringSoonList.length === 0) {
        expiringBody.innerHTML = '';
        noExpiring.style.display = 'block';
    } else {
        noExpiring.style.display = 'none';
        expiringBody.innerHTML = expiringSoonList.map(p => `
            <tr>
                <td><span class="barcode-display">${p.barcode}</span></td>
                <td><strong>${p.name}</strong></td>
                <td>${p.stock}</td>
                <td>${p.expirationDate ? new Date(p.expirationDate).toLocaleDateString('es-MX') : '—'}</td>
                <td><span class="badge badge-danger">${Store.daysUntilExpiry(p.expirationDate)} días</span></td>
            </tr>
        `).join('');
    }
    const lowStockBody = document.getElementById('lowStockBody');
    const noLowStock = document.getElementById('noLowStock');
    if (lowStockList.length === 0) {
        lowStockBody.innerHTML = '';
        noLowStock.style.display = 'block';
    } else {
        noLowStock.style.display = 'none';
        lowStockBody.innerHTML = lowStockList.map(p => `
            <tr>
                <td><span class="barcode-display">${p.barcode}</span></td>
                <td><strong>${p.name}</strong></td>
                <td class="stock-low">${p.stock}</td>
                <td>${p.minStock || 0}</td>
            </tr>
        `).join('');
    }
}
