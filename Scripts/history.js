Store.seedIfEmpty();
Store.seedSampleSales();
Store.seedCategories();

function initHistory() {
    const today = new Date();
    document.getElementById('filterDateTo').value = today.toISOString().slice(0, 10);
    const weekAgo = new Date(today.getTime() - 6 * 86400000);
    document.getElementById('filterDateFrom').value = weekAgo.toISOString().slice(0, 10);
    renderHistory();
}

function formatDateHistory(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-MX', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

function formatCurrency(n) {
    return '$' + Number(n).toFixed(2);
}

function renderHistory() {
    let sales = Store.getSales();

    const fromVal = document.getElementById('filterDateFrom').value;
    const toVal = document.getElementById('filterDateTo').value;
    const searchVal = document.getElementById('filterSearch').value.trim().toLowerCase();

    if (fromVal) {
        const from = new Date(fromVal + 'T00:00:00');
        sales = sales.filter(s => new Date(s.date) >= from);
    }
    if (toVal) {
        const to = new Date(toVal + 'T23:59:59');
        sales = sales.filter(s => new Date(s.date) <= to);
    }
    if (searchVal) {
        sales = sales.filter(s => s.id.toLowerCase().includes(searchVal));
    }

    sales.sort((a, b) => new Date(b.date) - new Date(a.date));

    const totalAmount = sales.reduce((s, sale) => s + sale.total, 0);
    const totalCount = sales.length;
    document.getElementById('historyTotals').innerHTML = `
        <span><strong>${totalCount}</strong> ventas</span>
        <span>Total: <strong>${formatCurrency(totalAmount)}</strong></span>
    `;

    const tbody = document.getElementById('historyBody');
    const empty = document.getElementById('emptyHistory');
    if (sales.length === 0) {
        tbody.innerHTML = '';
        empty.style.display = 'block';
        return;
    }
    empty.style.display = 'none';
    tbody.innerHTML = sales.map(sale => {
        const itemsSummary = sale.items.map(i => `${i.qty}x ${i.name}`).join(', ');
        return `<tr>
            <td><span class="barcode-display">${sale.id}</span></td>
            <td>${formatDateHistory(sale.date)}</td>
            <td title="${itemsSummary.replace(/"/g, '&quot;')}">${itemsSummary.length > 60 ? itemsSummary.slice(0, 60) + '…' : itemsSummary}</td>
            <td><strong>${formatCurrency(sale.total)}</strong></td>
            <td class="actions-cell">
                <button class="btn-sm btn-edit" onclick="viewSaleDetail('${sale.id}')">Detalle</button>
                <button class="btn-sm btn-secondary" onclick="reprintSale('${sale.id}')">Reimprimir</button>
            </td>
        </tr>`;
    }).join('');
}

function resetFilters() {
    const today = new Date();
    document.getElementById('filterDateTo').value = today.toISOString().slice(0, 10);
    const weekAgo = new Date(today.getTime() - 6 * 86400000);
    document.getElementById('filterDateFrom').value = weekAgo.toISOString().slice(0, 10);
    document.getElementById('filterSearch').value = '';
    renderHistory();
}

function viewSaleDetail(saleId) {
    const sale = Store.getSaleById(saleId);
    if (!sale) return;
    document.getElementById('detailModalTitle').textContent = 'Ticket #' + sale.id;
    document.getElementById('saleDetailBody').innerHTML = `
        <div class="detail-info">
            <p><strong>Fecha:</strong> ${formatDateHistory(sale.date)}</p>
        </div>
        <table class="data-table">
            <thead><tr><th>Cant.</th><th>Producto</th><th>Precio</th><th>Subtotal</th></tr></thead>
            <tbody>
                ${sale.items.map(i => `
                    <tr>
                        <td>${i.qty}</td>
                        <td>${i.name}</td>
                        <td>${formatCurrency(i.price)}</td>
                        <td>${formatCurrency(i.price * i.qty)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        <div class="detail-totals">
            <div class="detail-total-row"><span>Total:</span><strong>${formatCurrency(sale.total)}</strong></div>
            ${sale.recibo ? `<div class="detail-total-row"><span>Recibió:</span><span>${formatCurrency(sale.recibo)}</span></div>` : ''}
            ${sale.cambio ? `<div class="detail-total-row"><span>Cambio:</span><span>${formatCurrency(sale.cambio)}</span></div>` : ''}
        </div>
    `;
    document.getElementById('saleDetailModal').style.display = 'flex';
}

function closeSaleDetail() {
    document.getElementById('saleDetailModal').style.display = 'none';
}

function reprintSale(saleId) {
    const sale = Store.reprintSale(saleId);
    if (!sale) { alert('Venta no encontrada'); return; }
    Ticket.print(sale);
}

function importarHistorial(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (ev) {
        try {
            const data = JSON.parse(ev.target.result);
            if (!Array.isArray(data)) throw new Error('Formato inválido');
            if (!confirm('¿Importar ' + data.length + ' ventas? Se agregarán al historial actual.')) return;
            const sales = Store.getSales();
            data.forEach(s => {
                const sale = {
                    id: s.ticket || s.id || Date.now().toString(36).toUpperCase(),
                    date: s.fecha || s.date || new Date().toISOString(),
                    items: s.productos ? s.productos.split(' | ').map(p => {
                        const m = p.match(/(\d+)x\s(.+?)\s\((\$[\d.]+)\)/);
                        return m ? { name: m[2], qty: parseInt(m[1]), price: parseFloat(m[3].replace('$', '')) } : { name: p, qty: 1, price: 0 };
                    }) : s.items || [],
                    total: s.total || 0,
                };
                if (!sale.items.length) return;
                sale.total = sale.items.reduce((sum, i) => sum + i.price * i.qty, 0);
                sales.push(sale);
            });
            Store.saveSales(sales);
            renderHistory();
            alert('Importación completada (' + data.length + ' ventas)');
        } catch (err) {
            alert('Error al importar: ' + err.message);
        }
    };
    reader.readAsText(file);
    e.target.value = '';
}

function exportarHistorial() {
    let sales = Store.getSales();
    sales.sort((a, b) => new Date(b.date) - new Date(a.date));
    const data = sales.map(s => ({
        ticket: s.id,
        fecha: new Date(s.date).toISOString(),
        productos: s.items.map(i => `${i.qty}x ${i.name} ($${i.price})`).join(' | '),
        total: s.total,
    }));
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'historial_ventas_' + new Date().toISOString().slice(0, 10) + '.json';
    a.click();
    URL.revokeObjectURL(a.href);
}
