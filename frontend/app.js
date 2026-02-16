const API_URL = '/api';
let token = localStorage.getItem('admin_token');
let allProducts = [];
let cart = [];
let categories = [];
let currentCategory = 'all';

document.addEventListener('DOMContentLoaded', () => {
  checkLoginState();
  fetchCategories(); // Load categories first/parallel
  fetchPendientes();

  // Inject Admin CSS if needed (simplest way to unify styles across single page app)
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = '/admin.css';
  document.head.appendChild(link);

  console.log('App v3 initialized');
  // Short delay to ensure toast container is ready
  setTimeout(() => showToast('Sistema actualizado v3.1'), 1000);

  // Listeners Forms
  const loginForm = document.getElementById('login-form');
  if (loginForm) loginForm.addEventListener('submit', handleLogin);

  const productForm = document.getElementById('product-form');
  if (productForm) productForm.addEventListener('submit', handleProductSubmit);

  const checkoutForm = document.getElementById('checkout-form');
  if (checkoutForm) checkoutForm.addEventListener('submit', handleCheckoutSubmit);

  // Event Delegation for Button Clicks
  const container = document.getElementById('pendientes-container');
  if (container) {
    container.addEventListener('click', (e) => {
      const btnEdit = e.target.closest('.btn-edit');
      const btnDelete = e.target.closest('.btn-delete');
      const btnAddCart = e.target.closest('.btn-add-cart');

      if (btnEdit) {
        openEditModal(btnEdit.dataset.id);
      } else if (btnDelete) {
        deleteProduct(btnDelete.dataset.id);
      } else if (btnAddCart) {
        addToCart(btnAddCart.dataset.id);
      } else {
        // Check if clicked ON the card (image or info) but NOT on a button
        // Exclude specific interactive elements just in case
        if (e.target.closest('button') ||
          e.target.closest('input') ||
          e.target.closest('select') ||
          e.target.closest('.admin-actions') ||
          e.target.closest('.quick-add-container')) return;

        const card = e.target.closest('.pendiente');
        if (card) {
          const id = card.dataset.id;
          console.log('Click on card:', id); // Debug

          // Flexible ID matching needed for mixed types in JSON
          const product = allProducts.find(p => String(p.id) === String(id));

          if (product) {
            console.log('Opening modal for:', product.nombre);
            openDetailModal(product);
          } else {
            console.error('Product not found for ID:', id, 'All:', allProducts);
          }
        }
      }
    });
  }

  // Remove item from cart delegation (inside modal)
  const cartItemsContainer = document.getElementById('cart-items');
  if (cartItemsContainer) {
    cartItemsContainer.addEventListener('click', (e) => {
      const btnRemove = e.target.closest('.btn-remove-item');
      if (btnRemove) {
        removeFromCart(btnRemove.dataset.id, btnRemove.dataset.color || null);
      }
    });
  }

  // Filter Buttons Delegation
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
});

// --- CART LOGIC ---
// --- CART LOGIC ---
// --- CART LOGIC ---
function addToCart(arg, quantity = 1) {
  let product;

  // Determine if arg is ID or Product Object
  if (typeof arg === 'object' && arg !== null) {
    product = arg;
  } else {
    product = allProducts.find(p => String(p.id) === String(arg));

    // Logic for Quick Add from Grid
    const gridInput = document.getElementById(`qty-${arg}`);
    const gridColorSelect = document.getElementById(`color-${arg}`);

    if (gridInput) {
      quantity = parseInt(gridInput.value) || 1;
    }

    // Check Color Requirement
    if (gridColorSelect) {
      const selectedColor = gridColorSelect.value;
      if (!selectedColor) {
        showToast('Por favor, selecciona un color', 'info');
        return;
      }
      // Modify product to include selected color for cart uniqueness
      // We create a copy to not mutate the original product in list
      // But wait, cart logic checks ID. If we have variants, we need unique IDs or a better cart check.
      // For now, simpler: Just attach property.
      product = { ...product, selectedColor: selectedColor };
    }
  }

  if (!product) return;
  if (quantity < 1) return;

  // Check if already in cart
  // Check if already in cart (Check ID AND Color)
  const existingItem = cart.find(item =>
    String(item.id) === String(product.id) &&
    item.selectedColor === product.selectedColor
  );

  // Stock Check
  const currentQty = existingItem ? existingItem.qty : 0;
  if (product.stock !== undefined && (currentQty + quantity) > product.stock) {
    showToast(`Solo quedan ${product.stock} unidades`, 'error');
    return;
  }

  if (existingItem) {
    existingItem.qty += quantity;
    showToast(`Cantidad actualizada: ${product.nombre} (x${existingItem.qty})`);
  } else {
    cart.push({ ...product, qty: quantity });
    showToast(`Añadido: ${product.nombre} (x${quantity})`);
  }

  updateCartUI();
  renderPendientes(); // Re-render to update UI states if needed

  // Pulse animation on button
  const cartBtn = document.getElementById('cart-btn');
  if (cartBtn) {
    cartBtn.style.transform = 'scale(1.2)';
    setTimeout(() => cartBtn.style.transform = 'scale(1)', 200);
  }
}

