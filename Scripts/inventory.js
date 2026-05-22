const Store = {
  STORAGE_KEY: 'tiendabimbo_productos',
  SALES_KEY: 'tiendabimbo_ventas',
  CATEGORIES_KEY: 'tiendabimbo_categorias',

  getCategories() {
    const data = localStorage.getItem(this.CATEGORIES_KEY);
    return data ? JSON.parse(data) : ['Pan de Caja', 'Pan Dulce', 'Bolillo', 'Pastelito', 'Botana'];
  },

  saveCategories(cats) {
    localStorage.setItem(this.CATEGORIES_KEY, JSON.stringify([...new Set(cats)]));
  },

  addCategory(name) {
    const cats = this.getCategories();
    const trimmed = name.trim();
    if (!trimmed) return;
    if (cats.some(c => c.toLowerCase() === trimmed.toLowerCase())) return;
    cats.push(trimmed);
    this.saveCategories(cats);
    return trimmed;
  },

  removeCategory(name) {
    let cats = this.getCategories().filter(c => c !== name);
    const used = new Set(this.getAll().map(p => p.category).filter(Boolean));
    cats = cats.filter(c => used.has(c));
    this.saveCategories(cats);
  },

  seedCategories() {
    const existing = localStorage.getItem(this.CATEGORIES_KEY);
    if (existing) return;
    this.saveCategories(['Pan de Caja', 'Pan Dulce', 'Bolillo', 'Pastelito', 'Botana']);
  },

  getAll() {
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  },

  save(products) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(products));
  },

  getByBarcode(barcode) {
    return this.getAll().find(p => p.barcode === barcode);
  },

  getByName(name) {
    return this.getAll().find(p => p.name.toLowerCase().trim() === name.toLowerCase().trim()) || null;
  },

  add(product) {
    const products = this.getAll();
    if (this.getByBarcode(product.barcode)) {
      throw new Error('Ya existe un producto con ese código de barras');
    }
    if (this.getByName(product.name)) {
      throw new Error('Ya existe un producto con el nombre "' + product.name + '"');
    }
    product.id = Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
    product.createdAt = new Date().toISOString();
    products.push(product);
    this.save(products);
    return product;
  },

  update(barcode, updates) {
    const products = this.getAll();
    const idx = products.findIndex(p => p.barcode === barcode);
    if (idx === -1) throw new Error('Producto no encontrado');
    products[idx] = { ...products[idx], ...updates, updatedAt: new Date().toISOString() };
    this.save(products);
    return products[idx];
  },

  delete(barcode) {
    const products = this.getAll().filter(p => p.barcode !== barcode);
    this.save(products);
  },

  getExpiringSoon(days = 7) {
    const today = new Date();
    const limit = new Date(today.getTime() + days * 86400000);
    return this.getAll().filter(p => {
      if (!p.expirationDate) return false;
      const exp = new Date(p.expirationDate);
      return exp >= today && exp <= limit;
    });
  },

  getExpired() {
    const today = new Date();
    return this.getAll().filter(p => {
      if (!p.expirationDate) return false;
      return new Date(p.expirationDate) < today;
    });
  },

  getLowStock(threshold = 5) {
    return this.getAll().filter(p => p.stock <= threshold);
  },

  daysUntilExpiry(expirationDate) {
    if (!expirationDate) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const exp = new Date(expirationDate);
    exp.setHours(0, 0, 0, 0);
    return Math.ceil((exp - today) / 86400000);
  },

  getSales() {
    const data = localStorage.getItem(this.SALES_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveSales(sales) {
    localStorage.setItem(this.SALES_KEY, JSON.stringify(sales));
  },

  addSale(saleData) {
    const sales = this.getSales();
    sales.push(saleData);
    this.saveSales(sales);
  },

  getTodaySales() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today.getTime() + 86400000);
    return this.getSales().filter(s => {
      const d = new Date(s.date);
      return d >= today && d < tomorrow;
    });
  },

  getTopProducts(limit = 5) {
    const sales = this.getSales();
    const counts = {};
    sales.forEach(s => {
      s.items.forEach(i => {
        counts[i.name] = (counts[i.name] || 0) + i.qty;
      });
    });
    return Object.entries(counts)
      .map(([name, qty]) => ({ name, qty }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, limit);
  },

  getSaleById(id) {
    return this.getSales().find(s => s.id.toUpperCase() === id.toUpperCase().trim()) || null;
  },

  getSalesSummary() {
    const sales = this.getSales();
    const totalSales = sales.length;
    const totalRevenue = sales.reduce((s, sale) => s + sale.total, 0);
    const todaySales = this.getTodaySales();
    const todayRevenue = todaySales.reduce((s, sale) => s + sale.total, 0);
    const todayCount = todaySales.length;
    const topProducts = this.getTopProducts(5);
    return { totalSales, totalRevenue, todayRevenue, todayCount, topProducts };
  },

  seedSampleSales() {
    if (this.getSales().length > 0) return;
    const samples = [
      { items: [{ name: 'Pan Blanco Grande', qty: 2, price: 48 }, { name: 'Nito', qty: 3, price: 18.5 }] },
      { items: [{ name: 'Donas Azucaradas', qty: 1, price: 25 }, { name: 'Pan Blanco Chico', qty: 2, price: 32.5 }] },
      { items: [{ name: 'Roles de Canela', qty: 4, price: 35 }] },
      { items: [{ name: 'Mantecadas', qty: 2, price: 28 }, { name: 'Pan Molina Bimbo', qty: 1, price: 55 }] },
      { items: [{ name: 'Pan Blanco Grande', qty: 3, price: 48 }, { name: 'Medias Noches', qty: 2, price: 38 }] },
    ];
    samples.forEach((s, i) => {
      const date = new Date();
      date.setHours(date.getHours() - (samples.length - i));
      const subtotal = s.items.reduce((sum, item) => sum + item.price * item.qty, 0);
      this.addSale({
        id: Date.now().toString(36).toUpperCase() + i,
        date: date.toISOString(),
        items: s.items,
        subtotal,
        tax: subtotal * 0.16,
        total: subtotal * 1.16,
      });
    });
  },

  seedIfEmpty() {
    if (this.getAll().length > 0) return;
    const sample = [
      { barcode: '7501000100103', name: 'Pan Blanco Grande', category: 'Pan de Caja', price: 48.00, stock: 45, minStock: 10, expirationDate: '2026-06-05' },
      { barcode: '7501000100110', name: 'Pan Blanco Chico', category: 'Pan de Caja', price: 32.50, stock: 30, minStock: 8, expirationDate: '2026-06-03' },
      { barcode: '7501000145203', name: 'Donas Azucaradas', category: 'Pan Dulce', price: 25.00, stock: 20, minStock: 5, expirationDate: '2026-05-30' },
      { barcode: '7501000156100', name: 'Nito', category: 'Pan Dulce', price: 18.50, stock: 15, minStock: 5, expirationDate: '2026-06-01' },
      { barcode: '7501000162002', name: 'Mantecadas', category: 'Pan Dulce', price: 28.00, stock: 25, minStock: 8, expirationDate: '2026-06-02' },
      { barcode: '7501000173305', name: 'Medias Noches', category: 'Pan de Caja', price: 38.00, stock: 12, minStock: 6, expirationDate: '2026-06-04' },
      { barcode: '7501000184408', name: 'Pan Molina Bimbo', category: 'Pan de Caja', price: 55.00, stock: 8, minStock: 4, expirationDate: '2026-06-06' },
      { barcode: '7501001900123', name: 'Roles de Canela', category: 'Pan Dulce', price: 35.00, stock: 3, minStock: 5, expirationDate: '2026-05-29' },
    ];
    sample.forEach(p => {
      p.id = Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
      p.createdAt = new Date().toISOString();
    });
    this.save(sample);
  }
};

