import { useState, useEffect } from 'react';
import { useAdmin } from '../context/AdminContext';
import ImageUploader from './ImageUploader';

export default function AdminProductModal({ product, onClose, onSave }) {
  const { authFetch } = useAdmin();
  const [categories, setCategories] = useState(['Aros', 'Largos', 'Elegantes', 'De Diario', 'Otros']);
  const [newCategory, setNewCategory] = useState('');
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    precio: 0,
    stock: 0,
    categoria: 'Aros',
    descripcion: '',
    colors: [],
    imagen: '',
    imagen_principal: '',
    fotos: [],
  });
  const [colorsInput, setColorsInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (product) {
      setFormData({
        nombre: product.nombre || '',
        precio: product.precio || 0,
        stock: product.stock || 0,
        categoria: product.categoria || 'Aros',
        descripcion: product.descripcion || '',
        colors: product.colors || [],
        imagen: product.imagen || '',
        imagen_principal: product.imagen_principal || product.imagen || '',
        fotos: product.fotos || product.photos || [],
      });
      setColorsInput(product.colors ? product.colors.join(', ') : '');
    }
  }, [product]);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setCategories(data.map(c => c.nombre || c.name || c));
        }
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;
    try {
      const res = await authFetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: newCategory.trim() }),
      });
      if (res.ok) {
        setCategories(prev => [...prev, newCategory.trim()]);
        setFormData(prev => ({ ...prev, categoria: newCategory.trim() }));
        setNewCategory('');
        setShowNewCategory(false);
      }
    } catch (err) {
      console.error('Error adding category:', err);
      alert('Error al crear categoría');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'precio' || name === 'stock' ? parseFloat(value) || 0 : value
    }));
  };

  const handleColorsChange = (e) => {
    const value = e.target.value;
    setColorsInput(value);
    const colors = value.split(',').map(c => c.trim()).filter(c => c);
    setFormData(prev => ({ ...prev, colors }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    
    const dataToSave = {
      ...formData,
      imagen: formData.fotos?.[0] || formData.imagen_principal || formData.imagen,
      imagen_principal: formData.imagen_principal || formData.fotos?.[0] || '',
    };
    
    try {
      await onSave(dataToSave, product?.id);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      ></div>
      
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-gray-100 rounded-full hover:bg-gray-200"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-6">
          <h2 className="text-2xl font-bold text-primary mb-6">
            {product ? 'Editar Producto' : 'Nuevo Producto'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre
              </label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Precio (€)
                </label>
                <input
                  type="number"
                  name="precio"
                  value={formData.precio}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stock
                </label>
                <input
                  type="number"
                  name="stock"
                  value={formData.stock}
                  onChange={handleChange}
                  min="0"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categoría
              </label>
              {showNewCategory ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="Nueva categoría"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={handleAddCategory}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                  >
                    Añadir
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowNewCategory(false); setNewCategory(''); }}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                  >
                    X
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <select
                    name="categoria"
                    value={formData.categoria}
                    onChange={handleChange}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowNewCategory(true)}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-accent"
                    title="Crear nueva categoría"
                  >
                    + Nueva
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <textarea
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                rows="3"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Detalles del producto (materiales, tamaño...)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Colores (separados por coma)
              </label>
              <input
                type="text"
                value={colorsInput}
                onChange={handleColorsChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Ej: Rojo, Azul, Verde"
              />
            </div>

            <div>
              <ImageUploader
                label="Imagen Principal"
                maxFiles={1}
                onUploadComplete={(urls) => {
                  setFormData(prev => ({
                    ...prev,
                    imagen_principal: urls[0] || prev.imagen_principal,
                  }));
                }}
                existingImages={formData.imagen_principal ? [formData.imagen_principal] : []}
              />
            </div>

            <div>
              <ImageUploader
                label="Fotos de Galería"
                maxFiles={10}
                onUploadComplete={(urls) => {
                  setFormData(prev => ({
                    ...prev,
                    fotos: urls,
                    imagen_principal: prev.imagen_principal || urls[0] || '',
                  }));
                }}
                existingImages={formData.fotos || []}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 py-3 px-4 bg-primary text-white rounded-lg hover:bg-accent transition-colors disabled:opacity-50"
              >
                {isSaving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