function removeFromCart(id, color) {
  // If color is undefined/null, handle gracefully (legacy items)
  cart = cart.filter(item => {
    if (String(item.id) !== String(id)) return true; // Keep other IDs
    // If ID matches, check color
    // If item to remove has color, keep if colors don't match
    // If item to remove has NO color (null), keep if item has color?
    // Simplest: Filter out exact match
    return item.selectedColor !== color;
  });
  updateCartUI();
  renderCartModalItems(); // Re-render list inside modal
  renderPendientes(); // Update button state
}

function updateCartUI() {
  const countBadge = document.getElementById('cart-count');
  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);

  if (totalItems > 0) {
    countBadge.textContent = totalItems;
    countBadge.style.display = 'block';
  } else {
    countBadge.style.display = 'none';
  }
}

window.openCartModal = function () {
  renderCartModalItems();
  document.getElementById('cart-modal').style.display = 'flex';
}

function renderCartModalItems() {
  const container = document.getElementById('cart-items');
  const totalSpan = document.getElementById('cart-total-price');
  container.innerHTML = '';

  if (cart.length === 0) {
    container.innerHTML = '<p style="text-align:center; color:#888; padding: 2rem;">Tu cesta está vacía</p>';
    totalSpan.textContent = '0,00 €';
    return;
  }

  let total = 0;
  cart.forEach(item => {
    const itemTotal = item.precio * item.qty;
    total += itemTotal;

    const div = document.createElement('div');
    div.className = 'cart-item';
    div.innerHTML = `
      <div style="display:flex; align-items:center;">
        <img src="${item.imagen || '/images/default-earring.jpg'}" alt="${item.nombre}">
        <div>
          <span class="cart-item-title">
            ${item.nombre} 
            ${item.selectedColor ? `<br><small style="color:#666;">Color: ${item.selectedColor}</small>` : ''}
            <small>x${item.qty}</small>
          </span>
          <span class="cart-item-price">${formatPrice(itemTotal)}</span>
        </div>
      </div>
      <button class="btn-remove-item" data-id="${item.id}" data-color="${item.selectedColor || ''}"><i class="fa-solid fa-trash"></i></button>
    `;
    container.appendChild(div);
  });

  totalSpan.textContent = formatPrice(total);
}

async function handleCheckoutSubmit(e) {
  e.preventDefault();
  if (cart.length === 0) {
    showToast('La cesta está vacía', 'error');
    return;
  }

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
      showToast('¡Pedido confirmado! Te contactaremos pronto.');
      cart = []; // Empty cart
      updateCartUI();
      document.getElementById('checkout-form').reset();
      fetchPendientes(); // Refresh to see sold items
    } else {
      const err = await res.json();
      showToast(err.message || 'Error al pedir', 'error');
    }
  } catch (err) {
    console.error(err);
    showToast('Error de conexión', 'error');
  }
}

function formatPrice(amount) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);
}

// --- ADMIN ORDERS LOGIC ---
// --- ADMIN DASHBOARD LOGIC ---
// --- ADMIN ORDERS LOGIC ---
// --- ADMIN ORDERS LOGIC ---
window.openOrdersModal = async function () {
  if (!token) {
    showToast('Debes iniciar sesión como administrador', 'error');
    window.openLoginModal();
    return;
  }

  document.getElementById('orders-modal').style.display = 'flex';
  await fetchOrders();
}

window.openRequestsModal = async function () {
  if (!token) return;
  document.getElementById('requests-list-modal').style.display = 'flex';
  await fetchRequests();
}

async function fetchOrders() {
  const container = document.getElementById('orders-grid-container');
  // Make sure container exists before trying to set innerHTML
  if (!container) {
    console.error('Orders grid container not found!');
    return;
  }

  container.innerHTML = '<div style="text-align:center;">Cargando pedidos...</div>';

  try {
    const res = await fetchWithAuth(`${API_URL}/orders`);
    if (!res) return;

    if (res.ok) {
      const orders = await res.json();
      renderOrders(orders);
    } else {
      container.innerHTML = '<div style="text-align:center; color:red;">Error al cargar pedidos</div>';
    }
  } catch (err) {
    console.error(err);
    container.innerHTML = '<div style="text-align:center; color:red;">Error de conexión</div>';
  }
}

// Ensure this function is available globally
window.fetchOrders = fetchOrders;

async function fetchRequests() {
  const container = document.getElementById('requests-list');
  container.innerHTML = '<tr><td colspan="4" style="text-align:center;">Cargando solicitudes...</td></tr>';

  try {
    const res = await fetchWithAuth(`${API_URL}/requests`);
    if (!res) return;

    if (res.ok) {
      const requests = await res.json();
      renderRequests(requests);
    } else {
      container.innerHTML = '<tr><td colspan="4" style="text-align:center; color:red;">Error al cargar solicitudes</td></tr>';
    }
  } catch (err) {
    console.error(err);
    container.innerHTML = '<tr><td colspan="4" style="text-align:center; color:red;">Error de conexión</td></tr>';
  }
}