const Ticket = {
  createSale(items) {
    const sale = {
      id: Date.now().toString(36).toUpperCase(),
      date: new Date(),
      items: items.map(i => ({ ...i })),
      subtotal: items.reduce((s, i) => s + i.price * i.qty, 0),
    };
    sale.tax = sale.subtotal * 0.16;
    sale.total = sale.subtotal + sale.tax;
    return sale;
  },

  print(sale, storeName = 'Tienda Bimbo - Expendio') {
    const w = window.open('', '_blank', 'width=300,height=600');
    const pad = (n) => n.toString().padStart(2, '0');
    const dateStr = `${pad(sale.date.getDate())}/${pad(sale.date.getMonth() + 1)}/${sale.date.getFullYear()} ${pad(sale.date.getHours())}:${pad(sale.date.getMinutes())}`;

    w.document.write(`
      <!DOCTYPE html>
      <html>
      <head><meta charset="UTF-8"><title>Ticket</title>
      <style>
        @page { margin: 0; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Courier New', monospace; font-size: 12px; width: 80mm; padding: 5px; color: #000; }
        .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 8px; margin-bottom: 8px; }
        .header h2 { font-size: 14px; margin: 2px 0; }
        .header p { font-size: 10px; color: #555; }
        .items { width: 100%; border-collapse: collapse; }
        .items td { padding: 2px 0; }
        .items .qty { text-align: center; width: 30px; }
        .items .name { text-align: left; }
        .items .price { text-align: right; width: 70px; }
        .totals { border-top: 1px dashed #000; margin-top: 8px; padding-top: 8px; }
        .totals .row { display: flex; justify-content: space-between; padding: 2px 0; }
        .totals .total { font-size: 16px; font-weight: bold; border-top: 1px solid #000; margin-top: 4px; padding-top: 4px; }
        .footer { text-align: center; margin-top: 12px; padding-top: 8px; border-top: 1px dashed #000; font-size: 10px; }
        .barcode { text-align: center; margin: 8px 0; font-size: 20px; letter-spacing: 2px; }
        @media print { body { width: 80mm; } }
      </style>
      </head>
      <body>
        <div class="header">
          <h2>${storeName}</h2>
          <p>Ticket #${sale.id}</p>
          <p>${dateStr}</p>
        </div>
        <table class="items">
          ${sale.items.map(i => `
            <tr>
              <td class="qty">${i.qty}</td>
              <td class="name">${i.name}</td>
              <td class="price">$${(i.price * i.qty).toFixed(2)}</td>
            </tr>
          `).join('')}
        </table>
        <div class="totals">
          <div class="row"><span>Subtotal:</span><span>$${sale.subtotal.toFixed(2)}</span></div>
          <div class="row"><span>IVA (16%):</span><span>$${sale.tax.toFixed(2)}</span></div>
          <div class="row total"><span>TOTAL:</span><span>$${sale.total.toFixed(2)}</span></div>
        </div>
        <div class="barcode">${sale.id}</div>
        <div class="footer">
          <p>¡Gracias por su compra!</p>
          <p>Conserve su ticket para cambios</p>
        </div>
        <script>window.print();window.close();<\/script>
      </body>
      </html>
    `);
    w.document.close();
  }
};
