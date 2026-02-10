document.addEventListener('DOMContentLoaded', () => {
  const pendientesContainer = document.getElementById('pendientes-container');

  fetch('/api/pendientes')
    .then(response => response.json())
    .then(pendientes => {
      pendientesContainer.innerHTML = ''; // Limpiar el contenedor
      pendientes.forEach(pendiente => {
        const pendienteElement = document.createElement('div');
        pendienteElement.className = 'pendiente';
        pendienteElement.innerHTML = `
          <img src="${pendiente.imagen}" alt="${pendiente.nombre}" width="150">
          <h3>${pendiente.nombre}</h3>
          <p>Precio: ${pendiente.precio.toFixed(2)} €</p>
          <p>Stock: ${pendiente.stock}</p>
        `;
        pendientesContainer.appendChild(pendienteElement);
      });
    })
    .catch(error => {
      console.error('Error al cargar los pendientes:', error);
      pendientesContainer.innerHTML = '<p>No se pudieron cargar los pendientes.</p>';
    });
});
