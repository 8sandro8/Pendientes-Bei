import { useFavorites } from '../context/FavoritesContext';
import ProductCard from './ProductCard';

export default function FavoritesPage({ onClose, onOpenModal }) {
  const { favorites } = useFavorites();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      ></div>
      
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold text-primary">
            Mis Favoritos ❤️
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {favorites.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🤍</div>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No tienes favoritos</h3>
              <p className="text-gray-500">Guarda tus pendientes favoritos haciendo clic en el corazón</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {favorites.map(product => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  onOpenModal={onOpenModal}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