function renderRequests(list) {
  const container = document.getElementById('requests-list');
  container.innerHTML = '';

  if (!list || list.length === 0) {
    container.innerHTML = '<tr><td colspan="4" style="text-align:center;">No hay solicitudes</td></tr>';
    return;
  }

  list.forEach(r => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
            <td>${new Date(r.date).toLocaleDateString()}</td>
            <td>${r.name}<br><small>${r.contact}</small></td>
            <td>${r.productName}</td>
            <td>${r.message}</td>
        `;
    container.appendChild(tr);
  });
}


// --- ORDER CARD RENDERING (Replaces Table) ---
function renderOrders(orders) {
  const gridContainer = document.getElementById('orders-grid-container');
  if (!gridContainer) return; // Should exist now in HTML

  gridContainer.innerHTML = '';

  if (orders.length === 0) {
    gridContainer.innerHTML = '<div style="text-align:center; padding:2rem; color:#666;">No hay pedidos registrados</div>';
    return;
  }

  orders.forEach(order => {
    const date = new Date(order.date).toLocaleDateString('es-ES', {
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    // Items List
    let itemsHtml = '<ul style="padding-left:15px; margin:0; font-size:0.9rem;">';
    if (order.items && Array.isArray(order.items)) {
      order.items.forEach(item => {
        itemsHtml += `<li style="margin-bottom:4px;">${item.nombre} <b style="color:#555;">x${item.qty || 1}</b></li>`;
      });
    } else if (order.productName) {
      itemsHtml += `<li>${order.productName}</li>`;
    }
    itemsHtml += '</ul>';

    // Status Badge & Options
    const status = order.status || 'Pendiente';
    const badgeClass = {
      'Pendiente': 'pending', 'Preparación': 'pending',
      'Enviado': 'shipped', 'Entregado': 'shipped'
    }[status] || 'pending';

    const statusOptions = ['Pendiente', 'Preparación', 'Enviado', 'Entregado'];
    const optionsHtml = statusOptions.map(opt =>
      `<option value="${opt}" ${status === opt ? 'selected' : ''}>${opt}</option>`
    ).join('');

    // Phone Link
    const phone = order.customer.telefono ?
      `<a href="tel:${order.customer.telefono}" style="display:block; margin-top:4px; color:var(--secondary-color); text-decoration:none;"><i class="fa-solid fa-phone"></i> ${order.customer.telefono}</a>` : '';
    const email = `<div style="color:#666; font-size:0.9rem;">${order.customer.email}</div>`;

    // Card HTML
    const card = document.createElement('div');
    card.className = 'order-card';
    card.innerHTML = `
        <div class="order-header">
            <div class="order-date"><i class="fa-regular fa-clock"></i> ${date}</div>
            <div class="order-id" style="font-size:0.8rem; color:#999;">ID: ${order.id}</div>
            <span class="status-badge ${badgeClass}" style="margin-left:auto;">${status}</span>
        </div>
        <div class="order-body">
            <div class="order-client">
                <h4>Cliente</h4>
                <div style="font-weight:bold; margin-bottom:4px;">${order.customer.nombre} ${order.customer.apellidos || ''}</div>
                ${email}
                ${phone}
            </div>
            <div class="order-items">
                <h4>Pedido</h4>
                ${itemsHtml}
            </div>
        </div>
        <div class="order-footer">
            <div class="order-total">
                Total: ${formatPrice(order.total || order.price)}
            </div>
            <div class="order-actions">
                <select onchange="updateOrderStatus('${order.id}', this.value)" style="padding:8px; border-radius:6px; border:1px solid #ddd;">
                    ${optionsHtml}
                </select>
                <button class="btn-delete" onclick="deleteOrder('${order.id}')" title="Eliminar definitivamente" style="background:#ffebee; color:#d32f2f; border:none; padding:8px 12px; border-radius:6px;">
                    <i class="fa-solid fa-trash"></i> Eliminar
                </button>
            </div>
        </div>
    `;
    gridContainer.appendChild(card);
  });
}



// --- MODIFIED OPEN DETAIL MODAL (Qty > Stock Logic) ---
// --- MODIFIED OPEN DETAIL MODAL (Qty > Stock Logic) ---
// --- CONSOLIDATED OPEN DETAIL MODAL ---
// --- CONSOLIDATED OPEN DETAIL MODAL ---
window.openDetailModal = function (arg) { // Made global and flexible
  let product = arg;
  if (typeof arg === 'string' || typeof arg === 'number') {
    product = allProducts.find(p => String(p.id) === String(arg));
  }

  if (!product) {
    console.error('openDetailModal: Product not found', arg);
    return;
  }

  const modal = document.getElementById('detail-modal');
  if (!modal) return;

  // Store current product
  window.currentDetailProduct = product;

  // 1. Basic Info
  document.getElementById('detail-title').innerText = product.nombre;
  document.getElementById('detail-price').innerText = formatPrice(product.precio);
  document.getElementById('detail-description').innerText = product.descripcion || 'Pendientes artesanales hechos a mano.';

  // Images
  const mainImg = document.getElementById('detail-main-image'); // ID fixed from HTML check
  const thumbsContainer = document.getElementById('detail-thumbnails');

  mainImg.src = product.imagen || 'https://via.placeholder.com/300x400';
  thumbsContainer.innerHTML = '';

  const allPhotos = [product.imagen, ...(product.photos || [])].filter(Boolean);

  if (allPhotos.length > 1) {
    allPhotos.forEach(src => {
      const img = document.createElement('img');
      img.src = src;
      img.className = 'thumb';
      img.onclick = () => mainImg.src = src;
      thumbsContainer.appendChild(img);
    });
  }

  // 2. Colors Logic
  const colorContainer = document.getElementById('detail-color-container');
  const colorSelect = document.getElementById('detail-color-select');

  // Reset
  colorSelect.innerHTML = '<option value="">-- Selecciona un color --</option>';

  if (product.colors && product.colors.length > 0) {
    colorContainer.style.display = 'block';
    product.colors.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c;
      opt.innerText = c;
      colorSelect.appendChild(opt);
    });
  } else {
    colorContainer.style.display = 'none';
  }

  // 3. Admin: Add Photo (File Upload)
  // Check if container exists or create it
  let adminPhotoContainer = document.getElementById('admin-photo-actions');
  if (!adminPhotoContainer) {
    adminPhotoContainer = document.createElement('div');
    adminPhotoContainer.id = 'admin-photo-actions';
    // Insert after thumbs
    thumbsContainer.parentNode.appendChild(adminPhotoContainer);
  }

  if (token) {
    adminPhotoContainer.style.display = 'block';
    adminPhotoContainer.innerHTML = `
      <div style="margin-top:1rem; padding:1rem; background:#f9f9f9; border-radius:8px;">
        <h4 style="margin:0 0 10px 0;">Admin: Añadir Foto Extra</h4>
        <input type="file" id="admin-photo-input" accept="image/*" style="width:100%; margin-bottom:5px;">
        <button onclick="adminUploadPhoto('${product.id}')" class="btn-primary" style="font-size:0.8rem;">Subir Foto</button>
      </div>
    `;
  } else {
    adminPhotoContainer.style.display = 'none';
  }

  // 4. Client: Add to Cart & Quantity
  const btnAdd = document.getElementById('detail-add-btn');
  const qtyContainer = document.getElementById('detail-qty-container');
  const qtyInput = document.getElementById('detail-qty-input');

  if (token) {
    // Admin view: Hide cart controls
    if (btnAdd) btnAdd.style.display = 'none';
    if (qtyContainer) qtyContainer.style.display = 'none';
  } else {
    // Client view
    if (btnAdd) btnAdd.style.display = 'block';
    if (qtyContainer) qtyContainer.style.display = 'flex';

    // Logic
    const stock = parseInt(product.stock) || 0;
    qtyInput.value = 1;
    qtyInput.max = stock > 0 ? stock : '';

    if (stock <= 0) {
      btnAdd.innerText = 'Solicitar por Encargo';
      btnAdd.style.background = '#ff9f43';
      btnAdd.onclick = () => {
        const val = qtyInput.value;
        closeModal('detail-modal');
        openRequestModal(product.id, `${product.nombre} (x${val} solic.)`);
      };
    } else {
      btnAdd.innerText = 'Añadir a la Cesta';
      btnAdd.style.background = 'var(--gold-accent)';
      btnAdd.onclick = () => {
        const val = parseInt(qtyInput.value) || 1;
        if (val > stock) { showToast(`Solo hay ${stock} en stock`, 'error'); return; }

        const selectedColor = colorContainer.style.display !== 'none' ? colorSelect.value : null;
        if (product.colors && product.colors.length > 0 && !selectedColor) {
          showToast('Elige un color', 'info');
          return;
        }

        addToCart({ ...product, selectedColor }, val);
        closeModal('detail-modal');
      };
    }
  }

  // 5. Comments
  fetchComments(product.id);

  modal.style.display = 'flex';
}

// --- ADMIN UPLOAD PHOTO TO PRODUCT ---
window.adminUploadPhoto = async function (id) {
  const input = document.getElementById('admin-photo-input');
  if (!input.files || input.files.length === 0) {
    showToast('Selecciona una imagen primero', 'info');
    return;
  }

  const formData = new FormData();
  formData.append('image', input.files[0]);

  try {
    // 1. Upload File
    const uploadRes = await fetchWithAuth(`${API_URL}/upload`, {
      method: 'POST',
      body: formData // No Content-Type header (browser sets it with boundary)
    });

    if (!uploadRes.ok) throw new Error('Error subiendo imagen');

    const uploadData = await uploadRes.json();
    const newUrl = uploadData.imageUrl;

    // 2. Update Product
    const product = window.currentDetailProduct;
    if (!product.photos) product.photos = [];
    product.photos.push(newUrl);

    // We use PUT to update the whole product for now
    const updateRes = await fetchWithAuth(`${API_URL}/pendientes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product)
    });

    if (updateRes.ok) {
      showToast('Foto añadida con éxito');
      openDetailModal(product); // Refresh UI
      fetchPendientes(); // Refresh background list
    } else {
      showToast('Error al guardar datos del producto', 'error');
    }

  } catch (err) {
    console.error(err);
    showToast('Error en el proceso', 'error');
  }
}

