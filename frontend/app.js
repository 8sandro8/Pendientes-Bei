const API_URL = '/api';
let token = localStorage.getItem('admin_token');
let allProducts = [];
let cart = [];
let categories = [];
let currentCategory = 'all';

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
  checkLoginState();
  fetchCategories();
  fetchPendientes();

  // Admin styles injection
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = '/admin.css';
  document.head.appendChild(link);

  console.log('App v5 initialized (Clean Build)');
  setTimeout(() => showToast('Sistema actualizado v5'), 1000);

  setupEventListeners();
});

// --- EVENT LISTENERS setupEventListeners ---
function setupEventListeners() {
  // Forms
  const loginForm = document.getElementById('login-form');
  if (loginForm) loginForm.addEventListener('submit', handleLogin);

  const productForm = document.getElementById('product-form');
  if (productForm) productForm.addEventListener('submit', handleProductSubmit);

  const checkoutForm = document.getElementById('checkout-form');
  if (checkoutForm) checkoutForm.addEventListener('submit', handleCheckoutSubmit);

  const commentForm = document.getElementById('comment-form');
  if (commentForm) commentForm.addEventListener('submit', handleCommentSubmit);

  // Main Container Delegation
  const container = document.getElementById('pendientes-container');
  if (container) {
    container.addEventListener('click', handleProductClick);
  }

  // Cart Delegation
  const cartContainer = document.getElementById('cart-items');
  if (cartContainer) {
    cartContainer.addEventListener('click', (e) => {
      const btn = e.target.closest('.btn-remove-item');
      if (btn) removeFromCart(btn.dataset.id, btn.dataset.color || null);
    });
  }

  // Filter Delegation
  const filterContainer = document.getElementById('filters-container');
  if (filterContainer) {
    filterContainer.addEventListener('click', (e) => {
      const btn = e.target.closest('.filter-btn');
      if (btn && !btn.id.includes('manage-cats')) {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentCategory = btn.dataset.category;
        renderPendientes();
      }
    });
  }
}

// --- CENTRALIZED CLICK HANDLER ---
function handleProductClick(e) {
  const target = e.target;

  // 1. Admin Actions
  const btnEdit = target.closest('.btn-edit');
  if (btnEdit) { openEditModal(btnEdit.dataset.id); return; }

  const btnDelete = target.closest('.btn-delete');
  if (btnDelete) { deleteProduct(btnDelete.dataset.id); return; }

  // 2. Cart Actions
  const btnAddCart = target.closest('.btn-add-cart');
  if (btnAddCart) { addToCart(btnAddCart.dataset.id); return; }

  // 3. Ignore specific containers
  if (target.closest('.admin-actions') || target.closest('.quick-add-container')) return;
  if (target.closest('input') || target.closest('select')) return;

  // 4. Detail View (Button or Card)
  const btnDetail = target.closest('.btn-detail');
  const card = target.closest('.pendiente');

  if (btnDetail || (card && !target.closest('button'))) {
    if (card) {
      const id = card.dataset.id;
      // Robust find: Match string to string
      const product = allProducts.find(p => String(p.id) === String(id));

      if (product) {
        console.log('Opening details for:', product.nombre);
        openDetailModal(product);
      } else {
        console.error('Product not found in memory:', id);
        showToast('Error: Producto no encontrado', 'error');
      }
    }
  }
}

// --- API ACTIONS ---
async function fetchCategories() {
  try {
    const res = await fetch(`${API_URL}/categories`);
    if (res.ok) {
      categories = await res.json();
      renderFilters();
    }
  } catch (e) { console.error('Error categories', e); }
}

function renderFilters() {
  const container = document.getElementById('dynamic-filters');
  // If container doesn't exist (e.g. simplified view), skip
  if (!container) return;

  let html = `<button class="filter-btn ${currentCategory === 'all' ? 'active' : ''}" data-category="all">Todos</button>`;
  categories.forEach(cat => {
    html += `<button class="filter-btn ${currentCategory === cat ? 'active' : ''}" data-category="${cat}">${cat}</button>`;
  });
  container.innerHTML = html;
}

async function fetchPendientes() {
  const container = document.getElementById('pendientes-container');
  if (!container) return;

  try {
    const res = await fetch(`${API_URL}/pendientes`);
    if (!res.ok) throw new Error('Error API');

    const raw = await res.json();
    // Normalize Logic
    allProducts = raw.map(p => ({ ...p, id: String(p.id) }));

    renderPendientes();
  } catch (err) {
    console.error(err);
    container.innerHTML = '<p class="error-msg">No se pudieron cargar los productos.</p>';
  }
}

