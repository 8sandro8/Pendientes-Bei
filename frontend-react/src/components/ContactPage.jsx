import { useState } from 'react';
import { useI18n } from '../context/I18nContext';

export default function ContactPage({ onClose }) {
  const { t } = useI18n();
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    mensaje: ''
  });
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        setEnviado(true);
        setFormData({ nombre: '', email: '', telefono: '', mensaje: '' });
      } else {
        setError('Error al enviar mensaje. Inténtalo de nuevo.');
      }
    } catch (err) {
      setError('Error de conexión. Inténtalo de nuevo.');
    }
  };

  const whatsappNumber = "34645599038";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      ></div>
      
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-gray-100 rounded-full hover:bg-gray-200"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-8">
          <h2 className="font-display text-3xl font-bold text-primary text-center mb-2">
            Contacto
          </h2>
          <p className="text-center text-gray-500 mb-6">
            ¿Tienes dudas? ¡Escríbenos!
          </p>

          {enviado ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">✅</div>
              <h3 className="text-xl font-semibold text-green-600 mb-2">¡Mensaje enviado!</h3>
              <p className="text-gray-600">Te responderemos lo antes posible.</p>
              <button
                onClick={() => setEnviado(false)}
                className="mt-4 text-primary hover:underline"
              >
                Enviar otro mensaje
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Tu nombre"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="tu@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono
                </label>
                <input
                  type="tel"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="+34 600 000 000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mensaje *
                </label>
                <textarea
                  name="mensaje"
                  value={formData.mensaje}
                  onChange={handleChange}
                  required
                  rows="4"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="¿En qué podemos ayudarte?"
                />
              </div>

              {error && (
                <p className="text-red-500 text-sm text-center">{error}</p>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-primary text-white rounded-lg hover:bg-accent transition-colors font-semibold"
              >
                Enviar Mensaje
              </button>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-gray-300"></div>
                <span className="flex-shrink mx-4 text-gray-400">o</span>
                <div className="flex-grow border-t border-gray-300"></div>
              </div>

              <a
                href={`https://wa.me/${whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent('Hola, tengo una pregunta...')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-semibold"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.625.712.227 1.36.194 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297a11.815 11.815 0 00-1.712-4.208.485.485 0 00-.52-.063c-.621.213-1.29.563-1.771 1.015-.245.227-.551.349-.817.35l-.214-.001c-.355 0-.696.095-.999.35-.199.15-.409.254-.621.254-.213 0-.416-.105-.562-.279a.485.485 0 00-.063-.52c.22-.621.563-1.29 1.015-1.771a11.788 11.788 0 013.207-2.208 11.823 11.823 0 00-1.712-4.199.485.485 0 00-.52-.063c-.621.213-1.29.563-1.771 1.015a9.884 9.884 0 00-4.208 3.207 11.775 11.775 0 00.35.817l-.001.214c.002.355.095.696.35.999.15.199.347.409.562.28.621-.214 1.29-.564 1.771-1.015.245-.227.551-.349.817-.349l.214.001c.355 0 .696-.095.999-.35.199-.15.409-.254.621-.254.213 0 .416.105.562.28.22.62.164 1.29-.103 1.771-.267.482-1.091 1.706-2.199 2.814-.442.444-.977.816-1.542 1.125l-.215.001z"/>
                </svg>
                Chatear por WhatsApp
              </a>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
