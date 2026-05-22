Store.seedIfEmpty();
Store.seedSampleSales();
Store.seedCategories();

let cart = [];

document.getElementById('barcodeInput')?.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') addByBarcode();
});

function onAppReady() {
    renderProductGrid();
    document.getElementById('barcodeInput')?.focus();
}

function addByBarcode(focusInput) {
    const input = document.getElementById('barcodeInput');
    const code = input.value.trim();
    if (!code) return;
    const product = Store.getByBarcode(code);
    if (!product) {
        alert('Producto no encontrado. Verifica el código o regístralo en Inventario.');
        input.value = '';
        if (focusInput !== false) input.focus();
        return;
    }
    if (product.stock <= 0) {
        alert(`"${product.name}" no tiene stock disponible.`);
        input.value = '';
        if (focusInput !== false) input.focus();
        return;
    }
    const existing = cart.find(c => c.barcode === product.barcode);
    if (existing) {
        if (existing.qty >= product.stock) {
            alert(`Stock insuficiente de "${product.name}" (disponible: ${product.stock})`);
            input.value = '';
            if (focusInput !== false) input.focus();
            return;
        }
        existing.qty++;
    } else {
        cart.push({ barcode: product.barcode, name: product.name, price: product.price, qty: 1 });
    }
    input.value = '';
    if (focusInput !== false) input.focus();
    renderCart();
    renderProductGrid();
}

function addToCart(barcode) {
    document.getElementById('barcodeInput').value = barcode;
    addByBarcode(false);
}

function updateQty(barcode, delta) {
    const item = cart.find(c => c.barcode === barcode);
    if (!item) return;
    const product = Store.getByBarcode(barcode);
    const newQty = item.qty + delta;
    if (newQty <= 0) {
        cart = cart.filter(c => c.barcode !== barcode);
    } else if (product && newQty > product.stock) {
        alert(`Stock insuficiente (disponible: ${product.stock})`);
        return;
    } else {
        item.qty = newQty;
    }
    renderCart();
}

function removeFromCart(barcode) {
    cart = cart.filter(c => c.barcode !== barcode);
    renderCart();
}

function calcularCambio() {
    const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
    const recibo = parseFloat(document.getElementById('reciboInput').value) || 0;
    const cambio = recibo - total;
    document.getElementById('cambioDisplay').textContent = (cambio >= 0 ? '$' : '-$') + Math.abs(cambio).toFixed(2);
}

function renderCart() {
    const container = document.getElementById('cartItems');
    const summary = document.getElementById('cartSummary');
    if (cart.length === 0) {
        container.innerHTML = '<div class="cart-empty">El carrito está vacío</div>';
        summary.style.display = 'none';
        return;
    }
    summary.style.display = 'block';
    container.innerHTML = cart.map(item => `
        <div class="cart-item">
            <div class="cart-item-info">
                <strong>${item.name}</strong>
                <span class="cart-item-price">$${Number(item.price).toFixed(2)} c/u</span>
            </div>
            <div class="cart-item-controls">
                <button class="qty-btn" onclick="updateQty('${item.barcode}', -1)">−</button>
                <span class="qty-display">${item.qty}</span>
                <button class="qty-btn" onclick="updateQty('${item.barcode}', 1)">+</button>
                <span class="cart-item-total">$${(item.price * item.qty).toFixed(2)}</span>
                <button class="remove-btn" onclick="removeFromCart('${item.barcode}')">&times;</button>
            </div>
        </div>
    `).join('');
    const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
    document.getElementById('total').textContent = `$${total.toFixed(2)}`;
    calcularCambio();
}

function renderProductGrid() {
    const search = document.getElementById('searchInput').value.toLowerCase();
    let products = Store.getAll();
    if (search) {
        products = products.filter(p =>
            p.name.toLowerCase().includes(search) || p.barcode.includes(search)
        );
    }
    const grid = document.getElementById('productGrid');
    if (products.length === 0) {
        grid.innerHTML = '<p class="hint">Sin resultados</p>';
        return;
    }
    grid.innerHTML = products.map(p => {
        const stockClass = p.stock <= 0 ? 'out-of-stock' : '';
        const expiryDays = Store.daysUntilExpiry(p.expirationDate);
        const expWarning = (expiryDays !== null && expiryDays <= 3)
            ? `<span class="exp-warning">${expiryDays < 0 ? 'VENCIDO' : expiryDays === 0 ? 'VENCE HOY' : expiryDays + ' días'}</span>`
            : '';
        return `<div class="product-card ${stockClass}" onclick="addToCart('${p.barcode}')">
            <div class="product-card-name">${p.name}</div>
            <div class="product-card-price">$${Number(p.price).toFixed(2)}</div>
            <div class="product-card-stock">Stock: ${p.stock}</div>
            ${expWarning}
        </div>`;
    }).join('');
}

function clearCart() {
    cart = [];
    const recibo = document.getElementById('reciboInput');
    if (recibo) recibo.value = '';
    const cambio = document.getElementById('cambioDisplay');
    if (cambio) cambio.textContent = '$0.00';
    renderCart();
}

function checkout() {
    if (cart.length === 0) { alert('El carrito está vacío'); return; }
    const recibo = parseFloat(document.getElementById('reciboInput').value);
    if (!recibo || recibo <= 0) { alert('Debes ingresar la cantidad con la que paga el cliente.'); return; }
    const sale = Ticket.createSale(cart);
    if (recibo < sale.total) { alert('El cliente no pagó el total. Recibo $' + recibo.toFixed(2) + ' < Total $' + sale.total.toFixed(2)); return; }
    const cambio = recibo - sale.total;
    sale.recibo = recibo;
    sale.cambio = cambio;
    cart.forEach(item => {
        const p = Store.getByBarcode(item.barcode);
        if (p) Store.update(p.barcode, { stock: p.stock - item.qty });
    });
    Store.addSale({
        id: sale.id,
        date: sale.date.toISOString(),
        items: sale.items.map(i => ({ name: i.name, qty: i.qty, price: i.price })),
        total: sale.total,
    });
    Ticket.print(sale);
    cart = [];
    document.getElementById('reciboInput').value = '';
    document.getElementById('cambioDisplay').textContent = '$0.00';
    renderCart();
    renderProductGrid();
    document.getElementById('barcodeInput')?.focus();
}