// --- UI RENDERING ---
function renderPendientes() {
  const container = document.getElementById('pendientes-container');
  if (!container) return;
  container.innerHTML = '';

  if (allProducts.length === 0) {
    container.innerHTML = '<p style="text-align:center; width:100%; color:#888;">No hay productos disponibles.</p>';
    return;
  }

  const filtered = currentCategory === 'all'
    ? allProducts
    : allProducts.filter(p => p.categoria === currentCategory);

  if (filtered.length === 0) {
    container.innerHTML = '<p style="text-align:center; width:100%;">No hay productos en esta categoría.</p>';
    return;
  }

  filtered.forEach(p => {
    const div = document.createElement('div');
    div.className = 'pendiente';
    div.dataset.id = p.id;

    // Status Logic
    const isSoldOut = p.stock <= 0;
    const isReserved = p.comprador && isSoldOut;

    // Admin Actions HTML
    const adminHtml = token ? `
      <div class="admin-actions">
        <button class="btn-admin btn-edit" data-id="${p.id}"><i class="fa-solid fa-pencil"></i></button>
        <button class="btn-admin btn-delete" data-id="${p.id}"><i class="fa-solid fa-trash"></i></button>
      </div>
    ` : '';

    // Quick Add / Cart Button logic for clients
    let clientActionHtml = '';
    if (!token) {
      if (isSoldOut) {
        clientActionHtml = `<button class="btn-reserve" style="background:#ff9f43; color:white; border:none; width:100%; margin-top:8px; padding:8px; border-radius:4px;" onclick="event.stopPropagation(); openRequestModal('${p.id}', '${p.nombre.replace(/'/g, "\\'")}')">Solicitar</button>`;
      } else if (!p.comprador) {
        // Color Selector logic
        let colorHtml = '';
        if (p.colors && p.colors.length > 0) {
          colorHtml = `
             <select id="color-${p.id}" class="quick-color-select" style="margin-top:5px; width:100%; padding:4px; border:1px solid #ddd; border-radius:4px;">
               <option value="">-- Color --</option>
               ${p.colors.map(c => `<option value="${c}">${c}</option>`).join('')}
             </select>
           `;
        }

        clientActionHtml = `
           <div class="quick-add-container" style="margin-top:8px;">
             ${colorHtml}
             <div style="display:flex; gap:5px; margin-top:5px;">
               <input type="number" id="qty-${p.id}" value="1" min="1" max="${p.stock}" style="width:50px; padding:5px; text-align:center; border:1px solid #ddd; border-radius:4px;">
               <button class="btn-add-cart" data-id="${p.id}" style="flex:1; background:var(--secondary-color); color:white; border:none; border-radius:4px;">Añadir</button>
             </div>
           </div>
         `;
      }
    }

    div.innerHTML = `
      ${adminHtml}
      ${isSoldOut && !isReserved ? '<div class="badge-sold">Agotado</div>' : ''}
      <div class="stock" style="${token ? 'display:block;' : ''}">Stock: ${p.stock}</div>
      
      <div class="image-container">
        <img src="${p.imagen || '/images/default-earring.jpg'}" alt="${p.nombre}" loading="lazy">
      </div>
      
      <div class="card-info">
        <h3>${p.nombre}</h3>
        <span class="price">${formatPrice(p.precio)}</span>
        
        <button class="btn-detail" type="button" style="width:100%; margin-top:10px; padding:8px; background:#f0f0f0; border:1px solid #ddd; border-radius:4px; cursor:pointer;">
            <i class="fa-solid fa-eye"></i> Ver Detalle
        </button>

        ${clientActionHtml}
      </div>
    `;

    container.appendChild(div);
  });
}

