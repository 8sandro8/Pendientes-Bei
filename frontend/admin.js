const token = localStorage.getItem('adminToken');

if (!token) {
    window.location.href = '/login.html';
}

const tableBody = document.querySelector('#products-table tbody');
const modal = document.getElementById('productModal');
const productForm = document.getElementById('product-form');
const modalTitle = document.getElementById('modal-title');

// Cargar productos al inicio
fetchProducts();

async function fetchProducts() {
    try {
        const response = await fetch('/api/pendientes');
        const products = await response.json();
        renderTable(products);
    } catch (error) {
        console.error('Error al cargar productos:', error);
    }
}

function renderTable(products) {
    tableBody.innerHTML = '';
    products.forEach(p => {
        const row = document.createElement('tr');
        row.innerHTML = `
      <td><img src="${p.imagen}" alt="${p.nombre}" style="width: 50px; height: 50px; object-fit: cover;"></td>
      <td>${p.nombre}</td>
      <td>${Number(p.precio).toFixed(2)} €</td>
      <td>${p.stock}</td>
      <td>
        <button class="btn-edit" onclick='editProduct(${JSON.stringify(p)})'>Editar</button>
        <button class="btn-delete" onclick="deleteProduct('${p.id}')">Eliminar</button>
      </td>
    `;
        tableBody.appendChild(row);
    });
}

function openModal(product = null) {
    modal.style.display = 'block';
    if (product) {
        modalTitle.textContent = 'Editar Pendiente';
        document.getElementById('product-id').value = product.id;
        document.getElementById('nombre').value = product.nombre;
        document.getElementById('precio').value = product.precio;
        document.getElementById('stock').value = product.stock;
        document.getElementById('imagen').value = product.imagen;
    } else {
        modalTitle.textContent = 'Agregar Pendiente';
        productForm.reset();
        document.getElementById('product-id').value = '';
    }
}

function closeModal() {
    modal.style.display = 'none';
}

productForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = document.getElementById('product-id').value;
    const productData = {
        nombre: document.getElementById('nombre').value,
        precio: parseFloat(document.getElementById('precio').value),
        stock: parseInt(document.getElementById('stock').value),
        imagen: document.getElementById('imagen').value,
        categorias: [] // Placeholder si añadimos categorías luego
    };

    const url = id ? `/api/pendientes/${id}` : '/api/pendientes';
    const method = id ? 'PUT' : 'POST';

    try {
        // Si estamos editando y no cambiamos el ID, no lo mandamos en el body (aunque la API lo ignora o sobreescribe)
        if (id) productData.id = id;

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(productData)
        });

        if (response.ok) {
            closeModal();
            fetchProducts(); // Recargar tabla
        } else {
            alert('Error al guardar el producto');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error de conexión');
    }
});

async function deleteProduct(id) {
    if (!confirm('¿Estás seguro de eliminar este pendiente?')) return;

    try {
        const response = await fetch(`/api/pendientes/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            fetchProducts();
        } else {
            alert('Error al eliminar');
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

function editProduct(product) {
    openModal(product);
}

function logout() {
    localStorage.removeItem('adminToken');
    window.location.href = '/login.html';
}

// Cerrar modal si se hace clic fuera
window.onclick = function (event) {
    if (event.target == modal) {
        closeModal();
    }
}
