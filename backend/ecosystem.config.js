module.exports = {
  apps: [{
    name: "pendientes-app",
    script: "./index.js",
    env: {
      NODE_ENV: "production",
      PORT: 3000,
      SECRET_KEY: "tu_clave_secreta_aqui", // Idealmente usar variables de entorno del sistema
      ADMIN_PASSWORD: "admin123"
    },
    watch: false,
    max_memory_restart: "200M",
    log_date_format: "YYYY-MM-DD HH:mm Z"
  }]
};
