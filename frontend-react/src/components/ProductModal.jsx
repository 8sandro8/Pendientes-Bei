import { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import useToast from '../hooks/useToast';

export default function ProductModal({ product, onClose, relatedProducts = [], onSelectProduct }) {
  const { addToCart } = useCart();
  const { addToast } = useToast();
  const [selectedColor, setSelectedColor] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [fotos, setFotos] = useState([]);
  const [fotoActual, setFotoActual] = useState(0);

  useEffect(() => {
    if (product) {
      setSelectedColor(product.colors?.[0] || null);
      const todasFotos = [];
      if (product.imagen_principal) {
        todasFotos.push(product.imagen_principal);
      } else if (product.imagen) {
        todasFotos.push(product.imagen);
      }
      if (product.fotos && Array.isArray(product.fotos)) {
        product.fotos.forEach(f => {
          if (!todasFotos.includes(f)) todasFotos.push(f);
        });
      }
      setFotos(todasFotos.length > 0 ? todasFotos : ['/images/placeholder.jpg']);
      setFotoActual(0);
    }
  }, [product]);

  if (!product) return null;

  const handleAdd = () => {
    addToCart(product, selectedColor, quantity);
    addToast('✓ Añadido al carrito', 'success');
    setAdded(true);
    setTimeout(() => {
      onClose();
      setAdded(false);
    }, 1000);
  };

  const handleSelectRelated = (relatedProduct) => {
    onSelectProduct(relatedProduct);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      ></div>
      
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-white/80 rounded-full hover:bg-gray-100"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="grid md:grid-cols-[1fr_1fr]">
          <div className="flex flex-col">
            <div className="aspect-square bg-gray-100 relative">
              <img 
                src={fotos[fotoActual]} 
                alt={product.nombre}
                className="w-full h-full object-cover"
              />
              {fotos.length > 1 && (
                <>
                  <button 
                    onClick={() => setFotoActual(f => (f > 0 ? f - 1 : fotos.length - 1))}
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 rounded-full hover:bg-white hidden md:block"
                  >
                    ‹
                  </button>
                  <button 
                    onClick={() => setFotoActual(f => (f < fotos.length - 1 ? f + 1 : 0))}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 rounded-full hover:bg-white hidden md:block"
                  >
                    ›
                  </button>
                </>
              )}
            </div>
            
            {/* Thumbnail Strip - Desktop & Mobile */}
            {fotos.length > 1 && (
              <div className="p-4">
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {fotos.map((foto, idx) => (
                    <button
                      key={idx}
                      onClick={() => setFotoActual(idx)}
                      className={`flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden border-2 transition-all ${
                        idx === fotoActual ? 'border-accent ring-2 ring-accent/30' : 'border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      <img 
                        src={foto} 
                        alt={`Foto ${idx + 1}`}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="p-6 flex flex-col">
            <h3 className="font-display text-2xl font-bold text-primary">
              {product.nombre}
            </h3>
            
            <p className="text-3xl font-bold text-accent mt-2">
              {product.precio}€
            </p>

            {product.categoria && (
              <span className="inline-block mt-2 text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full self-start">
                {product.categoria}
              </span>
            )}

            {product.descripcion && (
              <p className="mt-3 text-sm text-gray-600">{product.descripcion}</p>
            )}

            {product.colors && product.colors.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Color:</p>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map(color => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`px-3 py-1 rounded-full text-sm border-2 transition-all ${
                        selectedColor === color
                          ? 'border-accent bg-accent text-white'
                          : 'border-gray-300 hover:border-accent'
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {product.stock > 0 ? (
              <>
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Cantidad:</p>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setQuantity(q => Math.max(1, q - 1))}
                      className="w-10 h-10 rounded-full border-2 border-gray-300 flex items-center justify-center hover:border-accent"
                    >
                      -
                    </button>
                    <span className="text-xl font-semibold w-8 text-center">{quantity}</span>
                    <button
                      onClick={() => setQuantity(q => q + 1)}
                      className="w-10 h-10 rounded-full border-2 border-gray-300 flex items-center justify-center hover:border-accent"
                    >
                      +
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleAdd}
                  disabled={added}
                  className={`mt-6 w-full py-3 rounded-full font-semibold transition-all hover:opacity-90 transition-colors ${
                    added
                      ? 'bg-success text-white'
                      : 'bg-primary text-white hover:bg-accent'
                  }`}
                >
                  {added ? '✓ Añadido' : 'Añadir al carrito'}
                </button>
              </>
            ) : (
              <button
                disabled
                className="mt-6 w-full py-3 rounded-full font-semibold bg-gray-300 text-gray-500 cursor-not-allowed"
              >
                Agotado
              </button>
            )}
          </div>
        </div>

        {relatedProducts.length > 0 && (
          <div className="p-6 border-t">
            <h4 className="font-display text-lg font-semibold text-primary mb-4">
              También te pueden gustar
            </h4>
            <div className="grid grid-cols-4 gap-3">
              {relatedProducts.map(related => (
                <button
                  key={related.id}
                  onClick={() => handleSelectRelated(related)}
                  className="group text-left"
                >
                  <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-2">
                    <img 
                      src={related.imagen} 
                      alt={related.nombre}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                  <p className="text-sm font-medium text-primary truncate">{related.nombre}</p>
                  <p className="text-sm font-bold text-accent">{related.precio}€</p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