window.updateOrderStatus = async function (id, newStatus) {
  try {
    const res = await fetchWithAuth(`${API_URL}/orders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });

    if (res && res.ok) {
      showToast(`Pedido actualizado: ${newStatus}`);
      fetchOrders(); // Refresh list to update badge colors if needed
    } else {
      showToast('Error al actualizar estado', 'error');
    }
  } catch (err) {
    console.error(err);
    showToast('Error de conexión', 'error');
  }
}

// --- ADMIN DASHBOARD LOGIC (Continued) ---
window.deleteOrder = async function (id) {
  if (!confirm('¿Seguro que quieres eliminar este pedido PERMANENTEMENTE?')) return;
  console.log('Deleting order:', id); // Debug log

  try {
    const res = await fetchWithAuth(`${API_URL}/orders/${id}`, {
      method: 'DELETE'
    });
    console.log('Delete response status:', res ? res.status : 'No response');

    if (res && res.ok) {
      showToast('Pedido eliminado');
      fetchOrders();
    } else {
      const txt = res ? await res.text() : 'No response';
      console.error('Delete failed:', txt);
      showToast('Error al eliminar', 'error');
    }
  } catch (err) {
    console.error('Delete exception:', err);
    showToast('Error de conexión', 'error');
  }
}

// --- STATE MANAGEMENT ---
function checkLoginState() {
  const adminBtn = document.getElementById('admin-btn');
  const logoutBtn = document.getElementById('logout-btn');
  const adminControls = document.getElementById('admin-controls'); // This div existed in original HTML

  if (token) {
    if (adminBtn) adminBtn.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = 'block';
    if (adminControls) adminControls.style.display = 'block';

    // Hide floating button if it exists (revert)
    const dashBtn = document.getElementById('admin-dash-btn');
    if (dashBtn) dashBtn.style.display = 'none';

    document.body.classList.add('is-admin');
  } else {
    if (adminBtn) adminBtn.style.display = 'block';
    if (logoutBtn) logoutBtn.style.display = 'none';
    if (adminControls) adminControls.style.display = 'none';

    const dashBtn = document.getElementById('admin-dash-btn');
    if (dashBtn) dashBtn.style.display = 'none';

    document.body.classList.remove('is-admin');
  }

  // Toggle Category Management Button
  const btnManageCats = document.getElementById('btn-manage-cats');
  if (btnManageCats) {
    btnManageCats.style.display = token ? 'inline-flex' : 'none';
  }

  renderPendientes();
}

window.logout = function () {
  localStorage.removeItem('admin_token');
  token = null;
  checkLoginState();
}

window.downloadBackup = async function () {
  if (!token) return;

  try {
    const res = await fetchWithAuth(`${API_URL}/backup`);
    if (res && res.ok) {
      const result = await res.json();

      // 1. Notify Server Save
      showToast(result.message || 'Backup generado');

      // 2. Try Client Download
      if (result.data) {
        const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pendientes_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
      }
    } else {
      showToast('Error al generar backup', 'error');
    }
  } catch (err) {
    console.error(err);
    showToast('Error de conexión', 'error');
  }
}

window.openLoginModal = function () {
  document.getElementById('login-modal').style.display = 'flex';
}

window.openProductModal = function () {
  document.getElementById('product-form').reset();
  const prodIdInput = document.getElementById('prod-id');
  if (prodIdInput) prodIdInput.value = '';
  const imgPreview = document.getElementById('image-preview');
  if (imgPreview) imgPreview.innerHTML = '';
  document.getElementById('modal-title').textContent = 'Nuevo Pendiente';

  // Populate Categories
  const catSelect = document.getElementById('prod-category');
  if (catSelect) {
    catSelect.innerHTML = categories.map(c => `<option value="${c}">${c}</option>`).join('');
    // Default to 'Aros' or first
    if (categories.length > 0) catSelect.value = categories[0];
  }

  document.getElementById('product-modal').style.display = 'flex';
}

window.closeModal = function (modalId) {
  document.getElementById(modalId).style.display = 'none';
}

// --- TOAST NOTIFICATIONS ---
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  const icon = type === 'success' ? '<i class="fa-solid fa-check-circle"></i>' : '<i class="fa-solid fa-circle-exclamation"></i>';

  toast.innerHTML = `${icon} <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'slideIn 0.3s ease-out reverse';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// --- API CALLS ---
async function fetchPendientes() {
  const container = document.getElementById('pendientes-container');
  try {
    const response = await fetch(`${API_URL}/pendientes`);
    if (!response.ok) throw new Error('Error de red');
    const rawProducts = await response.json();

    // Normalize IDs to strings to avoid finding issues
    allProducts = rawProducts.map(p => ({ ...p, id: String(p.id) }));

    console.log('Products loaded:', allProducts); // Debug
    renderPendientes();
  } catch (error) {
    console.error('Error:', error);
    if (container) container.innerHTML = '<p class="error-msg">No se pudieron cargar los pendientes.</p>';
    showToast('Error al cargar productos', 'error');
  }
}

async function handleLogin(e) {
  e.preventDefault();
  const password = document.getElementById('admin-password').value;
  const errorMsg = document.getElementById('login-error');

  try {
    const res = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });

    if (res.ok) {
      const data = await res.json();
      token = data.token;
      localStorage.setItem('admin_token', token);
      window.closeModal('login-modal');
      document.getElementById('admin-password').value = '';
      errorMsg.textContent = '';
      checkLoginState();
      showToast('Bienvenido, Administrador');
    } else {
      errorMsg.textContent = 'Contraseña incorrecta';
    }
  } catch (err) {
    errorMsg.textContent = 'Error de conexión';
  }
}

async function fetchWithAuth(url, options = {}) {
  if (!token) {
    showToast('Sesión no iniciada', 'error');
    logout();
    return null;
  }

  if (!options.headers) options.headers = {};
  if (!options.headers['Authorization']) {
    options.headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, options);

  if (response.status === 401 || response.status === 403) {
    showToast('Sesión caducada. Ingresa de nuevo.', 'error');
    logout();
    return null;
  }

  return response;
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
  const imageInput = document.getElementById('prod-image');

  const method = id ? 'PUT' : 'POST';
  const url = id ? `${API_URL}/pendientes/${id}` : `${API_URL}/pendientes`;

  // 1. Upload Image logic
  let imageUrl = null;
  if (imageInput.files.length > 0) {
    const formData = new FormData();
    formData.append('image', imageInput.files[0]);
    try {
      const upRes = await fetchWithAuth(`${API_URL}/upload`, {
        method: 'POST',
        body: formData
      });

      if (!upRes) return;

      if (upRes.ok) {
        const upData = await upRes.json();
        imageUrl = upData.imageUrl;
      } else {
        showToast('Error al subir imagen', 'error'); return;
      }
    } catch (err) { console.error(err); showToast('Error de conexión (Imagen)', 'error'); return; }
  }

  // 2. Gather new fields
  const colorsVal = document.getElementById('prod-colors').value;
  const photosVal = document.getElementById('prod-photos').value;

  const productData = {
    nombre: name,
    precio: parseFloat(price),
    stock: parseInt(stock),
    categoria: category,
    comprador: buyer,
    colors: colorsVal ? colorsVal.split(',').map(c => c.trim()).filter(c => c) : [],
    photos: photosVal ? photosVal.split('\n').map(u => u.trim()).filter(u => u) : []
  };

  if (imageUrl) productData.imagen = imageUrl;
  else if (!id && !imageUrl) productData.imagen = '/images/default-earring.jpg';

  try {
    const res = await fetchWithAuth(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productData)
    });

    if (!res) return;

    if (res.ok) {
      window.closeModal('product-modal');
      fetchPendientes();
      showToast(id ? 'Pendiente actualizado' : 'Pendiente creado');
    } else {
      showToast('Error al guardar datos', 'error');
    }
  } catch (err) { console.error(err); showToast('Error de conexión', 'error'); }
}

