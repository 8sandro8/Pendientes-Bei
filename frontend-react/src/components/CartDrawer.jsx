import { useState } from 'react';
import { useCart } from '../context/CartContext';
import TrustBadges from './TrustBadges';

const SHIPPING_COST = 4;
const FREE_SHIPPING_THRESHOLD = 30;

export default function CartDrawer() {
  const { items, isOpen, toggleCart, removeFromCart, updateQuantity, clearCart, totalPrice } = useCart();
  const [checkoutMode, setCheckoutMode] = useState(false);
  const [customer, setCustomer] = useState({
    nombre: '',
    apellidos: '',
    email: '',
    telefono: '',
    direccion: ''
  });
  const [shippingMethod, setShippingMethod] = useState('recogida');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  if (!isOpen) return null;

  const shippingCost = (shippingMethod === 'domicilio' && totalPrice < FREE_SHIPPING_THRESHOLD) ? SHIPPING_COST : 0;
  const finalTotal = totalPrice + shippingCost;
  const freeShippingRemaining = FREE_SHIPPING_THRESHOLD - totalPrice;

  const getShippingLabel = () => {
    if (shippingMethod === 'mano') return 'Entrega en mano';
    return 'Envío a domicilio';
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCustomer(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    if (items.length === 0) return;

    setIsSubmitting(true);

    try {
      const orderData = {
        items: items.map(item => ({
          id: item.product.id,
          qty: item.quantity,
          color: item.selectedColor
        })),
        customer,
        shippingMethod,
        shippingCost,
        subtotal: totalPrice,
        total: finalTotal
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });

      if (res.ok) {
        setOrderSuccess(true);
        clearCart();
      } else {
        const data = await res.json();
        alert(data.message || 'Error al procesar el pedido');
      }
    } catch (err) {
      alert('Error de conexión. Inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setCheckoutMode(false);
    setOrderSuccess(false);
    setCustomer({
      nombre: '',
      apellidos: '',
      email: '',
      telefono: '',
      direccion: ''
    });
    setShippingMethod('mano');
    toggleCart();
  };

  if (orderSuccess) {
    return (
      <div className="fixed inset-0 z-50">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose}></div>
        <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl flex flex-col items-center justify-center p-8 text-center">
          <div className="w-20 h-20 bg-success rounded-full flex items-center justify-center mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="font-display text-2xl font-bold text-primary mb-2">¡Pedido Recibido!</h2>
          <p className="text-gray-600 mb-4">
            Gracias por tu compra. Recibirás un email de confirmación en <strong>{customer.email}</strong>
          </p>
          {shippingMethod === 'mano' && (
            <p className="text-sm text-success mb-4">
              📍 Te contactaremos para coordinar la entrega en mano
            </p>
          )}
          {shippingMethod === 'domicilio' && (
            <p className="text-sm text-gray-500 mb-4">
              📦 Tu pedido será enviado a: <strong>{customer.direccion}</strong>
            </p>
          )}
          <button
            onClick={handleClose}
            className="px-8 py-3 bg-primary text-white rounded-full font-semibold hover:bg-accent transition-colors"
          >
            Continuar Comprando
          </button>
        </div>
      </div>
    );
  }

  if (checkoutMode) {
    return (
      <div className="fixed inset-0 z-50">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose}></div>
        <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl flex flex-col">
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="font-display text-xl font-bold">Finalizar Pedido</h2>
            <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmitOrder} className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="bg-primary/5 p-4 rounded-lg">
              <h3 className="font-semibold text-primary mb-3">Método de entrega</h3>
              <p className="text-xs text-gray-500 mb-3">* Solo envíos dentro de España</p>
              <div className="space-y-2">
                <label className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${shippingMethod === 'mano' ? 'border-primary bg-white' : 'border-gray-200 hover:border-gray-300'}`}>
                  <input
                    type="radio"
                    name="shipping"
                    value="mano"
                    checked={shippingMethod === 'mano'}
                    onChange={() => setShippingMethod('mano')}
                    className="mr-3"
                  />
                  <div className="flex-1">
                    <span className="font-medium">Entrega en mano</span>
                    <p className="text-sm text-gray-500">Entrega directa a conocidos</p>
                  </div>
                  <span className="text-success font-semibold">Gratis</span>
                </label>
                <label className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${shippingMethod === 'domicilio' ? 'border-primary bg-white' : 'border-gray-200 hover:border-gray-300'}`}>
                  <input
                    type="radio"
                    name="shipping"
                    value="domicilio"
                    checked={shippingMethod === 'domicilio'}
                    onChange={() => setShippingMethod('domicilio')}
                    className="mr-3"
                  />
                  <div className="flex-1">
                    <span className="font-medium">Envío a domicilio</span>
                    <p className="text-sm text-gray-500">Entrega en 24-72h (solo España)</p>
                  </div>
                  {totalPrice >= FREE_SHIPPING_THRESHOLD ? (
                    <span className="text-success font-semibold">Gratis</span>
                  ) : (
                    <span className="text-accent font-semibold">{SHIPPING_COST}€</span>
                  )}
                </label>
              </div>
              {shippingMethod === 'domicilio' && totalPrice < FREE_SHIPPING_THRESHOLD && (
                <p className="text-sm text-accent mt-2">
                  Añade {freeShippingRemaining.toFixed(2)}€ más para envío gratuito 🎉
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
              <input
                type="text"
                name="nombre"
                value={customer.nombre}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Tu nombre"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Apellidos</label>
              <input
                type="text"
                name="apellidos"
                value={customer.apellidos}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Tus apellidos"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input
                type="email"
                name="email"
                value={customer.email}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="tu@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono *</label>
              <input
                type="tel"
                name="telefono"
                value={customer.telefono}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="+34 600 000 000"
              />
            </div>
            {shippingMethod === 'domicilio' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dirección de envío *</label>
                <textarea
                  name="direccion"
                  value={customer.direccion}
                  onChange={handleInputChange}
                  required
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Calle, número, pueblo, provincia..."
                />
              </div>
            )}
            {shippingMethod === 'mano' && (
              <div className="bg-success/10 p-3 rounded-lg text-sm text-success">
                <p><strong>Entrega en mano:</strong> Si eres familiar, amigo o conocido nuestro, podemos entregarte el pedido directamente. ¡Sin compromiso! Te escribiremos por WhatsApp para coordinar la entrega.</p>
              </div>
            )}

            <div className="pt-4 border-t">
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span>{totalPrice}€</span>
                </div>
                {shippingCost > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Envío</span>
                    <span>{shippingCost}€</span>
                  </div>
                )}
                {shippingMethod === 'domicilio' && totalPrice >= FREE_SHIPPING_THRESHOLD && (
                  <div className="flex justify-between text-sm text-success">
                    <span>Envío</span>
                    <span className="line-through">4€</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-lg font-medium">Total a pagar:</span>
                  <span className="text-2xl font-bold text-accent">{finalTotal}€</span>
                </div>
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-primary text-white rounded-full font-semibold hover:bg-accent transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Procesando...' : `Confirmar Pedido (${finalTotal}€)`}
              </button>
              <button
                type="button"
                onClick={() => setCheckoutMode(false)}
                className="w-full py-2 mt-2 text-gray-500 hover:text-primary text-sm"
              >
                ← Volver al carrito
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      ></div>

      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="font-display text-xl font-bold">Tu Carrito</h2>
          <button 
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {items.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <p>Tu carrito está vacío</p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map(item => (
                <div key={`${item.product.id}-${item.selectedColor}`} className="flex gap-4 bg-gray-50 p-3 rounded-lg">
                  <img 
                    src={item.product.imagen} 
                    alt={item.product.nombre}
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h4 className="font-semibold text-primary">{item.product.nombre}</h4>
                    {item.selectedColor && (
                      <p className="text-sm text-gray-500">{item.selectedColor}</p>
                    )}
                    <p className="text-accent font-bold">{item.product.precio}€</p>
                    
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.selectedColor, item.quantity - 1)}
                          className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300"
                        >
                          -
                        </button>
                        <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.selectedColor, item.quantity + 1)}
                          className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300"
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.product.id, item.selectedColor)}
                        className="text-error hover:text-red-700"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="p-4 border-t bg-gray-50">
            <div className="mb-4">
              <TrustBadges />
            </div>
            {totalPrice < FREE_SHIPPING_THRESHOLD && (
              <div className="bg-accent/10 text-accent text-sm p-2 rounded-lg mb-3 text-center">
                ¡Envío gratis a partir de {FREE_SHIPPING_THRESHOLD}€! <br/>
                Faltan {freeShippingRemaining.toFixed(2)}€
              </div>
            )}
            {totalPrice >= FREE_SHIPPING_THRESHOLD && (
              <div className="bg-success/10 text-success text-sm p-2 rounded-lg mb-3 text-center">
                🎉 ¡Envío gratuito incluido!
              </div>
            )}
            <div className="flex justify-between items-center mb-4">
              <span className="text-lg font-medium">Total:</span>
              <span className="text-2xl font-bold text-accent">{totalPrice}€</span>
            </div>
            <button
              onClick={() => setCheckoutMode(true)}
              className="w-full py-3 bg-primary text-white rounded-full font-semibold hover:bg-accent transition-colors mb-2"
            >
              Finalizar Compra
            </button>
            <button
              onClick={clearCart}
              className="w-full py-2 text-gray-500 hover:text-error text-sm"
            >
              Vaciar carrito
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
