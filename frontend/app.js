document.addEventListener('DOMContentLoaded', () => {
  const pendientesContainer = document.getElementById('pendientes-container');

  const getImageUrl = (imagePath) => {
    // Simple helper to decide if we use the local image or a placeholder
    // In a real app we might check if file exists via HEAD request, 
    // but for now we assume if it's in the DB it *should* work.
    // If it fails to load, the error event on <img> will handle it.
    return imagePath;
  };

  fetch('/api/pendientes')
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(pendientes => {
      pendientesContainer.innerHTML = ''; // Limpiar spinner

      if (pendientes.length === 0) {
        pendientesContainer.innerHTML = '<p class="error-msg">No hay pendientes disponibles en este momento.</p>';
        return;
      }

      pendientes.forEach(pendiente => {
        const pendienteElement = document.createElement('div');
        pendienteElement.className = 'pendiente';

        // Use a default placeholder if image load fails
        const img = new Image();
        img.src = pendiente.imagen;
        const imgSrc = pendiente.imagen;

        pendienteElement.innerHTML = `
          <img src="${imgSrc}" alt="${pendiente.nombre}" onerror="this.onerror=null;this.src='https://placehold.co/400x300?text=Imagen+No+Disponible';">
          <h3>${pendiente.nombre}</h3>
          <p class="price">${Number(pendiente.precio).toFixed(2)} €</p>
          <p class="stock">Stock: ${pendiente.stock} unidades</p>
        `;
        pendientesContainer.appendChild(pendienteElement);
      });
    })
    .catch(error => {
      console.error('Error al cargar los pendientes:', error);
      pendientesContainer.innerHTML = `
                <div class="error-msg">
                    <p>Lo sentimos, no se pudieron cargar los productos.</p>
                    <p>Intente recargar la página más tarde.</p>
                </div>`;
    });
});