// --- MODAL LOGIC (Significantly Cleaned) ---
window.openDetailModal = function (productArg) {
  let product = productArg;
  // Fallback if ID passed instead of object
  if (typeof productArg === 'string' || typeof productArg === 'number') {
    product = allProducts.find(p => String(p.id) === String(productArg));
  }

  if (!product) {
    showToast('Error: Producto no válido', 'error');
    return;
  }

  // Set Global Context
  window.currentDetailProduct = product;

  // 1. Text Content
  // 1. Text Content & Admin Description Editor
  document.getElementById('detail-title').textContent = product.nombre;
  document.getElementById('detail-price').textContent = formatPrice(product.precio);

  const descContainer = document.getElementById('detail-desc');
  if (token) {
    // Admin: Editable Textarea
    descContainer.innerHTML = `
          <textarea id="admin-desc-input" style="width:100%; height:80px; padding:8px; border:1px solid #ddd; border-radius:4px; font-family:inherit; resize:vertical; margin-bottom:5px;">${product.descripcion || ''}</textarea>
          <button onclick="saveDescription('${product.id}')" style="font-size:0.8rem; padding:4px 8px; background:#333; color:white; border:none; border-radius:4px; cursor:pointer;"><i class="fa-solid fa-save"></i> Guardar Descripción</button>
      `;
  } else {
    // Client: Text only
    descContainer.textContent = product.descripcion || 'Sin descripción disponible.';
  }

  // 2. Images
  const mainImg = document.getElementById('detail-main-image');
  const thumbs = document.getElementById('detail-thumbnails');

  mainImg.src = product.imagen || '/images/default-earring.jpg';
  thumbs.innerHTML = '';

  const allPhotos = [product.imagen, ...(product.photos || [])].filter(Boolean);
  if (allPhotos.length > 1) {
    allPhotos.forEach(src => {
      const img = document.createElement('img');
      img.src = src;
      img.className = 'thumb';
      img.onclick = () => mainImg.src = src;
      thumbs.appendChild(img);
    });
  }

  // 3. Admin Photo Upload Feature
  let adminActions = document.getElementById('admin-photo-actions');
  if (!adminActions) {
    adminActions = document.createElement('div');
    adminActions.id = 'admin-photo-actions';
    thumbs.parentNode.appendChild(adminActions);
  }

  if (token) {
    adminActions.style.display = 'block';
    adminActions.innerHTML = `
      <div style="margin-top:15px; padding:15px; background:#fff; border:1px solid #eee; border-radius:8px; text-align:center; box-shadow:0 2px 5px rgba(0,0,0,0.05);">
        <h4 style="margin:0 0 10px 0; color:#444; font-size:0.9rem;">Admin: Añadir Foto Extra</h4>
        
        <div style="display:flex; gap:10px; justify-content:center; align-items:center;">
            <label for="admin-photo-input" style="cursor:pointer; background:#f0f0f0; padding:8px 12px; border-radius:4px; font-size:0.85rem; border:1px solid #ccc; display:flex; align-items:center; gap:5px;">
                <i class="fa-solid fa-cloud-arrow-up"></i> Elegir Archivo
            </label>
            <input type="file" id="admin-photo-input" accept="image/*" style="display:none;" onchange="document.getElementById('file-name-display').textContent = this.files[0] ? this.files[0].name : ''">
            
            <button onclick="adminUploadPhoto('${product.id}')" class="btn-primary" style="padding:8px 15px; font-size:0.85rem;">
                <i class="fa-solid fa-plus"></i> Subir
            </button>
        </div>
        <div id="file-name-display" style="font-size:0.8rem; color:#666; margin-top:5px; height:1rem;"></div>
      </div>
    `;
  } else {
    adminActions.style.display = 'none';
  }

  // 4. Client Cart / Request Logic
  const btnAdd = document.getElementById('detail-add-btn');
  const qtyContainer = document.getElementById('detail-qty-container');
  const qtyInput = document.getElementById('detail-qty-input');
  const colorContainer = document.getElementById('detail-color-container'); // The valid one
  const colorSelect = document.getElementById('detail-color-select'); // The valid one

  // Reset Color UI
  colorSelect.innerHTML = '<option value="">-- Elige Color --</option>';
  if (product.colors && product.colors.length > 0) {
    colorContainer.style.display = 'block';
    product.colors.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c; opt.textContent = c;
      colorSelect.appendChild(opt);
    });
  } else {
    colorContainer.style.display = 'none';
  }

  if (token) {
    if (btnAdd) btnAdd.style.display = 'none';
    if (qtyContainer) qtyContainer.style.display = 'none';
  } else {
    if (btnAdd) btnAdd.style.display = 'block';
    if (qtyContainer) qtyContainer.style.display = 'flex';

    qtyInput.value = 1;
    const stock = product.stock || 0;

    if (stock <= 0) {
      btnAdd.textContent = 'Solicitar Encargo';
      btnAdd.style.background = '#ff9f43';
      btnAdd.onclick = () => {
        closeModal('detail-modal');
        openRequestModal(product.id, `${product.nombre} (Solicitud)`);
      };
    } else {
      btnAdd.textContent = 'Añadir a la Cesta';
      btnAdd.style.background = 'var(--gold-accent)';
      btnAdd.onclick = () => {
        const qty = parseInt(qtyInput.value) || 1;
        if (qty > stock) { showToast(`Solo ${stock} en stock`, 'error'); return; }

        // Color Check
        const selectedColor = colorContainer.style.display !== 'none' ? colorSelect.value : null;
        if (product.colors && product.colors.length > 0 && !selectedColor) {
          showToast('Selecciona un color', 'info');
          return;
        }

        addToCart({ ...product, selectedColor }, qty);
        closeModal('detail-modal');
      };
    }
  }

  // 5. Comments
  fetchComments(product.id);

  // 6. Related Products
  const relatedContainer = document.getElementById('related-products-list');
  if (relatedContainer) {
    // Filter: Same category, not current product, random shuffle
    const related = allProducts
      .filter(p => p.category === product.category && String(p.id) !== String(product.id))
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);

    if (related.length === 0) {
      document.getElementById('related-products-section').style.display = 'none';
    } else {
      document.getElementById('related-products-section').style.display = 'block';
      relatedContainer.innerHTML = related.map(p => `
            <div onclick="openDetailModal('${p.id}')" style="width:180px; cursor:pointer; border:1px solid #eee; border-radius:12px; overflow:hidden; transition:transform 0.2s; box-shadow:0 4px 10px rgba(0,0,0,0.05); background:white;">
                <img src="${p.imagen || '/images/default-earring.jpg'}" style="width:100%; height:200px; object-fit:cover;">
                <div style="padding:12px; text-align:center;">
                    <p style="font-size:1rem; margin:0 0 5px 0; font-weight:600; color:#333; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${p.nombre}</p>
                    <p style="font-size:0.95rem; color:var(--primary-color); fontWeight:bold; margin:0;">${formatPrice(p.precio)}</p>
                </div>
            </div>
          `).join('');
    }
  }

  // Show Modal
  document.getElementById('detail-modal').style.display = 'flex';
}