async function deleteProduct(id) {
  if (!confirm('¿Seguro que quieres borrar este pendiente?')) return;
  try {
    const res = await fetchWithAuth(`${API_URL}/pendientes/${id}`, {
      method: 'DELETE'
    });

    if (!res) return;

    if (res.ok) {
      fetchPendientes();
      showToast('Pendiente eliminado');
    }
    else showToast('Error al eliminar', 'error');
  } catch (e) { console.error(e); showToast('Error de conexión', 'error'); }
}

function openEditModal(id) {
  const p = allProducts.find(product => String(product.id) === String(id));
  if (!p) { showToast('Producto no encontrado', 'error'); return; }

  document.getElementById('prod-id').value = p.id;
  document.getElementById('prod-name').value = p.nombre;
  document.getElementById('prod-price').value = p.precio;
  document.getElementById('prod-category').value = p.categoria || 'Otros';
  document.getElementById('prod-stock').value = p.stock || 0;
  document.getElementById('prod-buyer').value = p.comprador || '';

  // Populate new fields
  document.getElementById('prod-colors').value = p.colors ? p.colors.join(', ') : '';
  document.getElementById('prod-photos').value = p.photos ? p.photos.join('\n') : '';

  const imgPreview = document.getElementById('image-preview');
  if (p.imagen) {
    imgPreview.innerHTML = `<img src="${p.imagen}" style="height:80px; border-radius:8px;">`;
  } else { imgPreview.innerHTML = ''; }

  document.getElementById('modal-title').textContent = 'Editar Pendiente';
  document.getElementById('product-modal').style.display = 'flex';
}

