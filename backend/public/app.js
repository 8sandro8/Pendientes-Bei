const API_URL = '/api';
let token = localStorage.getItem('admin_token');
let allProducts = [];

document.addEventListener('DOMContentLoaded', () => {
  checkLoginState();
  fetchPendientes();

  // Listeners Forms
  document.getElementById('login-form').addEventListener('submit', handleLogin);
  document.getElementById('product-form').addEventListener('submit', handleProductSubmit);

  // Close modals on outside click
  // Event Delegation for Edit/Delete buttons (Robustez)
  document.getElementById('pendientes-container').addEventListener('click', (e) => {
    const btnEdit = e.target.closest('.btn-edit');
    const btnDelete = e.target.closest('.btn-delete');

    if (btnEdit) {
      const id = btnEdit.dataset.id;
      openEditModal(id);
    } else if (btnDelete) {
      const id = btnDelete.dataset.id;
      deleteProduct(id);
    }
  });
});

// --- STATE MANAGEMENT ---
function checkLoginState() {
  const adminBtn = document.getElementById('admin-btn');
  const logoutBtn = document.getElementById('logout-btn');
  const adminControls = document.getElementById('admin-controls');

  if (token) {
    adminBtn.style.display = 'none';
    logoutBtn.style.display = 'block';
    adminControls.style.display = 'block';
    document.body.classList.add('is-admin');
  } else {
    adminBtn.style.display = 'block';
    logoutBtn.style.display = 'none';
    adminControls.style.display = 'none';
    document.body.classList.remove('is-admin');
  }
  renderPendientes();
}

// Hacer globales las funciones necesarias para el HTML (aunque usaremos delegación para las cards)
window.logout = function () {
  localStorage.removeItem('admin_token');
  token = null;
  checkLoginState();
}

window.openLoginModal = function () {
  document.getElementById('login-modal').style.display = 'flex';
}

window.openProductModal = function () {
  document.getElementById('product-form').reset();
  document.getElementById('prod-id').value = ''; // Reset ID
  document.getElementById('image-preview').innerHTML = ''; // Reset imagen
  document.getElementById('modal-title').textContent = 'Nuevo Pendiente';
  document.getElementById('product-modal').style.display = 'flex';
}

window.closeModal = function (modalId) {
  document.getElementById(modalId).style.display = 'none';
}

// --- API CALLS ---
async function fetchPendientes() {
  const container = document.getElementById('pendientes-container');
  try {
    const response = await fetch(`${API_URL}/pendientes`);
    if (!response.ok) throw new Error('Error de red');
    allProducts = await response.json();
    renderPendientes();
  } catch (error) {
    console.error('Error:', error);
    container.innerHTML = '<p class="error-msg">No se pudieron cargar los pendientes.</p>';
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
    } else {
      errorMsg.textContent = 'Contraseña incorrecta';
    }
  } catch (err) {
    errorMsg.textContent = 'Error de conexión';
  }
}

async function handleProductSubmit(e) {
  e.preventDefault();
  if (!token) return;

  const id = document.getElementById('prod-id').value;
  const name = document.getElementById('prod-name').value;
  const price = document.getElementById('prod-price').value;
  const stock = document.getElementById('prod-stock').value;
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
      const upRes = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      if (upRes.ok) {
        const upData = await upRes.json();
        imageUrl = upData.imageUrl;
      } else {
        alert('Error al subir la imagen'); return;
      }
    } catch (err) { alert('Error subida'); return; }
  }

  const productData = {
    nombre: name,
    precio: parseFloat(price),
    stock: parseInt(stock),
    comprador: buyer
  };

  if (imageUrl) productData.imagen = imageUrl;
  else if (!id && !imageUrl) productData.imagen = '/images/default-earring.jpg';

  try {
    const res = await fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(productData)
    });

    if (res.ok) {
      window.closeModal('product-modal');
      fetchPendientes();
    } else {
      alert('Error al guardar');
    }
  } catch (err) { alert('Error de conexión'); }
}

async function deleteProduct(id) {
  if (!confirm('¿Seguro que quieres borrar este pendiente?')) return;
  try {
    const res = await fetch(`${API_URL}/pendientes/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) fetchPendientes();
    else alert('Error al eliminar');
  } catch (e) { alert('Error de conexión'); }
}

function openEditModal(id) {
  console.log('Abriendo modal para ID:', id);
  const p = allProducts.find(product => String(product.id) === String(id));
  if (!p) { console.error('Producto no encontrado'); return; }

  document.getElementById('prod-id').value = p.id;
  document.getElementById('prod-name').value = p.nombre;
  document.getElementById('prod-price').value = p.precio;
  document.getElementById('prod-stock').value = p.stock || 0;
  document.getElementById('prod-buyer').value = p.comprador || '';

  // Preview imagen actual (opcional)
  const imgPreview = document.getElementById('image-preview');
  if (p.imagen) {
    imgPreview.innerHTML = `<img src="${p.imagen}" style="height:50px;"> (Actual)`;
  } else { imgPreview.innerHTML = ''; }

  document.getElementById('modal-title').textContent = 'Editar Pendiente';
  document.getElementById('product-modal').style.display = 'flex';
}

// --- RENDER ---
function renderPendientes() {
  const container = document.getElementById('pendientes-container');
  container.innerHTML = '';

  if (allProducts.length === 0) {
    container.innerHTML = '<p>No hay pendientes disponibles.</p>';
    return;
  }

  allProducts.forEach(p => {
    const card = document.createElement('div');
    card.className = 'pendiente';

    let adminActions = '';
    if (token) {
      // USAMOS CLASES btn-edit y btn-delete y DATA-ID para la delegación
      adminActions = `
                <div class="admin-actions">
                    <button class="btn-icon btn-edit" data-id="${p.id}"><i class="fa-solid fa-pen"></i></button>
                    <button class="btn-icon btn-delete" data-id="${p.id}" style="color:#e74c3c"><i class="fa-solid fa-trash"></i></button>
                </div>
            `;
    }

    let tags = '';
    if (p.stock <= 0) tags = '<span class="badge-sold">Agotado</span>';
    else if (p.comprador) tags = `<span class="badge-buyer">${token ? p.comprador : 'Reservado'}</span>`;
    else tags = `<span class="stock">${p.stock} disponibles</span>`;

    const imageSrc = p.imagen || '/images/default-earring.jpg';

    card.innerHTML = `
            ${adminActions}
            <div class="image-container">
                <img src="${imageSrc}" alt="${p.nombre}" loading="lazy">
            </div>
            <div class="meta">${tags}</div>
            <h3>${p.nombre}</h3>
            <span class="price">${p.precio.toFixed(2)} €</span>
        `;
    container.appendChild(card);
  });
}
