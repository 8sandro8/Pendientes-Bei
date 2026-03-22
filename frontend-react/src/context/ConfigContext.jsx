import { createContext, useContext, useState, useEffect } from 'react';

const ConfigContext = createContext();

export function ConfigProvider({ children }) {
  const [config, setConfig] = useState({ whatsappNumber: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/config')
      .then(res => res.ok ? res.json() : {})
      .then(data => {
        setConfig(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <ConfigContext.Provider value={{ config, loading }}>
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig() {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
}