// --- ADMIN UPLOAD PHOTO HANDLER ---
window.adminUploadPhoto = async function (id) {
  const input = document.getElementById('admin-photo-input');
  if (!input.files[0]) { showToast('Elige imagen', 'info'); return; }

  const formData = new FormData();
  formData.append('image', input.files[0]);

  try {
    const res = await fetchWithAuth(`${API_URL}/upload`, { method: 'POST', body: formData });
    if (res.ok) {
      const data = await res.json();
      // Update Product
      const product = window.currentDetailProduct;
      if (!product.photos) product.photos = [];
      product.photos.push(data.imageUrl);

      // Save to DB
      await fetchWithAuth(`${API_URL}/pendientes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product)
      });

      showToast('Foto subida');
      openDetailModal(product); // Refresh UI
      fetchPendientes(); // Refresh List
    } else {
      showToast('Error subida', 'error');
    }
  } catch (e) { console.error(e); }
}

// --- CART LOGIC ---
function addToCart(arg, qty = 1) {
  let product;
  // If ID passed (Quick Add)
  if (typeof arg === 'string' || typeof arg === 'number') {
    product = allProducts.find(p => String(p.id) === String(arg));

    // Get Quick Add inputs if exist
    const qInput = document.getElementById(`qty-${arg}`);
    const cSelect = document.getElementById(`color-${arg}`);

    if (qInput) qty = parseInt(qInput.value) || 1;

    if (cSelect) {
      const col = cSelect.value;
      if (!col) { showToast('Elige color', 'info'); return; }
      product = { ...product, selectedColor: col };
    }
  } else {
    product = arg; // Object passed directly
  }

  if (!product) return;

  // Check Existing
  const existing = cart.find(i => String(i.id) === String(product.id) && i.selectedColor === product.selectedColor);
  const currentQty = existing ? existing.qty : 0;

  if ((currentQty + qty) > (product.stock || 0)) {
    showToast('No hay suficiente stock', 'error');
    return;
  }

  if (existing) {
    existing.qty += qty;
    showToast(`Cantidad actualizada (Total: ${existing.qty})`);
  } else {
    cart.push({ ...product, qty });
    showToast('Añadido a la cesta');
  }

  updateCartUI();
}

function removeFromCart(id, color) {
  cart = cart.filter(item => {
    // Keep if ID mismatch
    if (String(item.id) !== String(id)) return true;
    // If ID match, check Color mismatch
    const itemColor = item.selectedColor || '';
    const targetColor = color || '';
    return itemColor !== targetColor;
  });
  updateCartUI();
  if (document.getElementById('cart-modal').style.display === 'flex') renderCartModalItems();
}

function updateCartUI() {
  const badge = document.getElementById('cart-count');
  const count = cart.reduce((sum, i) => sum + i.qty, 0);
  if (badge) {
    badge.textContent = count;
    badge.style.display = count > 0 ? 'flex' : 'none'; // Flex to center text
  }
}

// --- SHARED UTILS ---
window.closeModal = (id) => document.getElementById(id).style.display = 'none';

window.openCartModal = () => {
  renderCartModalItems();
  document.getElementById('cart-modal').style.display = 'flex';
};

function renderCartModalItems() {
  const list = document.getElementById('cart-items');
  const totalEl = document.getElementById('cart-total-price');
  list.innerHTML = '';

  if (cart.length === 0) {
    list.innerHTML = '<p style="padding:20px; text-align:center; color:#888;">Vacía</p>';
    totalEl.textContent = '0,00 €';
    return;
  }

  let total = 0;
  cart.forEach(item => {
    const itemTotal = item.precio * item.qty;
    total += itemTotal;

    const row = document.createElement('div');
    row.className = 'cart-item';
    row.innerHTML = `
            <div style="display:flex; align-items:center; gap:10px;">
                <img src="${item.imagen || '/images/default-earring.jpg'}" style="width:50px; height:50px; object-fit:cover; border-radius:4px;">
                <div>
                    <strong>${item.nombre}</strong>
                    ${item.selectedColor ? `<div style="font-size:0.8rem; color:#666;">Color: ${item.selectedColor}</div>` : ''}
                    <div>x${item.qty}</div>
                </div>
            </div>
            <div style="display:flex; align-items:center; gap:10px;">
                <span>${formatPrice(itemTotal)}</span>
                <button class="btn-remove-item" data-id="${item.id}" data-color="${item.selectedColor || ''}" style="color:red; background:none; border:none; cursor:pointer;"><i class="fa-solid fa-trash"></i></button>
            </div>
        `;
    list.appendChild(row);
  });

  totalEl.textContent = formatPrice(total);
}

// --- AUTH & ADMIN ---
async function handleLogin(e) {
  e.preventDefault();
  const pass = document.getElementById('admin-password').value;
  // Simple endpoint usage
  try {
    const res = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pass })
    });
    if (res.ok) {
      const data = await res.json();
      token = data.token;
      localStorage.setItem('admin_token', token);
      window.closeModal('login-modal');
      checkLoginState();
      showToast('Bienvenido Admin');
    } else {
      showToast('Contraseña incorrecta', 'error');
    }
  } catch (err) { showToast('Error conexión', 'error'); }
}

function checkLoginState() {
  const adminBtn = document.getElementById('admin-btn');
  const logoutBtn = document.getElementById('logout-btn');
  const controls = document.getElementById('admin-controls');

  if (token) {
    if (adminBtn) adminBtn.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = 'block';
    if (controls) controls.style.display = 'block';
    document.body.classList.add('is-admin');
  } else {
    if (adminBtn) adminBtn.style.display = 'block';
    if (logoutBtn) logoutBtn.style.display = 'none';
    if (controls) controls.style.display = 'none';
    document.body.classList.remove('is-admin');
  }

  // Toggle management button
  const mngBtn = document.getElementById('btn-manage-cats');
  if (mngBtn) mngBtn.style.display = token ? 'inline-flex' : 'none';
}

window.logout = () => {
  localStorage.removeItem('admin_token');
  token = null;
  checkLoginState();
  window.location.reload(); // Simple refresh to clear state
};

// --- HELPERS ---
function formatPrice(n) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n);
}

function showToast(msg, type = 'success') {
  const c = document.getElementById('toast-container');
  if (!c) return;
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<span>${msg}</span>`; // Simplified structure
  c.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

// --- OTHER FUNCTIONS (Product Form, Orders, Requests) ---
// Minimal implementations to support existing HTML calls
window.openLoginModal = () => document.getElementById('login-modal').style.display = 'flex';
window.openProductModal = () => {
  document.getElementById('product-form').reset();
  document.getElementById('prod-id').value = '';
  document.getElementById('image-preview').innerHTML = '';

  // Cats
  const catSel = document.getElementById('prod-category');
  catSel.innerHTML = categories.map(c => `<option value="${c}">${c}</option>`).join('');

  document.getElementById('product-modal').style.display = 'flex';
};

window.openOrdersModal = async () => {
  if (!token) return;
  document.getElementById('orders-modal').style.display = 'flex';
  // Load orders logic...
  await fetchOrders();
};

window.openRequestsModal = async function () {
  if (!token) return;
  document.getElementById('requests-list-modal').style.display = 'flex';
  await fetchRequests();
};

async function fetchRequests() {
  const container = document.getElementById('requests-list');
  if (!container) return;
  container.innerHTML = '<tr><td colspan="5" style="text-align:center;">Cargando...</td></tr>';
  try {
    const res = await fetchWithAuth(`${API_URL}/requests`);
    if (res.ok) {
      const list = await res.json();
      if (!list.length) { container.innerHTML = '<tr><td colspan="5" style="text-align:center;">No hay solicitudes.</td></tr>'; return; }
      container.innerHTML = list.map(r => `
              <tr>
                  <td>${new Date(r.date).toLocaleDateString()}</td>
                  <td><strong>${r.name}</strong><br><small>${r.contact}</small></td>
                  <td>${r.productName}</td>
                  <td>${r.message}</td>
                  <td><button onclick="deleteRequest('${r.id}')" style="color:red; border:none; background:none; cursor:pointer;"><i class="fa-solid fa-trash"></i></button></td>
              </tr>
          `).join('');
    } else container.innerHTML = '<tr><td colspan="5" style="text-align:center;">Error al cargar.</td></tr>';
  } catch (e) { container.innerHTML = '<tr><td colspan="5" style="text-align:center;">Error conexión.</td></tr>'; }
}

window.deleteRequest = async function (id) {
  if (!confirm('¿Eliminar solicitud?')) return;
  try {
    const res = await fetchWithAuth(`${API_URL}/requests/${id}`, { method: 'DELETE' });
    if (res.ok) { showToast('Eliminada'); fetchRequests(); }
    else showToast('Error al eliminar', 'error');
  } catch (e) { showToast('Error conexión', 'error'); }
}

window.openRequestModal = function (id, name) {
  document.getElementById('req-prod-id').value = id;
  document.getElementById('req-prod-name-hidden').value = name;
  document.getElementById('req-prod-name').textContent = `Sobre: ${name}`;
  document.getElementById('request-modal').style.display = 'flex';
}

window.handleRequestSubmit = async function (e) { // Make global for HTML onsubmit
  e.preventDefault();
  const name = document.getElementById('req-name').value;
  const contact = document.getElementById('req-contact').value;
  const message = document.getElementById('req-message').value;
  const pid = document.getElementById('req-prod-id').value;
  const pname = document.getElementById('req-prod-name-hidden').value;

  try {
    const res = await fetch(`${API_URL}/requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, contact, message, productId: pid, productName: pname })
    });
    if (res.ok) {
      window.closeModal('request-modal');
      showToast('Solicitud enviada');
      document.getElementById('request-form').reset();
    } else showToast('Error al enviar', 'error');
  } catch (e) { showToast('Error conexión', 'error'); }
}

window.openCategoriesModal = () => {
  document.getElementById('categories-modal').style.display = 'flex';
  renderCategoriesTable();
};

// --- COMMENTS (Basic) ---
async function fetchComments(pid) {
  const list = document.getElementById('detail-comments-list');
  list.innerHTML = '<p style="color:#999;font-style:italic;">Cargando...</p>';
  try {
    const res = await fetch(`${API_URL}/products/${pid}/comments`);
    const comments = res.ok ? await res.json() : [];
    if (comments.length === 0) {
      list.innerHTML = '<p style="color:#999;font-style:italic;">Sé el primero en opinar.</p>';
      return;
    }
    list.innerHTML = comments.map(c => `
            <div class="comment-item">
                <strong>${c.user}</strong> <small>${new Date(c.date).toLocaleDateString()}</small>
                <div>${c.text}</div>
            </div>
        `).join('');
    // Store in product
    window.currentDetailProduct.comments = comments;
  } catch (e) { list.innerHTML = ''; }
}

async function handleCommentSubmit(e) {
  e.preventDefault();
  if (!window.currentDetailProduct) return;
  const user = document.getElementById('comment-user').value;
  const text = document.getElementById('comment-text').value;
  // Logic to post comment...
  // Simplified for this file rewrite, assume endpoint standard:
  await fetch(`${API_URL}/products/${window.currentDetailProduct.id}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user, text })
  });
  fetchComments(window.currentDetailProduct.id);
  document.getElementById('comment-form').reset();
}

async function fetchWithAuth(url, opts = {}) {
  if (!token) return null;
  if (!opts.headers) opts.headers = {};
  opts.headers['Authorization'] = `Bearer ${token}`;
  return fetch(url, opts);
}

// Core functions referenced by HTML onclicks that need to exist:
window.addCategory = async function () {
  const input = document.getElementById('new-cat-name');
  const name = input.value.trim();
  if (!name) return;

  try {
    const res = await fetchWithAuth(`${API_URL}/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });

    if (res.ok) {
      categories = await res.json();
      input.value = '';
      renderFilters(); // Relies on closure or global 'categories'
      if (document.getElementById('categories-table')) renderCategoriesTable(); // Helper if exists
      showToast('Categoría añadida');
    } else {
      showToast('Error al añadir', 'error');
    }
  } catch (e) { showToast('Error conexión', 'error'); }
}

window.deleteCategory = async function (name) {
  if (!confirm(`¿Eliminar categoría "${name}"?`)) return;
  try {
    const res = await fetchWithAuth(`${API_URL}/categories/${name}`, { method: 'DELETE' });
    if (res.ok) {
      showToast('Categoría eliminada');
      categories = categories.filter(c => c !== name);
      renderFilters();
      // We need to re-render the table dynamically
      const table = document.getElementById('categories-table');
      if (table) {
        table.innerHTML = categories.map(cat => `
            <tr>
                <td style="padding:10px; border-bottom:1px solid #eee;">${cat}</td>
                <td style="text-align:right; padding:10px; border-bottom:1px solid #eee;">
                    <button onclick="deleteCategory('${cat}')" style="color:red; background:none; border:none; cursor:pointer;"><i class="fa-solid fa-trash"></i></button>
                </td>
            </tr>
          `).join('');
      }
    } else {
      showToast('Error al eliminar', 'error');
    }
  } catch (e) { showToast('Error conexión', 'error'); }
}
window.handleCheckoutSubmit = handleCheckoutSubmit;
window.handleProductSubmit = handleProductSubmit;

// --- ORDERS FETCH (Needed for Admin) ---
async function fetchOrders() {
  const c = document.getElementById('orders-grid-container');
  if (!c) return;
  c.innerHTML = 'Cargando...';
  try {
    const res = await fetchWithAuth(`${API_URL}/orders`);
    if (res.ok) {
      const orders = await res.json();
      renderOrders(orders);
    } else c.innerHTML = 'Error';
  } catch (e) { c.innerHTML = 'Error conexión'; }
}

function renderOrders(orders) {
  const container = document.getElementById('orders-grid-container');
  if (!container) return;
  if (!orders.length) { container.innerHTML = 'No hay pedidos'; return; }

  container.innerHTML = '';
  orders.forEach(o => {
    const div = document.createElement('div');
    div.className = 'order-card';

    // Status Selector
    const statuses = ['Pendiente', 'Preparación', 'Enviado', 'Entregado', 'Cancelado'];
    const options = statuses.map(s => `<option value="${s}" ${o.status === s ? 'selected' : ''}>${s}</option>`).join('');

    div.innerHTML = `
           <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:10px;">
               <div style="font-weight:bold;">Order #${o.id}</div>
               <button onclick="deleteOrder('${o.id}')" style="color:red; background:none; border:none; cursor:pointer;" title="Eliminar"><i class="fa-solid fa-trash"></i></button>
           </div>
           
           <div style="margin-bottom:5px;"><strong>Cliente:</strong> ${o.customer.nombre} ${o.customer.apellidos || ''}</div>
           <div style="margin-bottom:5px;"><strong>Tel:</strong> ${o.customer.telefono || 'N/A'}</div>
           <div style="margin-bottom:10px;"><strong>Total:</strong> ${formatPrice(o.total || 0)}</div>
           
           <div style="margin-top:auto;">
               <label style="font-size:0.8rem; color:#666;">Estado:</label>
               <select onchange="updateOrderStatus('${o.id}', this.value)" style="width:100%; padding:5px; border:1px solid #ddd; border-radius:4px; margin-top:2px;">
                   ${options}
               </select>
           </div>
           
           <div style="margin-top:10px; font-size:0.85rem; color:#555; background:#f5f5f5; padding:5px; border-radius:4px;">
               ${o.items.length} artículos
           </div>
        `;
    container.appendChild(div);
  });
}

window.updateOrderStatus = async function (id, newStatus) {
  try {
    const res = await fetchWithAuth(`${API_URL}/orders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    if (res.ok) showToast('Estado actualizado');
    else showToast('Error al actualizar', 'error');
  } catch (e) { showToast('Error conexión', 'error'); }
}

window.deleteOrder = async function (id) {
  if (!confirm('¿Eliminar pedido permanentemente?')) return;
  try {
    const res = await fetchWithAuth(`${API_URL}/orders/${id}`, { method: 'DELETE' });
    if (res.ok) {
      showToast('Pedido eliminado');
      fetchOrders();
    } else showToast('Error al eliminar', 'error');
  } catch (e) { showToast('Error conexión', 'error'); }
}

// Request Submit
async function handleCheckoutSubmit(e) {
  e.preventDefault();
  if (cart.length === 0) { showToast('Cesta vacía', 'error'); return; }

  const name = document.getElementById('checkout-name').value;
  const surname = document.getElementById('checkout-surname').value;
  const email = document.getElementById('checkout-email').value;
  const phone = document.getElementById('checkout-phone').value;

  try {
    const res = await fetch(`${API_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: cart.map(p => ({ id: p.id, qty: p.qty })),
        customer: { nombre: name, apellidos: surname, email: email, telefono: phone }
      })
    });

    if (res.ok) {
      window.closeModal('cart-modal');
      showToast('¡Pedido confirmado!');
      cart = [];
      updateCartUI();
      document.getElementById('checkout-form').reset();
      fetchPendientes();
    } else {
      const err = await res.json();
      showToast(err.message || 'Error al pedir', 'error');
    }
  } catch (err) { console.error(err); showToast('Error conexión', 'error'); }
}

async function handleProductSubmit(e) {
  e.preventDefault();
  if (!token) return;

  const id = document.getElementById('prod-id').value;
  const name = document.getElementById('prod-name').value;
  const price = document.getElementById('prod-price').value;
  const stock = document.getElementById('prod-stock').value;
  const category = document.getElementById('prod-category').value;
  const buyer = document.getElementById('prod-buyer').value;
  const description = document.getElementById('prod-desc').value;
  const imageInput = document.getElementById('prod-image');

  // 1. Image Upload
  let imageUrl = null;
  if (imageInput.files.length > 0) {
    const formData = new FormData();
    formData.append('image', imageInput.files[0]);
    try {
      const upRes = await fetchWithAuth(`${API_URL}/upload`, { method: 'POST', body: formData });
      if (upRes.ok) {
        const upData = await upRes.json();
        imageUrl = upData.imageUrl;
      } else {
        showToast('Error al subir imagen', 'error'); return;
      }
    } catch (err) { console.error(err); showToast('Error conexión imagen', 'error'); return; }
  }

  // 2. Data Gathering
  const colorsVal = document.getElementById('prod-colors').value;
  const photosVal = document.getElementById('prod-photos').value;

  const productData = {
    nombre: name,
    precio: parseFloat(price),
    stock: parseInt(stock),
    categoria: category,
    comprador: buyer,
    descripcion: description,
    colors: colorsVal ? colorsVal.split(',').map(c => c.trim()).filter(c => c) : [],
    photos: photosVal ? photosVal.split('\n').map(u => u.trim()).filter(u => u) : []
  };

  if (imageUrl) productData.imagen = imageUrl;
  else if (!id && !imageUrl) productData.imagen = '/images/default-earring.jpg';

  // 3. Save
  const method = id ? 'PUT' : 'POST';
  const url = id ? `${API_URL}/pendientes/${id}` : `${API_URL}/pendientes`;

  try {
    const res = await fetchWithAuth(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productData)
    });

    if (res.ok) {
      window.closeModal('product-modal');
      fetchPendientes();
      showToast(id ? 'Actualizado' : 'Creado');
    } else {
      const err = await res.json();
      showToast(err.message || 'Error al guardar', 'error');
    }
  } catch (err) { console.error(err); showToast('Error conexión', 'error'); }
}

// --- MISSING ADMIN FUNCTIONS ---
async function deleteProduct(id) {
  if (!confirm('¿Eliminar producto?')) return;
  try {
    const res = await fetchWithAuth(`${API_URL}/pendientes/${id}`, { method: 'DELETE' });
    if (res.ok) {
      showToast('Eliminado');
      fetchPendientes();
    } else {
      showToast('Error al eliminar', 'error');
    }
  } catch (err) { showToast('Error conexión', 'error'); }
}

window.downloadBackup = async function () {
  if (!token) return;
  try {
    const res = await fetchWithAuth(`${API_URL}/backup`);
    if (res.ok) {
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      showToast('Backup descargado');
    }
  } catch (e) { showToast('Error backup', 'error'); }
}

window.deleteProduct = deleteProduct; // Expose globally just in case
// --- CATEGORY MANAGER ---
window.openCategoriesModal = function () {
  document.getElementById('categories-modal').style.display = 'flex';
  renderCategoriesTable();
}

function renderCategoriesTable() {
  const table = document.getElementById('categories-table');
  if (!table) return;

  if (!categories.length) {
    table.innerHTML = '<tr><td colspan="2" style="text-align:center; padding:10px;">No hay categorías.</td></tr>';
    return;
  }

  table.innerHTML = categories.map(cat => `
        <tr>
            <td style="padding:10px; border-bottom:1px solid #eee;">${cat}</td>
            <td style="text-align:right; padding:10px; border-bottom:1px solid #eee;">
                <button onclick="deleteCategory('${cat}')" style="color:red; background:none; border:none; cursor:pointer;" title="Eliminar">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

window.addCategory = async function () {
  const input = document.getElementById('new-cat-name');
  const name = input.value.trim();
  if (!name) return;

  try {
    const res = await fetchWithAuth(`${API_URL}/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });

    if (res.ok) {
      categories = await res.json();
      input.value = '';
      renderFilters();
      renderCategoriesTable();
      showToast('Categoría añadida');
    } else {
      showToast('Error al añadir', 'error');
    }
  } catch (e) { showToast('Error conexión', 'error'); }
}

window.deleteCategory = async function (name) {
  if (!confirm(`¿Eliminar categoría "${name}"?`)) return;
  try {
    const res = await fetchWithAuth(`${API_URL}/categories/${name}`, { method: 'DELETE' });
    if (res.ok) {
      categories = categories.filter(c => c !== name);
      renderFilters();
      renderCategoriesTable();
      showToast('Categoría eliminada');
    } else {
      showToast('Error al eliminar', 'error');
    }
  } catch (e) { showToast('Error conexión', 'error'); }
}
window.saveDescription = async function (id) {
  const newDesc = document.getElementById('admin-desc-input').value;
  try {
    const product = allProducts.find(p => String(p.id) === String(id));
    if (!product) return;

    // Update object
    const updated = { ...product, descripcion: newDesc };

    const res = await fetchWithAuth(`${API_URL}/pendientes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated)
    });

    if (res.ok) {
      // Update local memory
      const idx = allProducts.findIndex(p => String(p.id) === String(id));
      if (idx !== -1) allProducts[idx].descripcion = newDesc;

      showToast('Descripción guardada');
    } else {
      showToast('Error al guardar', 'error');
    }
  } catch (e) { showToast('Error conexión', 'error'); }
}
window.openEditModal = function (id) {
  const p = allProducts.find(product => String(product.id) === String(id));
  if (!p) { showToast('Producto no encontrado', 'error'); return; }

  const form = document.getElementById('product-form');
  if (form) form.reset();

  document.getElementById('prod-id').value = p.id;
  document.getElementById('prod-name').value = p.nombre;
  document.getElementById('prod-price').value = p.precio;
  document.getElementById('prod-category').value = p.categoria || 'Otros';
  document.getElementById('prod-stock').value = p.stock || 0;
  document.getElementById('prod-buyer').value = p.comprador || '';
  document.getElementById('prod-desc').value = p.descripcion || '';

  // Populate new fields
  document.getElementById('prod-colors').value = p.colors ? p.colors.join(', ') : '';
  document.getElementById('prod-photos').value = p.photos ? p.photos.join('\n') : '';

  const imgPreview = document.getElementById('image-preview');
  if (imgPreview) {
    if (p.imagen) {
      imgPreview.innerHTML = `<img src="${p.imagen}" style="height:80px; border-radius:8px;">`;
    } else { imgPreview.innerHTML = ''; }
  }

  document.getElementById('modal-title').textContent = 'Editar Pendiente';
  document.getElementById('product-modal').style.display = 'flex';
}
window.searchProducts = function (query) {
  const term = query.toLowerCase().trim();
  if (!term) {
    renderPendientes(); // Reset to current category view
    return;
  }

  // Filter globally across all products
  const filtered = allProducts.filter(p =>
    p.nombre.toLowerCase().includes(term) ||
    (p.descripcion && p.descripcion.toLowerCase().includes(term)) ||
    (p.categoria && p.categoria.toLowerCase().includes(term))
  );

  const container = document.getElementById('pendientes-container');
  if (!container) return;

  if (!filtered.length) {
    container.innerHTML = `<p style="text-align:center; width:100%; color:#888; padding:20px;">No se encontraron resultados para "${query}".</p>`;
    return;
  }

  // Temporarily override render logic for search results
  // We reuse the render logic but manually populate the container to avoid complex state changes
  // Actually, let's just use a temporary override of currentCategory? No, that's messy.
  // Let's just render the filtered list directly.

  container.innerHTML = '';
  filtered.forEach(p => {
    // Reuse the HTML generation logic? 
    // Best to refactor ensure renderPendientes accepts an optional list, but for now duplicate the card generation specific for search or just reuse render helper?
    // Let's modify renderPendientes to accept a list override, or just copy the card gen logic here for "Spectacular" speed.

    // Let's be smart: The rendering logic is complex (admin buttons, etc). 
    // Let's hack renderPendientes to support a specific list if passed?
    // No, let's just call renderPendientes with a global override.

    // WAIT: renderPendientes reads 'allProducts' and filters by 'currentCategory'.
    // Let's add a 'currentSearch' global?
  });

  // BETTER APPROACH:
  // Let's modify `renderPendientes` to check if there is a search term.
  // But since I can't easily modify the middle of the file without context, I will create a standalone render helper or 
  // simply put the render logic here. 

  // Actually, looking at the code, `renderPendientes` is clean. 
  // I'll append a `renderProductCard(p)` helper? No.
  // I will iterate and build HTML here. It's safer.

  // ... Actually, I'll just clear the container and reuse `renderPendientes` logic by manually creating the elements.
  // This duplicates code but avoids breaking the existing function which I can't easily replace in full.

  filtered.forEach(p => {
    const div = document.createElement('div');
    div.className = 'pendiente';
    div.dataset.id = p.id;

    const isSoldOut = p.stock <= 0;
    const isReserved = p.comprador && isSoldOut;

    const adminHtml = token ? `
           <div class="admin-actions">
             <button class="btn-admin btn-edit" data-id="${p.id}"><i class="fa-solid fa-pencil"></i></button>
             <button class="btn-admin btn-delete" data-id="${p.id}"><i class="fa-solid fa-trash"></i></button>
           </div>
        ` : '';

    // Simplified client action for search view (consistent with main view)
    let clientActionHtml = '';
    if (!token) {
      if (isSoldOut) {
        clientActionHtml = `<button class="btn-reserve" style="background:#ff9f43; color:white; border:none; width:100%; margin-top:8px; padding:8px; border-radius:4px;" onclick="event.stopPropagation(); openRequestModal('${p.id}', '${p.nombre.replace(/'/g, "\\'")}')">Solicitar</button>`;
      } else if (!p.comprador) {
        // Quick Add Logic (Simplified for Search)
        clientActionHtml = `<button class="btn-add-cart" data-id="${p.id}" style="width:100%; margin-top:8px; background:var(--secondary-color); color:white; border:none; padding:8px; border-radius:4px;">Añadir</button>`;
      }
    }

    div.innerHTML = `
           ${adminHtml}
           ${isSoldOut && !isReserved ? '<div class="badge-sold">Agotado</div>' : ''}
           <div class="stock" style="${token ? 'display:block;' : ''}">Stock: ${p.stock}</div>
           <div class="image-container">
             <img src="${p.imagen || '/images/default-earring.jpg'}" alt="${p.nombre}" loading="lazy">
           </div>
           <div class="card-info">
             <h3>${p.nombre}</h3>
             <span class="price">${formatPrice(p.precio)}</span>
             <button class="btn-detail" type="button" style="width:100%; margin-top:10px; padding:8px; background:#f0f0f0; border:1px solid #ddd; border-radius:4px; cursor:pointer;"><i class="fa-solid fa-eye"></i> Ver Detalle</button>
             ${clientActionHtml}
           </div>
        `;
    container.appendChild(div);
  });
}

window.testEmailNotification = async function () {
  if (!token) return;
  showToast('Enviando test...', 'info');
  try {
    const res = await fetchWithAuth(`${API_URL}/test-email`, { method: 'POST' });
    const data = await res.json();
    if (res.ok) {
      showToast('¡ÉXITO! ' + data.message);
    } else {
      console.error(data);
      alert(`ERROR EMAIL:\n${data.message}\n${data.error || ''}`);
    }
  } catch (e) {
    showToast('Error de conexión', 'error');
    alert(e.message);
  }
}
// End of app.js
