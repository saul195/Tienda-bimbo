Store.seedIfEmpty();
Store.seedSampleSales();
Store.seedCategories();

let salesChartInstance = null;
let currentChartPeriod = 'day';
let currentTopPeriod = 'day';

function initReports() {
    renderReports();
}

function renderSalesChart(period) {
    const data = Store.getSalesByPeriod(period);
    const ctx = document.getElementById('salesChart').getContext('2d');
    if (salesChartInstance) salesChartInstance.destroy();

    const barColors = data.map(d => {
        if (period === 'day') return 'rgba(13, 71, 161, 0.7)';
        if (period === 'week') return 'rgba(229, 57, 53, 0.7)';
        return 'rgba(46, 125, 50, 0.7)';
    });
    const borderColors = data.map(d => {
        if (period === 'day') return 'rgb(13, 71, 161)';
        if (period === 'week') return 'rgb(229, 57, 53)';
        return 'rgb(46, 125, 50)';
    });

    salesChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.map(d => d.label),
            datasets: [{
                label: 'Ventas ($)',
                data: data.map(d => d.total),
                backgroundColor: barColors,
                borderColor: borderColors,
                borderWidth: 2,
                borderRadius: 6,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: ctx => '$' + ctx.parsed.y.toFixed(2) + ' (' + data[ctx.dataIndex].count + ' ventas)'
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: v => '$' + v.toFixed(0)
                    },
                    grid: { color: '#f0f0f0' }
                },
                x: {
                    grid: { display: false }
                }
            }
        }
    });
}

function switchChartPeriod(period) {
    currentChartPeriod = period;
    document.querySelectorAll('.chart-tab[data-period]').forEach(t => t.classList.remove('active'));
    document.querySelector(`.chart-tab[data-period="${period}"]`)?.classList.add('active');
    renderSalesChart(period);
}

function renderTopProducts(period) {
    const now = new Date();
    let start, end;

    if (period === 'day') {
        start = new Date(now); start.setHours(0, 0, 0, 0);
        end = new Date(now); end.setHours(23, 59, 59, 999);
    } else if (period === 'week') {
        end = new Date(now); end.setHours(23, 59, 59, 999);
        start = new Date(now); start.setDate(start.getDate() - 7); start.setHours(0, 0, 0, 0);
    } else {
        end = new Date(now); end.setHours(23, 59, 59, 999);
        start = new Date(now); start.setMonth(start.getMonth() - 1); start.setHours(0, 0, 0, 0);
    }

    const top = Store.getTopProductsByRange(start, end, 5);
    const body = document.getElementById('topProductsBody');
    const noTop = document.getElementById('noTopProducts');
    if (top.length === 0) {
        body.innerHTML = '';
        noTop.style.display = 'block';
    } else {
        noTop.style.display = 'none';
        body.innerHTML = top.map((p, i) => `
            <tr>
                <td>${i + 1}</td>
                <td><strong>${p.name}</strong></td>
                <td>${p.qty}</td>
            </tr>
        `).join('');
    }
}

function switchTopPeriod(period) {
    currentTopPeriod = period;
    document.querySelectorAll('.chart-tab[data-top]').forEach(t => t.classList.remove('active'));
    document.querySelector(`.chart-tab[data-top="${period}"]`)?.classList.add('active');
    renderTopProducts(period);
}

function renderReports() {
    renderSalesChart(currentChartPeriod);
    renderTopProducts(currentTopPeriod);
    const summary = Store.getSalesSummary();
    document.getElementById('todaySales').textContent = summary.todayCount;
    document.getElementById('todayRevenue').textContent = '$' + summary.todayRevenue.toFixed(2);
    document.getElementById('totalSales').textContent = summary.totalSales;
    document.getElementById('totalRevenue').textContent = '$' + summary.totalRevenue.toFixed(2);
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
