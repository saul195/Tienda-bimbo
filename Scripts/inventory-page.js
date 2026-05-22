Store.seedIfEmpty();
Store.seedCategories();

function onAppReady() {
    renderInventoryTable();
    populateCategoryDropdowns();
}

function populateCategoryDropdowns() {
    const cats = Store.getCategories();
    const filterSel = document.getElementById('filterCategory');
    const datalist = document.getElementById('categoryList');
    const currentFilter = filterSel.value;
    filterSel.innerHTML = '<option value="">Todas las categorías</option>';
    cats.forEach(c => {
        filterSel.innerHTML += `<option value="${c}">${c}</option>`;
    });
    filterSel.value = currentFilter;
    datalist.innerHTML = cats.map(c => `<option value="${c}">`).join('');
}

function formatDate(dateStr) {
    if (!dateStr) return '—';
    const [y, m, d] = dateStr.split('-');
    return d + '/' + m + '/' + y;
}

function renderInventoryTable() {
    const search = document.getElementById('searchInputInv').value.toLowerCase();
    const category = document.getElementById('filterCategory').value;
    const filter = document.getElementById('filterExpiry').value;
    let products = Store.getAll();
    if (search) products = products.filter(p =>
        p.name.toLowerCase().includes(search) || p.barcode.includes(search) || (p.category || '').toLowerCase().includes(search)
    );
    if (category) products = products.filter(p => p.category === category);
    if (filter === 'expired') { const ids = Store.getExpired().map(p => p.barcode); products = products.filter(p => ids.includes(p.barcode)); }
    else if (filter === 'soon') { const ids = Store.getExpiringSoon(7).map(p => p.barcode); products = products.filter(p => ids.includes(p.barcode)); }
    else if (filter === 'low') { const ids = Store.getLowStock().map(p => p.barcode); products = products.filter(p => ids.includes(p.barcode)); }
    const tbody = document.getElementById('inventory-body');
    const empty = document.getElementById('emptyState');
    if (products.length === 0) { tbody.innerHTML = ''; empty.style.display = 'block'; return; }
    empty.style.display = 'none';
    tbody.innerHTML = products.map(p => {
        const days = Store.daysUntilExpiry(p.expirationDate);
        let daysClass = 'badge-ok', daysLabel = days > 0 ? days + ' días' : '—';
        if (days !== null) {
            if (days < 0) { daysClass = 'badge-danger'; daysLabel = 'Vencido'; }
            else if (days <= 3) { daysClass = 'badge-danger'; daysLabel = days + ' día(s) ⚠'; }
            else if (days <= 7) { daysClass = 'badge-warning'; daysLabel = days + ' días'; }
        }
        const stockClass = p.stock <= p.minStock ? 'stock-low' : '';
        return `<tr>
            <td><span class="barcode-display">${p.barcode}</span></td>
            <td><strong>${p.name}</strong></td>
            <td>${p.category || '—'}</td>
            <td class="${stockClass}">${p.stock}</td>
            <td>$${Number(p.price).toFixed(2)}</td>
            <td>${formatDate(p.expirationDate)}</td>
            <td><span class="badge ${daysClass}">${daysLabel}</span></td>
            <td class="actions-cell">
                <button class="btn-sm btn-edit" onclick="openModal('${p.barcode}')">Editar</button>
                <button class="btn-sm btn-delete" onclick="deleteProduct('${p.barcode}')">Eliminar</button>
            </td>
        </tr>`;
    }).join('');
}

function checkDuplicateBarcode() {
    const warning = document.getElementById('dupBarcodeWarning');
    const barcode = document.getElementById('barcode').value.trim();
    const editBarcode = document.getElementById('editBarcode').value;
    if (!barcode || editBarcode) { warning.classList.remove('show'); return; }
    const existing = Store.getByBarcode(barcode);
    if (existing) {
        document.getElementById('dupBarcodeName').textContent = existing.name;
        warning.classList.add('show');
    } else {
        warning.classList.remove('show');
    }
}

function checkDuplicateName() {
    const warning = document.getElementById('dupNameWarning');
    const name = document.getElementById('name').value.trim();
    const editBarcode = document.getElementById('editBarcode').value;
    if (!name || editBarcode) { warning.classList.remove('show'); return; }
    const existing = Store.getByName(name);
    if (existing) {
        document.getElementById('dupNameName').textContent = existing.name;
        warning.classList.add('show');
    } else {
        warning.classList.remove('show');
    }
}

function openModal(barcode) {
    populateCategoryDropdowns();
    const modal = document.getElementById('productModal');
    const form = document.getElementById('productForm');
    form.reset();
    document.getElementById('editBarcode').value = '';
    document.getElementById('dupBarcodeWarning').classList.remove('show');
    document.getElementById('dupNameWarning').classList.remove('show');
    if (barcode) {
        const p = Store.getByBarcode(barcode);
        if (!p) return;
        document.getElementById('modalTitle').textContent = 'Editar Producto';
        document.getElementById('editBarcode').value = p.barcode;
        document.getElementById('barcode').value = p.barcode;
        document.getElementById('barcode').readOnly = true;
        document.getElementById('name').value = p.name;
        document.getElementById('category').value = p.category || '';
        document.getElementById('price').value = p.price;
        document.getElementById('stock').value = p.stock;
        document.getElementById('minStock').value = p.minStock || 0;
        document.getElementById('expirationDate').value = p.expirationDate || '';
        document.getElementById('name').focus();
    } else {
        document.getElementById('modalTitle').textContent = 'Registrar Producto';
        document.getElementById('barcode').readOnly = false;
        setTimeout(() => document.getElementById('barcode').focus(), 100);
    }
    modal.style.display = 'flex';
}

function closeModal() {
    document.getElementById('productModal').style.display = 'none';
}

function saveProduct(e) {
    e.preventDefault();
    const data = {
        barcode: document.getElementById('barcode').value.trim(),
        name: document.getElementById('name').value.trim(),
        category: document.getElementById('category').value,
        price: parseFloat(document.getElementById('price').value),
        stock: parseInt(document.getElementById('stock').value),
        minStock: parseInt(document.getElementById('minStock').value),
        expirationDate: document.getElementById('expirationDate').value,
    };
    Store.addCategory(data.category);
    const editBarcode = document.getElementById('editBarcode').value;
    try {
        if (editBarcode) Store.update(editBarcode, data);
        else Store.add(data);
        closeModal();
        populateCategoryDropdowns();
        renderInventoryTable();
    } catch (err) { alert(err.message); }
}

function deleteProduct(barcode) {
    if (!confirm('¿Eliminar este producto del inventario?')) return;
    Store.delete(barcode);
    renderInventoryTable();
}

function exportarInventario() {
    const data = Store.getAll();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'inventario_' + new Date().toISOString().slice(0, 10) + '.json';
    a.click();
    URL.revokeObjectURL(a.href);
}

function importarInventario(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (ev) {
        try {
            const data = JSON.parse(ev.target.result);
            if (!Array.isArray(data)) throw new Error('Formato inválido');
            if (!confirm('¿Importar ' + data.length + ' productos? Se reemplazará todo el inventario actual.')) return;
            localStorage.setItem(Store.STORAGE_KEY, JSON.stringify(data));
            renderInventoryTable();
            alert('Inventario importado correctamente (' + data.length + ' productos)');
        } catch (err) {
            alert('Error al importar: ' + err.message);
        }
    };
    reader.readAsText(file);
    e.target.value = '';
}