// --- RENDER ---
function renderPendientes() {
  const container = document.getElementById('pendientes-container');
  if (!container) return;
  container.innerHTML = '';

  if (allProducts.length === 0) {
    container.innerHTML = '<p style="text-align:center; width:100%; color:#888;">No hay pendientes disponibles todavía.</p>';
    return;
  }

  // FILTERING logic
  const filtered = currentCategory === 'all'
    ? allProducts
    : allProducts.filter(p => p.categoria === currentCategory);

  if (filtered.length === 0) {
    container.innerHTML = '<p style="text-align:center; width:100%; color:#888;">No hay pendientes en esta categoría.</p>';
    return;
  }

  filtered.forEach(p => {
    const div = document.createElement('div');
    div.className = 'pendiente';
    div.dataset.id = p.id;
    // Direct onclick to bypass delegation issues
    div.setAttribute('onclick', `openDetailModal('${p.id}')`);

    const isSoldOut = p.stock <= 0;
    const isReserved = p.comprador && p.stock <= 0;

    // Admin Actions (stop propagation handled above)
    const adminActions = token ? `
        <div class="admin-actions" onclick="event.stopPropagation()">
            <button class="btn-admin btn-edit" onclick="openEditModal('${p.id}')"><i class="fa-solid fa-pencil"></i></button>
            <button class="btn-admin btn-delete" onclick="deleteProduct('${p.id}')"><i class="fa-solid fa-trash"></i></button>
        </div>
    ` : '';

    // Status Badges & Action Button
    let tags = '';
    let actionButton = '';

    // VISTA CLIENTE
    if (!token) {
      const isInCart = cart.some(item => String(item.id) === String(p.id));

      if (p.stock <= 0) {
        actionButton = `<button class="btn-reserve" style="background:#ff9f43; color:white; border:none;" onclick="event.stopPropagation(); openRequestModal('${p.id}', '${p.nombre.replace(/'/g, "\\'")}')">Solicitar</button>`;
      }
      else if (p.comprador) {
        // Don't show anything for customers even if reserved/sold
        tags = '';
      }
      else {
        // QUICK ADD FEATURES
        const maxQty = p.stock || 1;

        let colorSelectorHtml = '';
        if (p.colors && p.colors.length > 0) {
          colorSelectorHtml = `
            <select id="color-${p.id}" class="quick-color-select" style="margin-top:5px; width:100%; padding:4px; border:1px solid #ddd; border-radius:4px; font-size:0.85rem;">
              <option value="">-- Color --</option>
              ${p.colors.map(c => `<option value="${c}">${c}</option>`).join('')}
            </select>
          `;
        }

        actionButton = `
          <div class="quick-add-container" style="margin-top:8px;" onclick="event.stopPropagation()">
            ${colorSelectorHtml}
            <div style="display:flex; align-items:center; gap:5px; margin-top:5px;">
              <input type="number" id="qty-${p.id}" class="qty-input" value="1" min="1" max="${maxQty}" 
                     style="width:50px; padding:6px; border:1px solid #ddd; border-radius:4px; text-align:center;">
              <button class="btn-reserve btn-add-cart" data-id="${p.id}" style="flex:1;" onclick="addToCart('${p.id}')">Añadir</button>
            </div>
          </div>
        `;
      }
    }

    div.innerHTML = `
      ${adminActions}
      ${isReserved ? '' : ''}
      ${isSoldOut && !isReserved ? '<div class="badge-sold">Agotado</div>' : ''}
      <div class="stock" style="${token ? 'display:block;' : ''}">Stock: ${p.stock}</div>
      
      <div class="image-container">
        <img src="${p.imagen || 'https://via.placeholder.com/300x400'}" alt="${p.nombre}" loading="lazy">
      </div>
      
      <div class="card-info">
        <h3>${p.nombre}</h3>
        <span class="price">${formatPrice(p.precio)}</span>
        <div class="meta">Arcilla Polimérica</div>
        
        <!-- EXPLICIT DETAIL BUTTON -->
        <button class="btn-detail" onclick="openDetailModal('${p.id}')" style="width:100%; margin-top:5px; padding:8px; background:#f0f0f0; border:1px solid #ddd; border-radius:4px; cursor:pointer;">
            <i class="fa-solid fa-eye"></i> Ver Detalle
        </button>

        ${!token ? actionButton : ''} 
      </div>
    `;
    container.appendChild(div);
  });
}

