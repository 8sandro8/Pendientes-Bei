import { useState, useEffect } from 'react';

const DEFAULT_MESSAGE = "🌸 Envío gratis en pedidos +30€ Solo envíos en España 🌸";

export default function SeasonalBanner({ message = DEFAULT_MESSAGE }) {
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('bannerDismissed') === 'true';
    }
    return false;
  });

  useEffect(() => {
    localStorage.setItem('bannerDismissed', dismissed.toString());
  }, [dismissed]);

  if (dismissed) return null;

  return (
    <div className="bg-accent text-white py-2 px-4 w-full">
      <div className="max-w-7xl mx-auto flex items-center justify-center relative">
        <span className="text-sm sm:text-base font-medium text-center">
          {message}
        </span>
        <button
          onClick={() => setDismissed(true)}
          className="absolute right-0 top-1/2 -translate-y-1/2 text-white/80 hover:text-white transition-colors p-2"
          aria-label="Cerrar"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
