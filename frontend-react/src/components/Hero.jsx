export default function Hero() {
  const scrollToProducts = () => {
    document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-b from-secondary via-white to-white">
      <div className="absolute inset-0 bg-[url('/images/bg-marble.png')] bg-cover bg-center bg-no-repeat opacity-20"></div>
      
      <div className="relative z-10 text-center px-4 max-w-3xl">
        <h1 className="font-display text-5xl md:text-7xl font-bold text-primary mb-6">
          Colección Exclusiva
        </h1>
        <p className="text-lg md:text-xl text-gray-600 mb-8 font-light">
          Pendientes artesanales hechos a mano con arcilla polimérica
        </p>
        <button 
          onClick={scrollToProducts}
          className="px-8 py-3 bg-primary text-white font-semibold rounded-full hover:bg-accent transition-colors duration-300"
        >
          Ver Colección
        </button>
      </div>

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </div>
    </section>
  );
}
