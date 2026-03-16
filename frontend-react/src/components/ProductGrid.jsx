import { useState, useEffect } from 'react';
import ProductCard from './ProductCard';
import productsData from '../data/products.json';
import { useAdmin } from '../context/AdminContext';
import AdminProductModal from './AdminProductModal';

export default function ProductGrid({ onOpenModal, products: externalProducts, isAdmin }) {
  const { authFetch } = useAdmin();
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('nombre');
  const [sortOrder, setSortOrder] = useState('asc');

  useEffect(() => {
    if (externalProducts && Array.isArray(externalProducts) && externalProducts.length > 0) {
      setProducts(externalProducts);
      setLoading(false);
    } else {
      fetch('/api/pendientes')
        .then(res => res.ok ? res.json() : [])
        .then(data => {
          setProducts(Array.isArray(data) ? data : []);
          setLoading(false);
        })
        .catch(() => {
          setProducts(Array.isArray(productsData) ? productsData : []);
          setLoading(false);
        });
    }
  }, [externalProducts]);

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/pendientes');
      if (res.ok) {
        const data = await res.json();
        setProducts(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
    }
  };

  const handleEdit = (product) => {
    if (!product) return;
    setEditingProduct(product);
  };

  const handleDelete = async (productId) => {
    if (!productId) return;
    if (!confirm('¿Estás seguro de que quieres eliminar este producto?')) return;
    
    try {
      const res = await authFetch(`/api/pendientes/${productId}`, {
        method: 'DELETE',
      });
      
      if (res.ok) {
        setProducts(prev => prev.filter(p => String(p.id) !== String(productId)));
      } else {
        alert('Error al eliminar producto');
      }
    } catch (err) {
      console.error('Error deleting product:', err);
      alert('Error de conexión');
    }
  };

  const handleSaveProduct = async (productData, productId = null) => {
    try {
      const url = productId 
        ? `/api/pendientes/${productId}`
        : '/api/pendientes';
      
      const method = productId ? 'PUT' : 'POST';
      
      const res = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      });

      if (res.ok) {
        await fetchProducts();
        setEditingProduct(null);
      } else {
        alert('Error al guardar producto');
      }
    } catch (err) {
      console.error('Error saving product:', err);
      alert('Error de conexión');
    }
  };

  const categories = ['all', ...new Set((products || []).map(p => p.categoria).filter(Boolean))];

  const filteredProducts = (selectedCategory === 'all' 
    ? (products || [])
    : (products || []).filter(p => p.categoria === selectedCategory)
  ).filter(p => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return p.nombre?.toLowerCase().includes(search) || 
           p.descripcion?.toLowerCase().includes(search) ||
           p.categoria?.toLowerCase().includes(search);
  }).sort((a, b) => {
    let comparison = 0;
    if (sortBy === 'precio') {
      comparison = (a.precio || 0) - (b.precio || 0);
    } else if (sortBy === 'nombre') {
      comparison = (a.nombre || '').localeCompare(b.nombre || '');
    } else if (sortBy === 'reciente') {
      comparison = (b.id || 0) - (a.id || 0);
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  if (loading) {
    return (
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <section id="products" className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-center text-primary mb-8">
            {isAdmin ? 'Gestión de Productos' : 'Nuestra Colección'}
          </h2>

          {isAdmin && (
            <div className="flex justify-center mb-6">
              <button
                onClick={() => setEditingProduct({})}
                className="px-6 py-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors font-semibold"
              >
                + Nuevo Producto
              </button>
            </div>
          )}

          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedCategory === cat
                    ? 'bg-primary text-white'
                    : 'bg-secondary text-gray-600 hover:bg-accent hover:text-white'
                }`}
              >
                {cat === 'all' ? 'Todos' : cat}
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mb-8 items-center justify-between">
            <div className="relative w-full sm:w-auto">
              <input
                type="text"
                placeholder="Buscar productos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-64 px-4 py-2 pl-10 border border-gray-300 rounded-full focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Ordenar:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-full text-sm focus:ring-2 focus:ring-primary"
              >
                <option value="nombre">Nombre</option>
                <option value="precio">Precio</option>
                <option value="reciente">Más Reciente</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="p-2 border border-gray-300 rounded-full hover:bg-gray-100"
                title={sortOrder === 'asc' ? 'Ascendente' : 'Descendente'}
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map(product => (
              product ? (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  onOpenModal={onOpenModal}
                  isAdmin={isAdmin}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ) : null
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <p className="text-center text-gray-500 py-10">
              No hay productos en esta categoría
            </p>
          )}
        </div>
      </section>

      {editingProduct && (
        <AdminProductModal
          product={editingProduct}
          onClose={() => setEditingProduct(null)}
          onSave={handleSaveProduct}
        />
      )}
    </>
  );
}
