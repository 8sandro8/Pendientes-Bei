export default function TrustBadges() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:justify-center sm:gap-4">
      <div className="flex items-center gap-2 px-3 py-2 bg-accent/10 rounded-lg">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <span className="text-sm text-white font-medium drop-shadow-sm">Pago 100% Seguro</span>
      </div>

      <div className="flex items-center gap-2 px-3 py-2 bg-accent/10 rounded-lg">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
        </svg>
        <span className="text-sm text-white font-medium drop-shadow-sm">Envío Gratis +30€</span>
      </div>

      <div className="flex items-center gap-2 px-3 py-2 bg-accent/10 rounded-lg col-span-2 sm:col-span-auto">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
        <span className="text-sm text-white font-medium drop-shadow-sm">100% Hecho a Mano</span>
      </div>
    </div>
  );
}