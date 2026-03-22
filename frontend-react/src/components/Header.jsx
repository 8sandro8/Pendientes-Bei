import { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useAdmin } from '../context/AdminContext';

export default function Header({ onLoginSuccess, onShowOrders }) {
  const { toggleCart, totalItems } = useCart();
  const { isAuthenticated, login, logout } = useAdmin();
  const [scrolled, setScrolled] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    const success = await login(password);
    if (success) {
      setShowLogin(false);
      setPassword('');
      if (onLoginSuccess) onLoginSuccess();
    } else {
      setLoginError('Contraseña incorrecta');
    }
  };

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/95 backdrop-blur-sm shadow-md' : 'bg-transparent'
      }`}>

        <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex-1"></div>
          
          <div className="flex flex-col items-center">
            <span className="font-display text-2xl md:text-3xl font-bold tracking-widest text-primary">Harmony Clay</span>
            <img 
              src="/images/logo-harmony.jpg" 
              alt="Logo" 
              className="h-24 w-24 md:h-32 md:w-32 object-cover rounded-full cursor-pointer mt-2"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            />
          </div>

          <div className="flex-1 flex justify-end items-center gap-3">
            {isAuthenticated ? (
              <>
                <button 
                  onClick={() => onShowOrders && onShowOrders()}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors text-primary"
                  title="Ver Pedidos"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </button>
                <button 
                  onClick={logout}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors text-primary"
                  title="Cerrar sesión"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </>
            ) : (
              <button 
                onClick={() => setShowLogin(true)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-primary"
                title="Admin"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </button>
            )}
            
            <button 
              onClick={toggleCart}
              className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-accent text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-semibold">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {showLogin && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowLogin(false)}
          ></div>
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
            <button 
              onClick={() => setShowLogin(false)}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <h2 className="text-xl font-bold text-primary mb-4">Acceso Administrador</h2>
            
            <form onSubmit={handleLogin}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contraseña
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="••••••••"
                  required
                />
                {loginError && (
                  <p className="mt-1 text-sm text-red-600">{loginError}</p>
                )}
              </div>
              
              <button
                type="submit"
                className="w-full py-2 px-4 bg-primary text-white rounded-lg hover:bg-accent transition-colors font-semibold"
              >
                Entrar
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
