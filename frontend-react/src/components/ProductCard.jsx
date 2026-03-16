import { useState } from 'react';
import { useFavorites } from '../context/FavoritesContext';

export default function ProductCard({ product, onOpenModal, isAdmin, onEdit, onDelete }) {
  const [imageError, setImageError] = useState(false);
  const { isFavorite, toggleFavorite } = useFavorites();

  if (!product) return null;

  const isAvailable = (product.stock || 0) > 0;
  const fotoPrincipal = product.imagen_principal || product.imagen || '/images/placeholder.jpg';
  const isFav = isFavorite(product.id);

  const handleEditClick = (e) => {
    e.stopPropagation();
    if (onEdit) onEdit(product);
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    if (onDelete) onDelete(product.id);
  };

  const handleFavoriteClick = (e) => {
    e.stopPropagation();
    toggleFavorite(product);
  };

  return (
    <div 
      className="group cursor-pointer bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 relative"
      onClick={() => onOpenModal && onOpenModal(product)}
    >
      {isAdmin && (
        <button
          onClick={handleEditClick}
          className="absolute top-2 right-2 z-10 p-2 bg-white rounded-full shadow-md hover:bg-primary hover:text-white transition-colors"
          title="Editar producto"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </button>
      )}
      
      {!isAdmin && (
        <button
          onClick={handleFavoriteClick}
          className={`absolute top-2 right-2 z-10 p-2 rounded-full shadow-md transition-colors ${
            isFav 
              ? 'bg-red-500 text-white hover:bg-red-600' 
              : 'bg-white text-gray-400 hover:text-red-500'
          }`}
          title={isFav ? 'Quitar de favoritos' : 'Añadir a favoritos'}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill={isFav ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>
      )}
      
      <div className="aspect-square relative overflow-hidden bg-gray-100">
        {!imageError ? (
          <img 
            src={fotoPrincipal} 
            alt={product.nombre || 'Producto'}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        
        {!isAvailable && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="bg-error text-white px-4 py-2 rounded-full text-sm font-semibold">
              Agotado
            </span>
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-display text-lg font-semibold text-primary truncate">
          {product.nombre || 'Sin nombre'}
        </h3>
        <div className="flex items-center justify-between mt-2">
          <span className="text-xl font-bold text-accent">
            {product.precio || 0}€
          </span>
          {isAvailable && (
            <span className="text-xs text-success bg-success/10 px-2 py-1 rounded-full">
              En stock
            </span>
          )}
        </div>
      </div>

      {isAdmin && (
        <div className="p-4 pt-0 flex justify-center">
          <button
            onClick={handleDeleteClick}
            className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
            title="Eliminar producto"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
