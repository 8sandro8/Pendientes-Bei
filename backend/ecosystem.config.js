module.exports = {
  apps: [{
    name: "pendientes-app",
    cwd: "/volume1/Compartida/Comun/Pendientes Bei/backend",
    script: "index.js",
    env: {
      NODE_ENV: "production",
      PORT: 3000,
      SECRET_KEY: "tu_clave_secreta_aqui",
      ADMIN_PASSWORD: "coquito.2025",
      EMAIL_USER: "harmonyyclay@gmail.com",
      EMAIL_PASS: "ngkbkfahmqvvjjqb"
    },
    watch: true,
    ignore_watch: ["node_modules", "data", "email_debug.log"],
    max_memory_restart: "200M",
    log_date_format: "YYYY-MM-DD HH:mm Z"
  }]
};