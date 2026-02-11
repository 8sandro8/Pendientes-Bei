# Usamos una imagen base de Node.js ligera
FROM node:18-alpine

# Establecemos el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copiamos los archivos de dependencias primero para aprovechar la caché de Docker
COPY backend/package*.json ./backend/

# Instalamos las dependencias
WORKDIR /app/backend
RUN npm install --production

# Copiamos el resto del código
COPY backend/ ./
COPY frontend/ ../frontend/

# Exponemos el puerto
EXPOSE 3000

# Comando para iniciar la aplicación
CMD ["node", "index.js"]