// --- PRODUCT DETAIL MODAL ---
window.currentDetailProduct = null;

// Duplicate openDetailModal removed
// Consolidated version is at top of file


function renderComments(comments) {
  const list = document.getElementById('detail-comments-list');
  list.innerHTML = '';
  if (!comments || comments.length === 0) {
    list.innerHTML = '<p style="color:#999;font-style:italic;">No hay comentarios todavía. ¡Sé el primero!</p>';
    return;
  }

  comments.forEach(c => {
    const item = document.createElement('div');
    item.className = 'comment-item';
    item.innerHTML = `
            <div class="comment-user">${c.user} <span class="comment-date">${new Date(c.date).toLocaleDateString()}</span></div>
            <span class="comment-text">${c.text}</span>
        `;
    list.appendChild(item);
  });
}

// Handle Comment Submit
document.getElementById('comment-form').onsubmit = async (e) => {
  e.preventDefault();
  if (!window.currentDetailProduct) return;

  const user = document.getElementById('comment-user').value;
  const text = document.getElementById('comment-text').value;
  const pid = window.currentDetailProduct.id;

  try {
    const res = await fetch(`${API_URL}/products/${pid}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user, text })
    });

    if (res.ok) {
      const newComment = await res.json();
      // Update local state
      if (!window.currentDetailProduct.comments) window.currentDetailProduct.comments = [];
      window.currentDetailProduct.comments.push(newComment);
      renderComments(window.currentDetailProduct.comments);
      document.getElementById('comment-form').reset();
      showToast('¡Comentario añadido!');
    } else {
      showToast('Error al enviar comentario', 'error');
    }
  } catch (err) {
    console.error(err);
    showToast('Error de conexión', 'error');
  }
};


// --- REQUESTS LOGIC ---
function openRequestModal(id, name) {
  document.getElementById('req-prod-id').value = id;
  document.getElementById('req-prod-name-hidden').value = name;
  document.getElementById('req-prod-name').textContent = `Producto: ${name}`;
  document.getElementById('request-modal').style.display = 'flex';
}

async function handleRequestSubmit(e) {
  e.preventDefault();
  const name = document.getElementById('req-name').value;
  const contact = document.getElementById('req-contact').value;
  const message = document.getElementById('req-message').value;
  const productId = document.getElementById('req-prod-id').value;
  const productName = document.getElementById('req-prod-name-hidden').value;

  try {
    const res = await fetch(`${API_URL}/requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, contact, message, productId, productName })
    });

    if (res.ok) {
      window.closeModal('request-modal');
      showToast('¡Solicitud enviada! Gracias.');
      document.getElementById('request-form').reset();
    } else {
      showToast('Error al enviar solicitud', 'error');
    }
  } catch (err) {
    console.error(err);
    showToast('Error de conexión', 'error');
  }
}

// --- ADMIN REQUESTS ---
window.openRequestsModal = async function () {
  if (!token) return;
  document.getElementById('requests-list-modal').style.display = 'flex';
  await fetchRequests();
}

async function fetchRequests() {
  const container = document.getElementById('requests-list');
  container.innerHTML = '<tr><td colspan="5" style="text-align:center;">Cargando...</td></tr>';

  try {
    const res = await fetchWithAuth(`${API_URL}/requests`);
    if (!res) return;

    if (res.ok) {
      const requests = await res.json();
      if (requests.length === 0) {
        container.innerHTML = '<tr><td colspan="5" style="text-align:center;">No hay solicitudes.</td></tr>';
        return;
      }

      container.innerHTML = requests.map(r => `
        <tr>
          <td>${new Date(r.date).toLocaleDateString()}</td>
          <td>
            <strong>${r.name}</strong><br>
            <small>${r.contact}</small>
          </td>
          <td>${r.productName}</td>
          <td>${r.message}</td>
          <td>
            <button onclick="deleteRequest('${r.id}')" style="background:none; border:none; color:#d32f2f; cursor:pointer;" title="Eliminar solicitud">
              <i class="fa-solid fa-trash"></i>
            </button>
          </td>
        </tr>
      `).join('');
    }
  } catch (err) {
    container.innerHTML = '<tr><td colspan="5" style="text-align:center; color:red;">Error al cargar.</td></tr>';
  }
}

window.deleteRequest = async function (id) {
  if (!confirm('¿Eliminar solicitud permanentemente?')) return;

  try {
    const res = await fetchWithAuth(`${API_URL}/requests/${id}`, { method: 'DELETE' });
    if (res.ok) {
      showToast('Solicitud eliminada');
      fetchRequests();
    } else {
      showToast('Error al eliminar', 'error');
    }
  } catch (e) {
    console.error(e);
    showToast('Error de conexión', 'error');
  }
}

// --- CATEGORIES LOGIC ---
async function fetchCategories() {
  try {
    const res = await fetch(`${API_URL}/categories`);
    if (res.ok) {
      categories = await res.json();
      renderFilters();
    }
  } catch (e) {
    console.error('Error loading categories', e);
  }
}

function renderFilters() {
  const container = document.getElementById('dynamic-filters');
  if (!container) return;

  let html = `<button class="filter-btn ${currentCategory === 'all' ? 'active' : ''}" data-category="all">Todos</button>`;

  categories.forEach(cat => {
    html += `<button class="filter-btn ${currentCategory === cat ? 'active' : ''}" data-category="${cat}">${cat}</button>`;
  });

  container.innerHTML = html;
}

window.openCategoriesModal = function () {
  const modal = document.getElementById('categories-modal');
  if (modal) {
    modal.style.display = 'flex';
    renderCategoriesTable();
  }
}

function renderCategoriesTable() {
  const table = document.getElementById('categories-table');
  if (!table) return;
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
  } catch (e) {
    showToast('Error de conexión', 'error');
  }
}

window.deleteCategory = async function (name) {
  if (!confirm(`¿Eliminar categoría "${name}"?`)) return;
  try {
    const res = await fetchWithAuth(`${API_URL}/categories/${name}`, { method: 'DELETE' });
    if (res.ok) {
      showToast('Categoría eliminada');
      categories = categories.filter(c => c !== name);
      renderFilters();
      renderCategoriesTable();
    } else {
      showToast('Error al eliminar', 'error');
    }
  } catch (e) {
    showToast('Error de conexión', 'error');
  }
}

// End of file

